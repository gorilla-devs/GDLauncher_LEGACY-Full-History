import React, { useState, useEffect, memo, useRef } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import BackupListWrapper from './BackupListWrapper';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-top: 30px;
`;

const InnerContainer = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 10px 0;
`;

const ImportBackup = ({ setModpack, setVersion, setIsBackup, setStep }) => {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const infiniteLoaderRef = useRef(null);
  const allBackups = useSelector(state => state.backups.backups);

  const loadBackups = () => {
    setBackups(allBackups);
  };

  useEffect(() => {
    setLoading(true);
    loadBackups();
    setLoading(false);
  }, [allBackups]);

  return (
    <Container>
      {/* <div> */}
      <InnerContainer>
        {!loading && backups.length === 0 ? (
          <div
            css={`
              margin-top: 120px;
              display: flex;
              flex-direction: column;
              align-items: center;
              font-size: 150px;
            `}
          >
            <FontAwesomeIcon icon={faExclamationCircle} />
            <div
              css={`
                font-size: 20px;
                margin-top: 70px;
              `}
            >
              No modpack has been found with the current filters.
            </div>
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <BackupListWrapper
                isNextPageLoading={loading}
                items={backups}
                loadNextPage={loadBackups}
                width={width}
                height={height}
                setIsBackup={setIsBackup}
                setStep={setStep}
                setVersion={setVersion}
                setModpack={setModpack}
                infiniteLoaderRef={infiniteLoaderRef}
              />
            )}
          </AutoSizer>
        )}
      </InnerContainer>
      {/* </div> */}
    </Container>
  );
};

export default memo(ImportBackup);
