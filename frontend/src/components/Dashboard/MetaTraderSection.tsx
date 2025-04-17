import { Box, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import { CreateCard } from './styles';
import { useState } from 'react';
import { SyncCreateDialog } from './SyncCreateDialog';

interface MetaTraderSectionProps {
  onCreateClick?: () => void;
}

export const MetaTraderSection = ({
  onCreateClick,
}: MetaTraderSectionProps) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

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
    // You could add logic here to refresh the list of syncs
    console.log('Sync created successfully');
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
      <Container maxWidth='lg' sx={{ mt: 4, p: 0, ml: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: { xs: 'center', sm: 'flex-start' },
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
        </Box>
      </Container>

      {/* Sync Create Dialog */}
      <SyncCreateDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSyncCreated}
      />
    </Box>
  );
};
