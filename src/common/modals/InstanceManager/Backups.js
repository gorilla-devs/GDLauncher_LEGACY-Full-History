import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Progress } from 'antd';
import styled from 'styled-components';
import { createBackup, deleteBackup } from '../../reducers/actions';
import { _getInstance } from '../../utils/selectors';

const Container = styled.div`
  padding: 0.5rem;
  flex: 1;
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
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;
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

const Backups = ({ instanceName }) => {
  const [backups, setBackups] = useState([]);

  const percentage = useSelector(state => state.backups.percentage);
  const allBackups = useSelector(state => state.backups.backups);
  const backupsInstanceName = useSelector(state => state.backups.instanceName);
  const instanceConfig = useSelector(state =>
    _getInstance(state)(instanceName)
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const filteredBackups = allBackups.filter(bk =>
      instanceConfig.backups.includes(bk)
    );

    setBackups(filteredBackups);
  }, [allBackups]);

  return (
    <Container>
      <Header>
        <Button
          type="primary"
          onClick={() => {
            dispatch(createBackup(instanceName));
          }}
        >
          Create Backup
        </Button>
        {backupsInstanceName && <Progress percent={percentage} />}
      </Header>
      <InnerContainer>
        {backups.length === 0 && (
          <NoItemsContainers>No Mods Available</NoItemsContainers>
        )}
        {backups.length > 0 &&
          backups.map(backup => (
            <Row key={backup}>
              {backup}
              <div
                css={`
                  display: flex;
                  justify-content: space-between;
                  align-ittems: center;
                  gap: 1rem;
                `}
              >
                <Button type="primary" onClick={() => {}} size="small">
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
                  onClick={() => {
                    dispatch(deleteBackup(instanceName, backup));
                  }}
                  icon={faTrash}
                />
              </div>
            </Row>
          ))}
      </InnerContainer>
    </Container>
  );
};

export default Backups;
