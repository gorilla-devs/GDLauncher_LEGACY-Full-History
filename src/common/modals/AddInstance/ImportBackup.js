import React, { useState, useEffect, memo } from 'react';
import { Button, Input } from 'antd';
import styled from 'styled-components';
import { transparentize } from 'polished';
import path from 'path';
import { ipcRenderer } from 'electron';

const Container = styled.div`
  width: 100%;
  height: 80%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-top: 30px;
`;

const ImportBackup = ({
  setModpack,
  setVersion,
  importZipPath,
  setImportZipPath,
  setOverrideNextStepOnClick,
  setIsBackup
}) => {
  const [localValue, setLocalValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [importZipPath]);

  useEffect(() => {
    setImportZipPath(localValue?.length > 0 ? localValue : null);
    setVersion(null);
  }, [localValue]);

  const openFileDialog = async () => {
    const dialog = await ipcRenderer.invoke('openFileDialog');
    if (dialog.canceled) return;
    setLocalValue(dialog.filePaths[0]);
  };

  const restoreBackupAsInstance = () => {
    if (loading || !localValue) return;
    setLoading(true);

    const urlRegex = /[a-zA-Z]:(\/|\\)+[a-zA-Z0-9\\-_/-]*(.7z)/gm;
    const isUrlRegex = urlRegex.test(localValue);

    const backupName = path.basename(localValue).split('.')[0].split('_')[0];

    if (isUrlRegex) {
      setModpack({
        name: backupName,
        backupName: path.basename(localValue).split('.')[0]
      });
      setIsBackup(true);
      setVersion({});
      setLoading(false);
      setError(false);
    }
  };

  setOverrideNextStepOnClick(() => restoreBackupAsInstance);

  return (
    <Container>
      <div>
        Local file or link to a direct download
        <div
          css={`
            display: flex;
            margin-top: 20px;
          `}
        >
          <Input
            disabled={loading}
            placeholder="C:\...\file.zip"
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            css={`
              width: 400px !important;
              margin-right: 10px !important;
            `}
          />
          <Button disabled={loading} type="primary" onClick={openFileDialog}>
            Browse
          </Button>
        </div>
        <div
          show={error}
          css={`
            opacity: ${props => (props.show ? 1 : 0)};
            color: ${props => props.theme.palette.error.main};
            font-weight: 700;
            font-size: 14px;
            padding: 3px;
            height: 30px;
            margin-top: 10px;
            text-align: center;
            border-radius: ${props => props.theme.shape.borderRadius};
            background: ${props =>
              transparentize(0.7, props.theme.palette.grey[700])};
          `}
        >
          {error && 'There was an issue while importing.'}
        </div>
      </div>
    </Container>
  );
};

export default memo(ImportBackup);
