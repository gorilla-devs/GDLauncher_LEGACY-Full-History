import React from 'react';
import path from 'path';
import { useDispatch, useSelector } from 'react-redux';
import { faFolder, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Progress } from 'antd';
import styled from 'styled-components';
import { ipcRenderer } from 'electron';
import { deleteBackup, restoreBackup } from '../../../reducers/actions';
import { BACKUP_RESTORE } from '../../../reducers/actionTypes';
import { openModal } from '../../../reducers/modals/actions';
import { bytesToSize } from '../../../utils';
import { _getBackupsPath } from '../../../utils/selectors';

const Container = styled.div`
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

const Row = ({ instanceName, dateName, backup }) => {
  const dispatch = useDispatch();
  const backupState = useSelector(state => state.backups);
  const percentage = useSelector(state => state.backups.percentage);
  const backupsPath = useSelector(_getBackupsPath);

  const startedInstances = useSelector(state => state.startedInstances);
  const isPlaying = startedInstances[instanceName];

  const deleteBackupsConfirm = backupName => {
    dispatch(
      openModal('ActionConfirmation', {
        message: 'Are you sure you want to delete this backup(s)?',
        confirmCallback: () => dispatch(deleteBackup(instanceName, backupName)),
        title: 'Confirm'
      })
    );
  };

  const openItemInFolder = async p => {
    ipcRenderer.invoke('openItemInFolder', p);
  };

  return (
    <Container>
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
          dateName.getMinutes() < 10
            ? `0${dateName.getMinutes()}`
            : dateName.getMinutes()
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
            <Progress percent={percentage} steps={10} />
          )}
      </div>
      <div
        css={`
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        `}
      >
        <OpenFolderButton
          onClick={() =>
            openItemInFolder(path.join(backupsPath, `${backup.name}.7z`))
          }
          icon={faFolder}
        />
        <Button
          type="primary"
          onClick={() => dispatch(restoreBackup(instanceName, backup.name))}
          disabled={
            (backupState.instanceName &&
              backupState.instanceName === backup.name) ||
            isPlaying ||
            (backupState.instanceName && backupState.status === BACKUP_RESTORE)
          }
          size="small"
        >
          Restore
        </Button>
        <FontAwesomeIcon
          css={`
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
          onClick={() => deleteBackupsConfirm(backup.name)}
          icon={faTrash}
          disabled={
            backupState.instanceName &&
            backupState.instanceName === backup.name &&
            backupState.status === BACKUP_RESTORE
          }
        />
      </div>
    </Container>
  );
};

export default Row;
