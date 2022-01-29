import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Progress } from 'antd';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { deleteBackup, restoreBackup } from '../../../reducers/actions';
import { BACKUP_RESTORE } from '../../../reducers/actionTypes';
import { openModal } from '../../../reducers/modals/actions';
import { bytesToSize } from '../../../utils';

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

const Row = ({ instanceName, dateName, backup }) => {
  const dispatch = useDispatch();
  const backupState = useSelector(state => state.backups);
  const percentage = useSelector(state => state.backups.percentage);

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
          onClick={() => dispatch(restoreBackup(instanceName, backup.name))}
          disabled={
            (backupState.instanceName &&
              backupState.instanceName === backup.name) ||
            isPlaying
          }
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
    </Container>
  );
};

export default Row;
