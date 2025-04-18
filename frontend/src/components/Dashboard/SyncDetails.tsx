import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogTitle,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import syncService from '../../services/syncService';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import {
  Sync as BaseSync,
  getStatusColor,
  getAnimationProps,
} from './SyncCard';

// Extend the base Sync interface to include entity_id
interface Sync extends BaseSync {
  entity_id?: number;
}

interface SyncDetailsProps {
  sync: Sync | null;
  open: boolean;
  onClose: () => void;
  onSyncUpdated?: (updatedSync: Sync) => void;
  onSyncDeleted?: (syncId: number) => void;
}

type ConfirmAction = 'pause' | 'stop' | 'delete' | null;

interface TelegramMessage {
  id: number;
  text: string;
  date: string;
  sender: {
    id: number | null;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  };
  has_media: boolean;
}

export const SyncDetails: React.FC<SyncDetailsProps> = ({
  sync,
  open,
  onClose,
  onSyncUpdated,
  onSyncDeleted,
}) => {
  const { t } = useTranslation();
  const { credentials } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentSync, setCurrentSync] = useState<Sync | null>(sync);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    name: '',
    state: '',
  });

  // WebSocket state
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(
    credentials?.api_id ? credentials.api_id.toString() : null
  );
  const websocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update current sync when prop changes
  useEffect(() => {
    setCurrentSync(sync);
    if (sync) {
      setSyncSettings({
        name: sync.discussion_name,
        state: sync.state,
      });
    }
  }, [sync]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // WebSocket connection management
  useEffect(() => {
    if (open && currentSync) {
      connectWebSocket();
    }

    return () => {
      // Cleanup on unmount
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [open, currentSync]);

  // Connect to WebSocket
  const connectWebSocket = () => {
    if (!currentSync) return;

    // Use the backend API URL from environment variables
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

    // Parse URL to handle different formats
    let baseUrl = apiUrl;

    // Remove protocol if present
    baseUrl = baseUrl.replace(/^https?:\/\//, '');

    // Remove trailing /v1 if present
    baseUrl = baseUrl.replace(/\/v1$/, '');

    const wsProtocol =
      window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${wsProtocol}${baseUrl}/v1/ws/messages${
      clientId ? `?client_id=${clientId}` : ''
    }`;

    // Close any existing connection
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    console.log('Connecting to WebSocket at:', wsUrl);
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');

      // Add system connection message
      const connectedMsg: TelegramMessage = {
        id: Date.now(),
        text: 'Connected to Telegram channel...',
        date: new Date().toISOString(),
        sender: {
          id: null,
          first_name: 'System',
          last_name: null,
          username: null,
        },
        has_media: false,
      };
      setMessages((prev) => [...prev, connectedMsg]);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === 'connected') {
        setClientId(data.client_id);
        console.log('Client ID:', data.client_id);

        // Subscribe to the sync's channel
        if (currentSync && currentSync.entity_id) {
          ws.send(
            JSON.stringify({
              action: 'subscribe',
              dialog_id: currentSync.entity_id,
            })
          );
        } else if (currentSync) {
          // Fallback to using sync.id if entity_id is not available
          console.warn('No entity_id found, using sync.id as fallback');
          ws.send(
            JSON.stringify({
              action: 'subscribe',
              dialog_id: currentSync.id,
            })
          );
        }
      } else if (data.event === 'new_message') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.event === 'subscription_update') {
        if (data.subscribed) {
          // Add subscription confirmation message
          const subMsg: TelegramMessage = {
            id: Date.now(),
            text: `Subscribed to channel ${data.dialog_id}`,
            date: new Date().toISOString(),
            sender: {
              id: null,
              first_name: 'System',
              last_name: null,
              username: null,
            },
            has_media: false,
          };
          setMessages((prev) => [...prev, subMsg]);
        }
      } else if (data.event === 'error') {
        console.error('WebSocket error:', data.message);
        // Add error message
        const errorMsg: TelegramMessage = {
          id: Date.now(),
          text: `Error: ${data.message}`,
          date: new Date().toISOString(),
          sender: {
            id: null,
            first_name: 'System',
            last_name: null,
            username: null,
          },
          has_media: false,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');

      // Add disconnection message if there were previous messages
      if (messages.length > 0) {
        const disconnectedMsg: TelegramMessage = {
          id: Date.now(),
          text: 'Disconnected from Telegram channel',
          date: new Date().toISOString(),
          sender: {
            id: null,
            first_name: 'System',
            last_name: null,
            username: null,
          },
          has_media: false,
        };
        setMessages((prev) => [...prev, disconnectedMsg]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);

      // Add error message
      const errorMsg: TelegramMessage = {
        id: Date.now(),
        text: 'WebSocket connection error',
        date: new Date().toISOString(),
        sender: {
          id: null,
          first_name: 'System',
          last_name: null,
          username: null,
        },
        has_media: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    };
  };

  if (!currentSync) {
    return null;
  }

  const updateSyncState = async (newState: string) => {
    if (isLoading || !currentSync) return;

    setIsLoading(true);
    try {
      const updatedSync = await syncService.updateSyncState(
        currentSync.id,
        newState
      );
      setCurrentSync(updatedSync);
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
    if (isLoading || !currentSync) return;

    setIsLoading(true);
    try {
      await syncService.deleteSync(currentSync.id);
      if (onSyncDeleted) {
        onSyncDeleted(currentSync.id);
      }
      onClose();
    } catch (error) {
      console.error('Error deleting sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleSettingsSave = async () => {
    if (isLoading || !currentSync) return;

    setIsLoading(true);
    try {
      // Update sync state if it changed
      if (syncSettings.state !== currentSync.state) {
        await updateSyncState(syncSettings.state);
      }

      // Add more settings updates here as needed
      console.log('Settings saved for sync:', currentSync.id, syncSettings);

      setSettingsOpen(false);
    } catch (error) {
      console.error('Error saving sync settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (field: string, value: any) => {
    setSyncSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    // Clean up WebSocket when dialog closes
    if (websocketRef.current) {
      websocketRef.current.close();
      setMessages([]);
    }
    onClose();
  };

  const getConfirmDialogProps = () => {
    if (!currentSync) {
      return {
        title: '',
        message: '',
        confirmButtonText: '',
        onConfirm: () => setConfirmAction(null),
      };
    }

    switch (confirmAction) {
      case 'pause':
        return {
          title: t('sync.confirmation.pause.title'),
          message: t('sync.confirmation.pause.message', {
            name: currentSync.discussion_name,
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
            name: currentSync.discussion_name,
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
            name: currentSync.discussion_name,
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSenderName = (message: TelegramMessage) => {
    const { sender } = message;

    if (sender.first_name === 'System') {
      return 'System';
    }

    return (
      (
        (sender.first_name || '') +
        (sender.last_name ? ` ${sender.last_name}` : '') +
        (sender.username ? ` (@${sender.username})` : '')
      ).trim() || 'Unknown Sender'
    );
  };

  const animationProps = currentSync
    ? getAnimationProps(currentSync.state)
    : {};
  const dialogProps = getConfirmDialogProps();

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth='md'
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#4b5563',
            color: 'white',
            boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.4)',
            opacity: 1,
            borderRadius: '16px',
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          {/* Header with title, status indicator and action buttons */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Status indicator */}
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(currentSync.state),
                  transition: 'background-color 0.3s ease',
                  ...animationProps,
                }}
                aria-label='Status indicator'
              />

              {/* Title */}
              <Typography variant='h5' fontWeight='500' sx={{ color: 'white' }}>
                {currentSync.discussion_name}
              </Typography>
            </Box>

            {/* Action buttons based on state */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {currentSync.state === 'ACTIVE' && (
                <>
                  <Tooltip title={t('sync.tooltip.pause')}>
                    <IconButton
                      size='small'
                      onClick={() => setConfirmAction('pause')}
                      disabled={isLoading}
                      color='inherit'
                      sx={{ color: 'white' }}
                    >
                      <PauseIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('sync.tooltip.stop')}>
                    <IconButton
                      size='small'
                      onClick={() => setConfirmAction('stop')}
                      disabled={isLoading}
                      color='inherit'
                      sx={{ color: 'white' }}
                    >
                      <StopIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {currentSync.state === 'PAUSED' && (
                <>
                  <Tooltip title={t('sync.tooltip.resume')}>
                    <IconButton
                      size='small'
                      onClick={() => updateSyncState('ACTIVE')}
                      disabled={isLoading}
                      color='inherit'
                      sx={{ color: 'white' }}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('sync.tooltip.stop')}>
                    <IconButton
                      size='small'
                      onClick={() => setConfirmAction('stop')}
                      disabled={isLoading}
                      color='inherit'
                      sx={{ color: 'white' }}
                    >
                      <StopIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {(currentSync.state === 'STOPPED' ||
                currentSync.state === 'ERROR') && (
                <Tooltip title={t('sync.tooltip.play')}>
                  <IconButton
                    size='small'
                    onClick={() => updateSyncState('ACTIVE')}
                    disabled={isLoading}
                    color='inherit'
                    sx={{ color: 'white' }}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </Tooltip>
              )}

              {/* Settings button */}
              <Tooltip title={t('sync.tooltip.settings')}>
                <IconButton
                  size='small'
                  color='inherit'
                  sx={{ color: 'white' }}
                  onClick={handleSettingsClick}
                  disabled={isLoading}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              {/* Delete button (always visible as last button) */}
              <Tooltip title={t('sync.tooltip.delete')}>
                <IconButton
                  size='small'
                  onClick={() => setConfirmAction('delete')}
                  disabled={isLoading}
                  sx={{ color: '#FF6B6B' }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Divider
            sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
          />

          {/* Terminal-like Live Messages Display */}
          <Paper
            elevation={0}
            sx={{
              p: 0,
              backgroundColor: '#1E1E1E',
              borderRadius: '8px',
              height: '400px',
              fontFamily: 'monospace',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Terminal Header */}
            <Box
              sx={{
                p: 1,
                backgroundColor: '#323232',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant='body2'
                fontFamily='monospace'
                fontWeight='bold'
                color='rgba(255, 255, 255, 0.8)'
              >
                {`📱 ${currentSync.discussion_name} - ${
                  isConnected ? 'Connected' : 'Disconnected'
                }`}
              </Typography>

              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#4caf50' : '#f44336',
                }}
              />
            </Box>

            {/* Terminal Content */}
            <Box
              sx={{
                p: 2,
                height: 'calc(100% - 40px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#2D2D2D',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#555',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#777',
                },
              }}
            >
              {messages.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    gap: 2,
                  }}
                >
                  <Typography
                    variant='body1'
                    fontFamily='monospace'
                    align='center'
                  >
                    Waiting for messages from {currentSync.discussion_name}...
                  </Typography>
                  <Typography
                    variant='caption'
                    fontFamily='monospace'
                    color='rgba(255, 255, 255, 0.4)'
                    align='center'
                  >
                    {isConnected
                      ? 'WebSocket connected. New messages will appear here in real-time.'
                      : 'Connecting to WebSocket service...'}
                  </Typography>
                </Box>
              ) : (
                messages.map((message) => (
                  <Box key={`${message.id}-${message.date}`} sx={{ mb: 1.5 }}>
                    {/* Message timestamp and sender */}
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}
                    >
                      <Typography
                        variant='caption'
                        component='span'
                        sx={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontFamily: 'monospace',
                        }}
                      >
                        [{formatTime(message.date)}]
                      </Typography>

                      <Typography
                        variant='caption'
                        component='span'
                        sx={{
                          ml: 1,
                          color:
                            message.sender.first_name === 'System'
                              ? '#4caf50'
                              : '#64b5f6',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                        }}
                      >
                        {getSenderName(message)}:
                      </Typography>
                    </Box>

                    {/* Message content */}
                    <Typography
                      variant='body2'
                      sx={{
                        color: 'white',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        pl: 2,
                      }}
                    >
                      {message.text}
                      {message.has_media && (
                        <span style={{ color: '#FFA726' }}>
                          {' '}
                          [media attachment]
                        </span>
                      )}
                    </Typography>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            variant='outlined'
            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={handleSettingsClose}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#4b5563',
            color: 'white',
            boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.4)',
            opacity: 1,
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          {t('sync.settings.title')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label={t('sync.settings.name')}
            value={syncSettings.name}
            onChange={(e) => handleSettingsChange('name', e.target.value)}
            fullWidth
            margin='normal'
            variant='outlined'
            disabled
            InputLabelProps={{
              style: { color: 'rgba(255, 255, 255, 0.7)' },
            }}
            InputProps={{
              style: { color: 'white' },
              sx: {
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
            }}
          />
          <FormControl
            fullWidth
            margin='normal'
            sx={{
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {t('sync.settings.state')}
            </InputLabel>
            <Select
              value={syncSettings.state}
              onChange={(e) => handleSettingsChange('state', e.target.value)}
              label={t('sync.settings.state')}
              sx={{ color: 'white' }}
            >
              <MenuItem value='ACTIVE'>{t('sync.state.ACTIVE')}</MenuItem>
              <MenuItem value='PAUSED'>{t('sync.state.PAUSED')}</MenuItem>
              <MenuItem value='STOPPED'>{t('sync.state.STOPPED')}</MenuItem>
              <MenuItem value='ERROR'>{t('sync.state.ERROR')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleSettingsClose}
            color='inherit'
            sx={{ color: 'white' }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSettingsSave}
            variant='contained'
            disabled={isLoading}
          >
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

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
