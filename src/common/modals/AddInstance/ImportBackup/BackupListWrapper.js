import React, { forwardRef, memo, useContext, useEffect } from 'react';
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList as List } from 'react-window';
import ContentLoader from 'react-content-loader';
import styled, { ThemeContext } from 'styled-components';
import { transparentize } from 'polished';

const BackupRow = styled.div`
  background: ${props => props.theme.palette.grey[900]};
`;

const Backup = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 20px;
  padding: 0 10px;
  font-weight: 700;
  background: ${props => transparentize(0.2, props.theme.palette.grey[700])};
`;

const BackupHover = styled.div`
  position: absolute;
  display: flex;
  justify-content: flex-end;
  margin-right: 0.5rem;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  padding-left: 40%;
  will-change: opacity;
  transition: opacity 0.1s ease-in-out, background 0.1s ease-in-out;
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    padding: 0.2rem;
    background-color: transparent;
    border-radius: 4px;
    width: 100px;
    transition: background-color 0.1s ease-in-out;
    &:hover {
      background-color: ${props => props.theme.palette.primary.main};
    }
  }
  &:hover {
    opacity: 1;
  }
`;

const BackupLoader = memo(
  ({ height, width, top, isNextPageLoading, hasNextPage, loadNextPage }) => {
    const ContextTheme = useContext(ThemeContext);

    useEffect(() => {
      if (hasNextPage && isNextPageLoading) {
        loadNextPage();
      }
    }, []);
    return (
      <ContentLoader
        speed={2}
        foregroundColor={ContextTheme.palette.grey[900]}
        backgroundColor={ContextTheme.palette.grey[800]}
        title={false}
        height={height}
        style={{
          width: width - 8,
          height,
          position: 'absolute',
          margin: 0,
          padding: 0,
          top,
          borderRadius: 4
        }}
      >
        <rect x="0" y="0" width="100%" height={height} />
      </ContentLoader>
    );
  }
);

const BackupListWrapper = ({
  // Are there more items to load?
  // (This information comes from the most recent API request.)
  hasNextPage,

  // Are we currently loading a page of items?
  // (This may be an in-flight flag in your Redux store for example.)
  isNextPageLoading,

  // Array of items loaded so far.
  items,

  height,

  width,

  setStep,

  setVersion,
  // Callback function responsible for loading the next page of items.
  loadNextPage,

  setModpack,

  infiniteLoaderRef,
  setIsBackup
}) => {
  // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const itemCount = hasNextPage ? items.length + 1 : items.length;
  // Only load 1 page of items at a time.
  // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
  const loadMoreItems = isNextPageLoading ? () => {} : loadNextPage;
  // Every row is loaded except for our loading indicator row.
  const isItemLoaded = index => !hasNextPage || index < items.length;

  const Item = memo(({ index, style }) => {
    const backup = items[index];

    if (!backup) {
      return (
        <BackupLoader
          hasNextPage={hasNextPage}
          isNextPageLoading={isNextPageLoading}
          loadNextPage={loadNextPage}
          top={style.top + (index === 0 ? 0 : 8)}
          width={width}
          height={style.height - (index === 0 ? 0 : 8)}
        />
      );
    }

    return (
      <BackupRow
        // eslint-disable-next-line
        style={{
          ...style,
          top: style.top + (index === 0 ? 0 : 8),
          height: style.height - (index === 0 ? 0 : 8),
          position: 'absolute',
          width: width - 8,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          margin: 0,
          borderRadius: 4
        }}
        key={backup.name}
      >
        <Backup>
          <div>{backup.name}</div>
        </Backup>
        <BackupHover>
          <div
            onClick={() => {
              const backupName = backup.name.split('.')[0].split('_')[0];

              setModpack({
                name: backupName,
                backupName: backup.name
              });
              setIsBackup(true);
              setVersion({});
              setStep(1);
            }}
          >
            Import Backup
          </div>
        </BackupHover>
      </BackupRow>
    );
  });

  const innerElementType = forwardRef(({ style, ...rest }, ref) => (
    <div
      ref={ref}
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        ...style,
        paddingTop: 0
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  ));

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount !== 0 ? itemCount : 40}
      loadMoreItems={() => loadMoreItems()}
    >
      {({ onItemsRendered }) => (
        <List
          height={height}
          width={width}
          itemCount={itemCount !== 0 ? itemCount : 40}
          itemSize={100}
          onItemsRendered={onItemsRendered}
          innerElementType={innerElementType}
          ref={list => {
            // Manually bind ref to reset scroll
            // eslint-disable-next-line
            infiniteLoaderRef.current = list;
          }}
        >
          {Item}
        </List>
      )}
    </InfiniteLoader>
  );
};

export default BackupListWrapper;
