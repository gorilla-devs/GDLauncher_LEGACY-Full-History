package minecraft

import (
	"fmt"
	"gdlib/internal"
	"os"
	"os/exec"
	"path"
	"strings"
)

func Launch(instanceFolderPath string, mcVersion string) error {

	mcMeta, err := ReadMojangMetaJson(mcVersion)

	if err != nil {
		return err
	}

	libraries := GatherLibraries(mcMeta.Libraries)
	instancePath := path.Join(internal.GDL_USER_DATA, internal.GDL_INSTANCES_PREFIX, instanceFolderPath)

	// Extract natives
	err = ExtractNatives(instanceFolderPath, libraries)

	if err != nil {
		return err
	}
	// defer func() {
	// 	err = os.RemoveAll(path.Join(instancePath, "natives"))
	// 	if err != nil {
	// 		fmt.Println(err)
	// 	}
	// }()

	startupString := []string{}
	startupString = append(
		startupString,
		"-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump",
		"-Dos.name=Windows 10",
		"-Dos.version=10.0",
		"-Dos.arch=x64",
		"-Djava.library.path=\""+path.Join(instancePath, "natives")+"\"",
		"-cp",
	)

	libs := []string{}
	for _, lib := range libraries {
		if _, _, ok := IsLibraryNative(lib); !ok {
			libPath := []string{
				internal.GDL_USER_DATA,
				internal.GDL_DATASTORE_PREFIX,
				internal.GDL_LIBRARIES_PREFIX,
			}
			libPath = append(libPath, internal.ConvertMavenToPath(lib.Name, "")...)
			libs = append(libs, path.Join(libPath...))
		}
	}

	// Push main jar
	libs = append(
		libs,
		path.Join(
			internal.GDL_USER_DATA,
			internal.GDL_DATASTORE_PREFIX,
			internal.GDL_LIBRARIES_PREFIX,
			"net",
			"minecraft",
			mcVersion+".jar",
		),
	)

	startupString = append(startupString, strings.Join(libs, ";"))

	startupString = append(
		startupString,
		"-Xmx4096m",
		"-Xms4096m",
		"-Dminecraft.applet.TargetDirectory\""+path.Join(instancePath)+"\"",
		"-Dfml.ignorePatchDiscrepancies=true",
		"-Dfml.ignoreInvalidMinecraftCertificates=true",
		"-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump",
		mcMeta.MainClass,
	)

	assetsPath := path.Join(
		internal.GDL_USER_DATA,
		internal.GDL_DATASTORE_PREFIX,
		"assets",
	)

	mcArgs := strings.Split(mcMeta.MinecraftArguments, " ")
	for _, arg := range mcArgs {
		if strings.Contains(arg, "${auth_player_name}") {
			startupString = append(startupString, strings.Replace(arg, "${auth_player_name}", "killpowa", 1))
		} else if strings.Contains(arg, "${version_name}") {
			startupString = append(startupString, strings.Replace(arg, "${version_name}", mcVersion, 1))
		} else if strings.Contains(arg, "${game_directory}") {
			startupString = append(startupString, strings.Replace(arg, "${game_directory}", instancePath, 1))
		} else if strings.Contains(arg, "${assets_root}") {
			startupString = append(startupString, strings.Replace(arg, "${assets_root}", assetsPath, 1))
		} else if strings.Contains(arg, "${assets_index_name}") {
			startupString = append(startupString, strings.Replace(arg, "${assets_index_name}", mcMeta.Assets, 1))
		} else if strings.Contains(arg, "${auth_uuid}") {
			startupString = append(startupString, strings.Replace(arg, "${auth_uuid}", "XXX", 1))
		} else if strings.Contains(arg, "${auth_access_token}") {
			startupString = append(startupString, strings.Replace(arg, "${auth_access_token}", "XXX", 1))
		} else if strings.Contains(arg, "${user_type}") {
			startupString = append(startupString, strings.Replace(arg, "${user_type}", "mojang", 1))
		} else if strings.Contains(arg, "${version_type}") {
			startupString = append(startupString, strings.Replace(arg, "${version_type}", mcMeta.Type, 1))
		} else {
			startupString = append(startupString, arg)
		}
	}

	fmt.Println(startupString)
	ps := exec.Command("java", startupString...)
	ps.Stdout = os.Stdout
	ps.Stderr = os.Stderr
	ps.Dir = instancePath
	err = ps.Run()
	if err != nil {
		return err
	}

	return nil
}