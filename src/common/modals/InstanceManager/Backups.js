import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { faFolder, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Progress } from 'antd';
import styled from 'styled-components';
import makeDir from 'make-dir';
import { ipcRenderer } from 'electron';
import path from 'path';
import {
  createBackup,
  deleteBackup,
  restoreBackup
} from '../../reducers/actions';
import { _getBackupsPath, _getInstance } from '../../utils/selectors';
import { bytesToSize } from '../../utils';
import { BACKUP_CREATION, BACKUP_RESTORE } from '../../reducers/actionTypes';
import { openModal } from '../../reducers/modals/actions';

const Container = styled.div`
  padding: 0.5rem;
  height: 100%;
`;

const Header = styled.div`
  height: 40px;
  width: 100%;
  background: ${props => props.theme.palette.grey[700]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 10px;
`;

const NoItemsContainers = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InnerContainer = styled.div`
  width: 100%;
  height: calc(100% - 20px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;
  padding-bottom: 0.5rem;
  overflow-x: auto;
`;

const List = styled.div`
  width: 100%;
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;
  padding-bottom: 0.5rem;
  overflow-x: auto;
`;

const OpenFolderButton = styled(FontAwesomeIcon)`
  transition: color 0.1s ease-in-out;
  cursor: pointer;
  margin: 0 10px;
  &:hover {
    cursor: pointer;
    path {
      cursor: pointer;
      transition: color 0.1s ease-in-out;
      color: ${props => props.theme.palette.primary.main};
    }
  }
`;

const Row = styled.div`
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props =>
    props.disabled || props.selected
      ? 'transparent'
      : props.theme.palette.grey[800]};
  ${props =>
    props.disabled &&
    !props.selected &&
    `box-shadow: inset 0 0 0 3px ${props.theme.palette.colors.red};`}
  ${props =>
    props.selected &&
    `box-shadow: inset 0 0 0 3px ${props.theme.palette.primary.main};`}
  transition: border 0.1s ease-in-out;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  box-sizing: content-box;
  &:hover {
    .rowCenterContent {
      color: ${props => props.theme.palette.text.primary};
    }
  }
`;

const openFolder = async p => {
  await makeDir(p);
  ipcRenderer.invoke('openFolder', p);
};

const Backups = ({ instanceName }) => {
  const [backups, setBackups] = useState([]);

  const percentage = useSelector(state => state.backups.percentage);
  const allBackups = useSelector(state => state.backups.backups);
  const backupState = useSelector(state => state.backups);
  const startedInstances = useSelector(state => state.startedInstances);

  const instanceConfig = useSelector(state =>
    _getInstance(state)(instanceName)
  );
  const instancesPath = useSelector(_getBackupsPath);

  const dispatch = useDispatch();

  const isPlaying = startedInstances[instanceName];

  useEffect(() => {
    const filteredBackups = allBackups.filter(bk =>
      (instanceConfig.backups || []).includes(bk.name)
    );

    setBackups(filteredBackups);
  }, [allBackups, instanceConfig]);

  const deleteBackupsConfirm = backupName => {
    dispatch(
      openModal('ActionConfirmation', {
        message: 'Are you sure you want to delete this backup(s)?',
        confirmCallback: () => dispatch(deleteBackup(instanceName, backupName)),
        title: 'Confirm'
      })
    );
  };

  const deleteAllBackups = () => {
    dispatch(
      openModal('ActionConfirmation', {
        message: 'Are you sure you want to delete all the backups?',
        confirmCallback: () => {
          backups.map(backup =>
            dispatch(deleteBackup(instanceName, backup.name))
          );
        },
        title: 'Confirm'
      })
    );
  };

  return (
    <Container>
      <Header>
        <div
          css={`
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          `}
        >
          <Button
            type="primary"
            onClick={() => {
              dispatch(createBackup(instanceName));
            }}
            disabled={backupState.instanceName || isPlaying}
          >
            {backupState.instanceName && backupState.status === BACKUP_CREATION
              ? 'Creating Backup'
              : 'Create Backup'}
          </Button>
          <OpenFolderButton
            onClick={() => openFolder(path.join(instancesPath))}
            icon={faFolder}
          />
        </div>
        {backupState.instanceName && backupState.status === BACKUP_CREATION && (
          <Progress percent={percentage} />
        )}
        <FontAwesomeIcon
          css={`
            margin-right: 1rem;
            color: ${props =>
              props.disabled && props.theme.palette.secondary.light};
            &:hover {
              cursor: ${props => !props.disabled && 'pointer'};
              path {
                cursor: ${props => !props.disabled && 'pointer'};
                transition: all 0.1s ease-in-out;
                color: ${props =>
                  !props.disabled && props.theme.palette.error.main};
              }
            }
          `}
          onClick={() => backups.length > 0 && deleteAllBackups()}
          disabled={backups.length === 0}
          icon={faTrash}
        />
      </Header>
      <InnerContainer>
        {backups.length === 0 && (
          <NoItemsContainers>No Mods Available</NoItemsContainers>
        )}
        {backups.length > 0 && (
          <List>
            {backups.map(backup => {
              const timeStamp = backup.name.split('_')[1];

              const dateName = new Date(Number(timeStamp));
              return (
                <Row key={backup.name}>
                  <div
                    css={`
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      gap: 2rem;
                      p {
                        margin: 0;
                      }
                    `}
                  >
                    {`${dateName.toLocaleDateString()} ${dateName.getHours()}:${
                      dateName.getMinutes() === 0 ? '00' : dateName.getMinutes()
                    }`}
                    <p
                      css={`
                        font-weight: 100;
                      `}
                    >
                      {bytesToSize(backup.size)}
                    </p>
                  </div>
                  <div>
                    {backupState.instanceName &&
                      backupState.instanceName === backup.name &&
                      backupState.status === BACKUP_RESTORE && (
                        // <Progress percent={percentage} size="small" />
                        <Progress percent={percentage} steps={10} />
                      )}
                  </div>
                  <div
                    css={`
                      display: flex;
                      justify-content: space-between;
                      align-ittems: center;
                      gap: 1rem;
                    `}
                  >
                    <Button
                      type="primary"
                      onClick={() =>
                        dispatch(restoreBackup(instanceName, backup.name))
                      }
                      disabled={backupState.instanceName || isPlaying}
                      size="small"
                    >
                      Restore
                    </Button>
                    <FontAwesomeIcon
                      css={`
                        &:hover {
                          cursor: pointer;
                          path {
                            cursor: pointer;
                            transition: all 0.1s ease-in-out;
                            color: ${props => props.theme.palette.error.main};
                          }
                        }
                      `}
                      onClick={() => deleteBackupsConfirm(backup.name)}
                      icon={faTrash}
                    />
                  </div>
                </Row>
              );
            })}
          </List>
        )}
      </InnerContainer>
    </Container>
  );
};

export default Backups;
