import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const SettingsSection = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h4' gutterBottom sx={{ color: '#292929' }}>
        {t('settings.title')}
      </Typography>
      <Typography sx={{ color: '#292929' }}>
        {t('settings.description')}
      </Typography>
    </Box>
  );
};
