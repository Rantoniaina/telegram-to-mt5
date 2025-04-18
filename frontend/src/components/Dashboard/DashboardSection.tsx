import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DashboardSectionProps {
  loadingDialogs: boolean;
  dialogsCount: number;
  credentials?: {
    api_id: string;
  };
}

export const DashboardSection = ({
  loadingDialogs,
  dialogsCount,
  credentials,
}: DashboardSectionProps) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h4' gutterBottom sx={{ color: '#292929' }}>
        {t('dashboard.welcome')}
      </Typography>
      {loadingDialogs ? (
        <Typography sx={{ color: '#292929' }}>
          {t('dashboard.telegram.loading')}
        </Typography>
      ) : (
        <Typography sx={{ color: '#292929' }}>
          {t('dashboard.telegram.dialogsCount', { count: dialogsCount })}
        </Typography>
      )}
      {credentials && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
          {t('dashboard.telegram.connected', {
            apiId: credentials.api_id,
          })}
        </Typography>
      )}
    </Box>
  );
};
