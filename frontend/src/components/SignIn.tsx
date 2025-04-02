import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  TextField,
  FormControlLabel,
  Checkbox,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: alpha(theme.palette.common.white, 0.1),
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.common.white, 0.2),
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const SignIn = () => {
  const { t } = useTranslation();
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({
    apiId: false,
    apiHash: false,
  });

  const handleApiIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiId(event.target.value);
    setErrors((prev) => ({ ...prev, apiId: !event.target.value }));
  };

  const handleApiHashChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiHash(event.target.value);
    setErrors((prev) => ({ ...prev, apiHash: !event.target.value }));
  };

  const handleRememberMeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRememberMe(event.target.checked);
  };

  const isFormValid = apiId.trim() !== '' && apiHash.trim() !== '';

  return (
    <Container
      maxWidth='sm'
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <StyledPaper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 450,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              mb: 2,
            }}
          >
            <Typography variant='h4' component='h1'>
              {t('signIn.title')}
            </Typography>
            <LanguageSwitcher />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body1' color='text.secondary'>
              {t('signIn.description')}
            </Typography>
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant='body2' component='div'>
                    <Box component='ol' sx={{ m: 0, pl: 2 }}>
                      {(
                        t('signIn.tooltip.steps', {
                          returnObjects: true,
                        }) as string[]
                      ).map((step: string, index: number) => (
                        <li key={`tooltip-step-${index}`}>{step}</li>
                      ))}
                    </Box>
                  </Typography>
                </Box>
              }
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'background.paper',
                    '& .MuiTooltip-arrow': {
                      color: 'background.paper',
                    },
                    boxShadow: 1,
                    borderRadius: 1,
                  },
                },
              }}
            >
              <IconButton size='small' sx={{ color: alpha('#fff', 0.7) }}>
                <InfoIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <StyledTextField
            required
            fullWidth
            label={t('signIn.apiId.label')}
            value={apiId}
            onChange={handleApiIdChange}
            error={errors.apiId}
            helperText={errors.apiId ? t('signIn.apiId.error') : ''}
            sx={{ mb: 2 }}
          />
          <StyledTextField
            required
            fullWidth
            label={t('signIn.apiHash.label')}
            value={apiHash}
            onChange={handleApiHashChange}
            error={errors.apiHash}
            helperText={errors.apiHash ? t('signIn.apiHash.error') : ''}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={handleRememberMeChange}
                sx={{
                  color: alpha('#fff', 0.7),
                  '&.Mui-checked': {
                    color: '#4CAF50',
                  },
                }}
              />
            }
            label={t('signIn.rememberMe')}
            sx={{
              mt: 2,
              color: alpha('#fff', 0.7),
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant='contained'
            color='primary'
            size='large'
            disabled={!isFormValid}
            sx={{
              minWidth: 120,
              height: 48,
              borderRadius: 24,
              textTransform: 'none',
              fontSize: '1rem',
              backgroundColor: '#4CAF50',
              '&:hover': {
                backgroundColor: '#45a049',
              },
            }}
          >
            {t('signIn.next')}
          </Button>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default SignIn;
