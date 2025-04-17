import { Box, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import { CreateCard } from './styles';

interface MetaTraderSectionProps {
  onCreateClick: () => void;
}

export const MetaTraderSection = ({
  onCreateClick,
}: MetaTraderSectionProps) => {
  const { t } = useTranslation();

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
          <CreateCard onClick={onCreateClick}>
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
    </Box>
  );
};
