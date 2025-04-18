import {
  Box,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import { CreateCard } from './styles.ts';
import { useState, useEffect } from 'react';
import { SyncCreateDialog } from './SyncCreateDialog';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import { SyncCard, Sync } from './SyncCard';

interface MetaTraderSectionProps {
  onCreateClick?: () => void;
}

export const MetaTraderSection = ({
  onCreateClick,
}: MetaTraderSectionProps) => {
  const { t } = useTranslation();
  const { isAuthenticated, credentials } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncs, setSyncs] = useState<Sync[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSync, setSelectedSync] = useState<Sync | null>(null);

  // Use the api_id from credentials as the user ID
  const userId = credentials?.api_id;

  const fetchUserSyncs = async () => {
    if (!isAuthenticated || !userId) return;

    try {
      setLoading(true);
      const response = await apiService.get<Sync[]>(`/sync/user/${userId}`);
      // Sort by created_at descending (newest first)
      const sortedSyncs = response.sort(
        (a: Sync, b: Sync) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSyncs(sortedSyncs);
    } catch (error) {
      console.error('Error fetching user syncs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSyncs();
  }, [isAuthenticated, userId]);

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      setDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSyncCreated = () => {
    fetchUserSyncs();
  };

  const handleSyncUpdated = (updatedSync: Sync) => {
    setSyncs((prevSyncs) =>
      prevSyncs.map((sync) => (sync.id === updatedSync.id ? updatedSync : sync))
    );
  };

  const handleSyncDeleted = (syncId: number) => {
    setSyncs((prevSyncs) => prevSyncs.filter((sync) => sync.id !== syncId));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sync: Sync) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedSync(sync);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedSync(null);
  };

  const handleStateChange = async (state: string) => {
    if (!selectedSync) return;

    try {
      await apiService.put<Sync>(`/sync/${selectedSync.id}/state/${state}`, {});
      // Refresh syncs after state change
      fetchUserSyncs();
    } catch (error) {
      console.error('Error updating sync state:', error);
    }

    handleMenuClose();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h4' gutterBottom sx={{ color: '#292929' }}>
        {t('metatrader.title')}
      </Typography>
      <Typography sx={{ color: '#292929', mb: 4 }}>
        {t('metatrader.description')}
      </Typography>

      {/* Cards section */}
      <Box sx={{ mt: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              justifyContent: { xs: 'center', sm: 'flex-start' },
              width: '100%',
            }}
          >
            {/* Create Card */}
            <CreateCard onClick={handleCreateClick}>
              <AddIcon
                sx={{
                  fontSize: 40,
                  color: '#292929',
                  mb: 1,
                  opacity: 0.8,
                }}
              />
              <Typography
                variant='h6'
                sx={{
                  color: '#292929',
                  fontWeight: 500,
                  textAlign: 'center',
                  fontSize: '1rem',
                  opacity: 0.8,
                }}
              >
                {t('common.create')}
              </Typography>
            </CreateCard>

            {/* Sync Cards */}
            {syncs.map((sync) => (
              <SyncCard
                key={sync.id}
                sync={sync}
                onSyncUpdated={handleSyncUpdated}
                onSyncDeleted={handleSyncDeleted}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* State change menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStateChange('ACTIVE')}>
          {t('sync.status.setActive')}
        </MenuItem>
        <MenuItem onClick={() => handleStateChange('PAUSED')}>
          {t('sync.status.setPaused')}
        </MenuItem>
        <MenuItem onClick={() => handleStateChange('STOPPED')}>
          {t('sync.status.setStopped')}
        </MenuItem>
        <MenuItem onClick={() => handleStateChange('ERROR')}>
          {t('sync.status.setError')}
        </MenuItem>
      </Menu>

      {/* Sync Create Dialog */}
      <SyncCreateDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSyncCreated}
      />
    </Box>
  );
};
