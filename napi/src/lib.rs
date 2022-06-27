use flate2::{bufread, CrcReader, Decompress, FlushDecompress};
use futures::prelude::*;
use lazy_static::lazy_static;
use lzma::*;
use murmurhash32::murmurhash2;
use napi::{
    bindgen_prelude::*,
    threadsafe_function::{
        ErrorStrategy::{self, CalleeHandled},
        ThreadSafeCallContext, ThreadsafeFunction, ThreadsafeFunctionCallMode,
    },
    Error,
};
use napi_derive::napi;
use notify::{watcher, DebouncedEvent, FsEventWatcher, RecursiveMode, Watcher};
use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicU32, Ordering},
        Arc, Mutex,
    },
    thread,
};
use std::{io::Read, time::Duration};
use std::{path, sync::mpsc::channel};

fn compute_path_murmur(path: String) -> Result<u32> {
    let mut file = std::fs::File::open(path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;
    buffer.retain(|&x| (x != 9 && x != 10 && x != 13 && x != 32));
    Ok(murmurhash2(&buffer))
}

#[napi]
pub async fn compute_murmur(paths: Vec<String>) -> Result<Vec<Result<u32>>> {
    let handle = tokio::task::spawn_blocking(move || {
        let mut result = Vec::new();

        for path in paths {
            let start = std::time::Instant::now();
            let hash = compute_path_murmur(path.to_owned());
            match hash {
                Ok(hash) => result.push(Ok(hash)),
                Err(err) => result.push(Err(err)),
            }
            let time_end = std::time::Instant::now();
            let duration = time_end.duration_since(start);
            println!("compute murmur {} took {}ms", path, duration.as_millis());
        }

        result
    });

    handle
        .await
        .map_err(|_| Error::new(Status::GenericFailure, "Murmur thread failed".to_owned()))
}

lazy_static! {
    static ref WATCHERS_MAP: Mutex<HashMap<u32, FsEventWatcher>> = Mutex::new(HashMap::new());
    static ref WATCHERS_COUNT: AtomicU32 = AtomicU32::new(0);
}

#[napi(object)]
pub enum EventType {
    Create,
    Remove,
    Write,
    Rename,
}

#[napi(object)]
struct JSEvent {
    pub event_type: EventType,
    pub path: String,
    pub old_path: String,
}

const FILES_TO_IGNORE: [&str; 1] = [".DS_Store"];

fn should_file_be_ignored(file: String) -> std::result::Result<String, String> {
    for file_to_ignore in FILES_TO_IGNORE {
        if file.ends_with(file_to_ignore) {
            return Err(format!("{} is ignored", file));
        }
    }
    return Ok(file);
}

impl TryFrom<DebouncedEvent> for JSEvent {
    type Error = String;
    fn try_from(event: DebouncedEvent) -> std::result::Result<Self, Self::Error> {
        Ok(match event {
            DebouncedEvent::Create(path) => JSEvent {
                event_type: EventType::Create,
                path: match path.into_os_string().into_string() {
                    Ok(v) => should_file_be_ignored(v)?,
                    Err(e) => {
                        println!("{:?}", e);
                        return Err("String is invalid".to_owned());
                    }
                },
                old_path: "".to_owned(),
            },
            DebouncedEvent::Write(path) => JSEvent {
                event_type: EventType::Write,
                path: match path.into_os_string().into_string() {
                    Ok(v) => should_file_be_ignored(v)?,
                    Err(e) => {
                        println!("{:?}", e);
                        return Err("String is invalid".to_owned());
                    }
                },
                old_path: "".to_owned(),
            },
            DebouncedEvent::Remove(path) => JSEvent {
                event_type: EventType::Remove,
                path: match path.into_os_string().into_string() {
                    Ok(v) => should_file_be_ignored(v)?,
                    Err(e) => {
                        println!("{:?}", e);
                        return Err("String is invalid".to_owned());
                    }
                },
                old_path: "".to_owned(),
            },
            DebouncedEvent::Rename(old_path, new_path) => JSEvent {
                event_type: EventType::Rename,
                path: match new_path.into_os_string().into_string() {
                    Ok(v) => should_file_be_ignored(v)?,
                    Err(e) => {
                        println!("{:?}", e);
                        return Err("String is invalid".to_owned());
                    }
                },
                old_path: match old_path.into_os_string().into_string() {
                    Ok(v) => should_file_be_ignored(v)?,
                    Err(e) => {
                        println!("{:?}", e);
                        return Err("String is invalid".to_owned());
                    }
                },
            },
            _ => return Err("Unsupported event".to_owned()),
        })
    }
}

#[napi]
pub fn start_notifier(path: String, callback: JsFunction) -> Result<u32> {
    // measure how much time it takes to create the watcher
    let start = std::time::Instant::now();

    let my_ref = WATCHERS_COUNT.fetch_add(1, Ordering::Relaxed);
    let tsfn: ThreadsafeFunction<JSEvent, ErrorStrategy::CalleeHandled> = callback
        .create_threadsafe_function(0, |ctx: ThreadSafeCallContext<JSEvent>| {
            let mut obj = ctx.env.create_object()?;
            obj.set("eventType", ctx.value.event_type)?;
            obj.set("path", ctx.value.path)?;
            obj.set("oldPath", ctx.value.old_path)?;
            Ok(vec![obj])
        })?;

    let (tx, rx) = channel();
    let mut watcher = watcher(tx, Duration::from_millis(2000))
        .map_err(|err| Error::new(Status::GenericFailure, err.to_string()))?;

    watcher
        .watch(&path, RecursiveMode::Recursive)
        .map_err(|err| Error::new(Status::GenericFailure, err.to_string()))?;

    WATCHERS_MAP
        .lock()
        .map_err(|err| Error::new(Status::GenericFailure, err.to_string()))?
        .insert(my_ref, watcher);

    let time_end = std::time::Instant::now();

    let duration = time_end.duration_since(start);

    println!("Watcher init {path} took {}ms", duration.as_millis());

    thread::spawn(move || loop {
        match rx.recv() {
            Ok(event) => {
                println!("RUST EVENT: {:?}", event);

                let event = match event.try_into() {
                    Ok(v) => v,
                    Err(e) => {
                        println!("Skipping {}", e);
                        continue;
                    }
                };

                let tsfn = tsfn.clone();
                tsfn.call(Ok(event), ThreadsafeFunctionCallMode::Blocking);
            }
            Err(_) => break,
        }
    });

    Ok(my_ref)
}

#[napi]
pub fn stop_notifier(id: u32) -> Result<()> {
    let mut watchers = WATCHERS_MAP
        .lock()
        .map_err(|err| Error::new(Status::GenericFailure, err.to_string()))?;

    println!("Stopped watcher {}", id);
    match watchers.remove(&id) {
        Some(_) => Ok(()),
        None => Err(Error::new(
            Status::GenericFailure,
            "Could not remove watcher".to_owned(),
        )),
    }
}
