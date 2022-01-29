import React from 'react';
import { faFolder, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Progress } from 'antd';
import { ipcRenderer } from 'electron';
import makeDir from 'make-dir';
import path from 'path';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { createBackup, deleteBackup } from '../../../reducers/actions';
import { BACKUP_CREATION } from '../../../reducers/actionTypes';
import { openModal } from '../../../reducers/modals/actions';
import { _getBackupsPath } from '../../../utils/selectors';

const Container = styled.div`
  height: 40px;
  width: 100%;
  background: ${props => props.theme.palette.grey[700]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 10px;
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

const openFolder = async p => {
  await makeDir(p);
  ipcRenderer.invoke('openFolder', p);
};

const Header = ({ instanceName, backups }) => {
  const dispatch = useDispatch();
  const backupState = useSelector(state => state.backups);
  const percentage = useSelector(state => state.backups.percentage);
  const instancesPath = useSelector(_getBackupsPath);

  const startedInstances = useSelector(state => state.startedInstances);
  const isPlaying = startedInstances[instanceName];

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
          disabled={
            (backupState.instanceName &&
              backupState.instanceName === instanceName) ||
            isPlaying
          }
        >
          {backupState.instanceName &&
          backupState.instanceName === instanceName &&
          backupState.status === BACKUP_CREATION
            ? 'Creating Backup'
            : 'Create Backup'}
        </Button>
        <OpenFolderButton
          onClick={() => openFolder(path.join(instancesPath))}
          icon={faFolder}
        />
      </div>
      {backupState.instanceName &&
        backupState.instanceName === instanceName &&
        backupState.status === BACKUP_CREATION && (
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
    </Container>
  );
};

export default Header;
