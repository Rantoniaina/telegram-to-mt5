import { Box, Typography, IconButton, Tooltip, keyframes } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState } from 'react';
import syncService from '../../services/syncService';
import ConfirmDialog from '../common/ConfirmDialog';
import { useTranslation } from 'react-i18next';

export interface Sync {
  id: number;
  user_id: number;
  discussion_name: string;
  state: string;
  created_at: string;
  updated_at: string;
}

interface SyncCardProps {
  sync: Sync;
  onSyncUpdated?: (updatedSync: Sync) => void;
  onSyncDeleted?: (syncId: number) => void;
  onClick?: (sync: Sync) => void;
}

// Define breathing animation
const breatheAnimation = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.3);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
`;

// Get status color based on state
export const getStatusColor = (state: string) => {
  switch (state) {
    case 'ACTIVE':
      return '#4CAF50'; // Green
    case 'PAUSED':
      return '#FFA500'; // Orange
    case 'STOPPED':
      return '#757575'; // Grey
    case 'ERROR':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Grey
  }
};

// Get animation parameters based on state
export const getAnimationProps = (state: string) => {
  switch (state) {
    case 'ACTIVE':
      return {
        animation: `${breatheAnimation} 2s infinite`,
        boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.5)',
      };
    case 'PAUSED':
      return {
        animation: `${breatheAnimation} 4s infinite`,
        boxShadow: '0 0 0 0 rgba(255, 165, 0, 0.5)',
      };
    case 'ERROR':
      return {
        animation: `${breatheAnimation} 1.5s infinite`,
        boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.5)',
      };
    default:
      return {
        animation: 'none',
        boxShadow: 'none',
      };
  }
};

type ConfirmAction = 'pause' | 'stop' | 'delete' | null;

export const SyncCard: React.FC<SyncCardProps> = ({
  sync: initialSync,
  onSyncUpdated,
  onSyncDeleted,
  onClick,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [sync, setSync] = useState<Sync>(initialSync);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const updateSyncState = async (newState: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const updatedSync = await syncService.updateSyncState(sync.id, newState);
      setSync(updatedSync);
      if (onSyncUpdated) {
        onSyncUpdated(updatedSync);
      }
    } catch (error) {
      console.error('Error updating sync state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSync = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await syncService.deleteSync(sync.id);
      if (onSyncDeleted) {
        onSyncDeleted(sync.id);
      }
    } catch (error) {
      console.error('Error deleting sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfirmDialogProps = () => {
    switch (confirmAction) {
      case 'pause':
        return {
          title: t('sync.confirmation.pause.title'),
          message: t('sync.confirmation.pause.message', {
            name: sync.discussion_name,
          }),
          confirmButtonText: t('sync.confirmation.pause.button'),
          confirmButtonColor: 'warning' as const,
          onConfirm: () => {
            updateSyncState('PAUSED');
            setConfirmAction(null);
          },
        };
      case 'stop':
        return {
          title: t('sync.confirmation.stop.title'),
          message: t('sync.confirmation.stop.message', {
            name: sync.discussion_name,
          }),
          confirmButtonText: t('sync.confirmation.stop.button'),
          confirmButtonColor: 'error' as const,
          onConfirm: () => {
            updateSyncState('STOPPED');
            setConfirmAction(null);
          },
        };
      case 'delete':
        return {
          title: t('sync.confirmation.delete.title'),
          message: t('sync.confirmation.delete.message', {
            name: sync.discussion_name,
          }),
          confirmButtonText: t('sync.confirmation.delete.button'),
          confirmButtonColor: 'error' as const,
          onConfirm: () => {
            deleteSync();
            setConfirmAction(null);
          },
        };
      default:
        return {
          title: '',
          message: '',
          confirmButtonText: '',
          onConfirm: () => setConfirmAction(null),
        };
    }
  };

  const handleCardClick = (event: React.MouseEvent) => {
    // Only trigger the card click if onClick is provided
    if (onClick && !isLoading) {
      onClick(sync);
    }
  };

  const handleControlClick = (event: React.MouseEvent) => {
    // Stop propagation to prevent the card click from being triggered
    event.stopPropagation();
  };

  const dialogProps = getConfirmDialogProps();
  const animationProps = getAnimationProps(sync.state);

  return (
    <>
      <Box
        key={sync.id}
        sx={{
          width: 180,
          height: 180,
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)',
          },
          cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={handleCardClick}
        role='button'
        aria-label={t('sync.tooltip.viewDetails')}
        tabIndex={0}
      >
        {/* Header row with status dot and action buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Status indicator with breathing effect */}
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: getStatusColor(sync.state),
              transition: 'background-color 0.3s ease',
              ...animationProps,
            }}
            aria-label='Status indicator'
          />

          {/* Action buttons based on state */}
          <Box
            sx={{
              display: 'flex',
              gap: '4px',
            }}
            onClick={handleControlClick}
          >
            {sync.state === 'ACTIVE' && (
              <>
                <Tooltip title={t('sync.tooltip.pause')}>
                  {isLoading ? (
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => setConfirmAction('pause')}
                        sx={{ padding: '2px' }}
                        disabled={true}
                        aria-label={t('sync.tooltip.pause')}
                      >
                        <PauseIcon fontSize='small' />
                      </IconButton>
                    </span>
                  ) : (
                    <IconButton
                      size='small'
                      onClick={() => setConfirmAction('pause')}
                      sx={{ padding: '2px' }}
                      disabled={false}
                      aria-label={t('sync.tooltip.pause')}
                    >
                      <PauseIcon fontSize='small' />
                    </IconButton>
                  )}
                </Tooltip>
                <Tooltip title={t('sync.tooltip.stop')}>
                  {isLoading ? (
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => setConfirmAction('stop')}
                        sx={{ padding: '2px' }}
                        disabled={true}
                        aria-label={t('sync.tooltip.stop')}
                      >
                        <StopIcon fontSize='small' />
                      </IconButton>
                    </span>
                  ) : (
                    <IconButton
                      size='small'
                      onClick={() => setConfirmAction('stop')}
                      sx={{ padding: '2px' }}
                      disabled={false}
                      aria-label={t('sync.tooltip.stop')}
                    >
                      <StopIcon fontSize='small' />
                    </IconButton>
                  )}
                </Tooltip>
              </>
            )}

            {sync.state === 'PAUSED' && (
              <>
                <Tooltip title={t('sync.tooltip.resume')}>
                  {isLoading ? (
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => updateSyncState('ACTIVE')}
                        sx={{ padding: '2px' }}
                        disabled={true}
                        aria-label={t('sync.tooltip.resume')}
                      >
                        <PlayArrowIcon fontSize='small' />
                      </IconButton>
                    </span>
                  ) : (
                    <IconButton
                      size='small'
                      onClick={() => updateSyncState('ACTIVE')}
                      sx={{ padding: '2px' }}
                      disabled={false}
                      aria-label={t('sync.tooltip.resume')}
                    >
                      <PlayArrowIcon fontSize='small' />
                    </IconButton>
                  )}
                </Tooltip>
                <Tooltip title={t('sync.tooltip.stop')}>
                  {isLoading ? (
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => setConfirmAction('stop')}
                        sx={{ padding: '2px' }}
                        disabled={true}
                        aria-label={t('sync.tooltip.stop')}
                      >
                        <StopIcon fontSize='small' />
                      </IconButton>
                    </span>
                  ) : (
                    <IconButton
                      size='small'
                      onClick={() => setConfirmAction('stop')}
                      sx={{ padding: '2px' }}
                      disabled={false}
                      aria-label={t('sync.tooltip.stop')}
                    >
                      <StopIcon fontSize='small' />
                    </IconButton>
                  )}
                </Tooltip>
              </>
            )}

            {(sync.state === 'STOPPED' || sync.state === 'ERROR') && (
              <Tooltip title={t('sync.tooltip.play')}>
                {isLoading ? (
                  <span>
                    <IconButton
                      size='small'
                      onClick={() => updateSyncState('ACTIVE')}
                      sx={{ padding: '2px' }}
                      disabled={true}
                      aria-label={t('sync.tooltip.play')}
                    >
                      <PlayArrowIcon fontSize='small' />
                    </IconButton>
                  </span>
                ) : (
                  <IconButton
                    size='small'
                    onClick={() => updateSyncState('ACTIVE')}
                    sx={{ padding: '2px' }}
                    disabled={false}
                    aria-label={t('sync.tooltip.play')}
                  >
                    <PlayArrowIcon fontSize='small' />
                  </IconButton>
                )}
              </Tooltip>
            )}

            {/* Delete button (always visible as last button) */}
            <Tooltip title={t('sync.tooltip.delete')}>
              {isLoading ? (
                <span>
                  <IconButton
                    size='small'
                    onClick={() => setConfirmAction('delete')}
                    sx={{
                      padding: '2px',
                      color: '#F44336',
                    }}
                    disabled={true}
                    aria-label={t('sync.tooltip.delete')}
                  >
                    <CloseIcon fontSize='small' />
                  </IconButton>
                </span>
              ) : (
                <IconButton
                  size='small'
                  onClick={() => setConfirmAction('delete')}
                  sx={{
                    padding: '2px',
                    color: '#F44336',
                  }}
                  disabled={false}
                  aria-label={t('sync.tooltip.delete')}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
              )}
            </Tooltip>
          </Box>
        </Box>

        {/* Sync name/content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
          }}
        >
          <Typography
            variant='h6'
            sx={{
              textAlign: 'center',
              fontWeight: 500,
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              color: '#000000',
            }}
          >
            {sync.discussion_name}
          </Typography>
        </Box>
      </Box>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={dialogProps.title}
        message={dialogProps.message}
        confirmButtonText={dialogProps.confirmButtonText}
        confirmButtonColor={dialogProps.confirmButtonColor}
        onConfirm={dialogProps.onConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
};
