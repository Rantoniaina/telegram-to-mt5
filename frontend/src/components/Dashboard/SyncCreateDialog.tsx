import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import telegramService from '../../services/telegramService';
import syncService from '../../services/syncService';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { Dialog as TelegramDialog } from '../../types/telegram';

interface SyncCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SyncCreateDialog = ({
  open,
  onClose,
  onSuccess,
}: SyncCreateDialogProps) => {
  const { t } = useTranslation();
  const { credentials } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dialogsLoading, setDialogsLoading] = useState(false);
  const [dialogs, setDialogs] = useState<TelegramDialog[]>([]);
  const [selectedDialog, setSelectedDialog] = useState<TelegramDialog | null>(
    null
  );
  const [state, setState] = useState('ACTIVE');
  const [error, setError] = useState('');

  // Fetch dialogs when the dialog opens
  useEffect(() => {
    if (open && credentials) {
      fetchDialogs();
    }
  }, [open, credentials]);

  const fetchDialogs = async () => {
    if (!credentials) return;

    try {
      setDialogsLoading(true);
      const fetchedDialogs = await telegramService.getDialogs(credentials);
      setDialogs(fetchedDialogs);
    } catch (error) {
      console.error('Failed to fetch dialogs:', error);
      setError(t('errors.failedToFetchDialogs'));
    } finally {
      setDialogsLoading(false);
    }
  };

  const handleDialogSelect = (dialog: TelegramDialog) => {
    setSelectedDialog(dialog);
  };

  const handleCreateSync = async () => {
    if (!credentials || !selectedDialog) return;

    try {
      setLoading(true);
      setError('');

      // Create a new sync using syncService
      await syncService.createSync({
        user_id: Number(credentials.api_id),
        discussion_name: selectedDialog.name,
        state: state,
        dialog_id: selectedDialog.id,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create sync:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const getDialogIcon = (dialogType: string) => {
    switch (dialogType.toLowerCase()) {
      case 'channel':
        return <AnnouncementIcon />;
      case 'group':
        return <GroupIcon />;
      default:
        return <ChatIcon />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#4b5563',
          color: 'white',
          boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.4)',
          opacity: 1,
        },
      }}
    >
      <DialogTitle>{t('sync.create.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color='error' sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Typography variant='subtitle1' gutterBottom>
          {t('sync.create.selectDialog')}
        </Typography>

        {dialogsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: '300px', overflow: 'auto', mb: 3 }}>
            {dialogs.map((dialog) => (
              <ListItem
                button
                key={dialog.id}
                onClick={() => handleDialogSelect(dialog)}
                selected={selectedDialog?.id === dialog.id}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  backgroundColor:
                    selectedDialog?.id === dialog.id
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'transparent',
                }}
              >
                <ListItemIcon>{getDialogIcon(dialog.type)}</ListItemIcon>
                <ListItemText primary={dialog.name} secondary={dialog.type} />
              </ListItem>
            ))}
            {dialogs.length === 0 && !dialogsLoading && (
              <Typography
                sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}
              >
                {t('sync.create.noDialogsFound')}
              </Typography>
            )}
          </List>
        )}

        {selectedDialog && (
          <>
            <TextField
              label={t('sync.create.syncName')}
              value={selectedDialog.name}
              InputProps={{
                readOnly: true,
              }}
              helperText={t('sync.create.syncNameReadOnly')}
              fullWidth
              margin='normal'
              variant='outlined'
            />

            <FormControl fullWidth margin='normal'>
              <InputLabel>{t('sync.create.syncState')}</InputLabel>
              <Select
                value={state}
                label={t('sync.create.syncState')}
                onChange={(e) => setState(e.target.value)}
              >
                <MenuItem value='ACTIVE'>{t('sync.state.ACTIVE')}</MenuItem>
                <MenuItem value='PAUSED'>{t('sync.state.PAUSED')}</MenuItem>
                <MenuItem value='STOPPED'>{t('sync.state.STOPPED')}</MenuItem>
                <MenuItem value='ERROR'>{t('sync.state.ERROR')}</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='inherit'>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleCreateSync}
          color='primary'
          variant='contained'
          disabled={loading || !selectedDialog}
        >
          {loading ? <CircularProgress size={24} /> : t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
