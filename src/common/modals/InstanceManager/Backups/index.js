import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { _getInstance } from '../../../utils/selectors';
import Header from './Header';
import Row from './Row';

const Container = styled.div`
  padding: 0.5rem;
  height: 100%;
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

const Backups = ({ instanceName }) => {
  const [backups, setBackups] = useState([]);
  const allBackups = useSelector(state => state.backups.backups);

  const instanceConfig = useSelector(state =>
    _getInstance(state)(instanceName)
  );

  useEffect(() => {
    const filteredBackups = allBackups.filter(bk =>
      (instanceConfig.backups || []).includes(bk.name)
    );

    setBackups(filteredBackups);
  }, [allBackups, instanceConfig]);

  return (
    <Container>
      <Header instanceName={instanceName} backups={backups} />
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
                <Row
                  key={backup.name}
                  dateName={dateName}
                  instanceName={instanceName}
                  backup={backup}
                />
              );
            })}
          </List>
        )}
      </InnerContainer>
    </Container>
  );
};

export default Backups;
