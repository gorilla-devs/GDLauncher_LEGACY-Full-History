import React, { useState, useEffect } from 'react';
import fse from 'fs-extra';
import path from 'path';
import { Button, Checkbox } from 'antd';
import { useInterval } from 'rooks';
import { useSelector, useDispatch } from 'react-redux';
import Modal from '../components/Modal';
import {
  _getInstancesPath,
  _getInstances,
  _getInstance
} from '../utils/selectors';
import { closeModal } from '../reducers/modals/actions';
import { deleteBackup } from '../reducers/actions';

const InstanceDeleteConfirmation = ({ instanceName }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [deleteBackups, setDeleteBackups] = useState(false);
  const [backups, setBackups] = useState([]);
  const instancesPath = useSelector(_getInstancesPath);
  const instances = useSelector(_getInstances);
  const allBackups = useSelector(state => state.backups.backups);

  const instanceConfig = useSelector(state =>
    _getInstance(state)(instanceName)
  );

  const { start, stop } = useInterval(() => {
    if (!instances.find(instance => instance.name === instanceName)) {
      stop();
      dispatch(closeModal());
    }
  }, 200);

  useEffect(() => {
    console.log('TTTT', instanceConfig, instanceConfig?.backups);
    const filteredBackups = allBackups.filter(bk =>
      (instanceConfig?.backups || []).includes(bk.name)
    );

    setBackups(filteredBackups);
  }, [allBackups, instanceConfig]);

  const deleteInstance = async () => {
    setLoading(true);
    start();
    fse.remove(path.join(instancesPath, instanceName));
    if (deleteBackups) {
      backups.map(backup => dispatch(deleteBackup(instanceName, backup.name)));
    }
  };

  const closeModalWindow = () => dispatch(closeModal());

  return (
    <Modal
      css={`
        height: 40%;
        width: 50%;
        max-width: 550px;
        max-height: 260px;
        overflow-x: hidden;
      `}
      title="Confirm Instance Deletion"
    >
      <div>
        Are you sure you want to delete:
        <h4
          css={`
            font-style: italic;
            font-weight: 700;
            color: ${props => props.theme.palette.error.main};
          `}
        >
          {instanceName}
        </h4>
        This action is permanent and cannot be undone. You will lose all the
        data you have in this instance
        <div
          css={`
            margin: 1rem 0 0;
          `}
        >
          <Checkbox
            checked={deleteBackups}
            onChange={e => setDeleteBackups(e.target.checked)}
          >
            delete all backups
          </Checkbox>
        </div>
        <div
          css={`
            margin-top: 1rem;
            display: flex;
            width: 100%;
            justify-content: space-between;
          `}
        >
          <Button
            onClick={closeModalWindow}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            No, Abort
          </Button>
          <Button onClick={deleteInstance} loading={loading}>
            Yes, Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstanceDeleteConfirmation;
