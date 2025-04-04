import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  TextField,
  alpha,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import { useTranslation } from 'react-i18next';
import { TelegramCredentials } from '../../types/telegram';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/apiService';
import telegramService from '../../services/telegramService';
import LanguageSwitcher from '../LanguageSwitcher';
import VerificationCode from '../VerificationCode';

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

// Define possible auth steps
enum AuthStep {
  CREDENTIALS,
  VERIFICATION_CODE,
  COMPLETE,
}

const SignIn = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.CREDENTIALS);
  const [credentials, setCredentials] = useState<TelegramCredentials | null>(
    null
  );
  const [errors, setErrors] = useState({
    apiId: false,
    apiHash: false,
    phone: false,
  });

  const handleApiIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiId(event.target.value);
    setErrors((prev) => ({ ...prev, apiId: !event.target.value }));
  };

  const handleApiHashChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiHash(event.target.value);
    setErrors((prev) => ({ ...prev, apiHash: !event.target.value }));
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(event.target.value);
    setErrors((prev) => ({ ...prev, phone: !event.target.value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate form
      const needsPhone = true; // Set to true if phone is required
      if (!apiId || !apiHash || (needsPhone && !phone)) {
        setErrors({
          apiId: !apiId,
          apiHash: !apiHash,
          phone: needsPhone && !phone,
        });
        return;
      }

      // Create credentials object
      const credentialsObj: TelegramCredentials = {
        api_id: parseInt(apiId, 10),
        api_hash: apiHash,
      };

      // Add phone number if provided
      if (phone) {
        credentialsObj.phone = phone;
      }

      console.log('Submitting credentials:', credentialsObj);

      // Connect to Telegram
      const response = await telegramService.connect(credentialsObj);

      console.log('Connection response:', response);

      // Check if verification code is needed, regardless of success value
      if (response.needs_verification) {
        // Move to verification step
        setCredentials(credentialsObj);
        setAuthStep(AuthStep.VERIFICATION_CODE);
      } else if (response.success) {
        // Authentication complete without verification needed
        setSuccess(true);
        setAuthStep(AuthStep.COMPLETE);
        // Redirect to dashboard
        login(credentialsObj);
      }
    } catch (err) {
      console.error('Failed to connect to Telegram:', err);
      let errorMessage = t('signIn.connectError');

      if (err instanceof ApiError) {
        errorMessage = err.message;
        // Check if error indicates verification code is needed
        if (err.status === 401 && err.message.includes('verification code')) {
          setCredentials({
            api_id: parseInt(apiId, 10),
            api_hash: apiHash,
            phone: phone,
          });
          setAuthStep(AuthStep.VERIFICATION_CODE);
          return; // Don't show error in this case
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setSuccess(true);
    setAuthStep(AuthStep.COMPLETE);
    // Redirect to dashboard after successful authentication
    if (credentials) {
      login(credentials);
    }
  };

  const handleBackToCredentials = () => {
    setAuthStep(AuthStep.CREDENTIALS);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  const isFormValid =
    apiId.trim() !== '' && apiHash.trim() !== '' && phone.trim() !== '';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && isFormValid && !loading) {
      handleSubmit();
    }
  };

  // Render verification code screen if needed
  if (authStep === AuthStep.VERIFICATION_CODE && credentials) {
    return (
      <VerificationCode
        credentials={credentials}
        onSuccess={handleVerificationSuccess}
        onBack={handleBackToCredentials}
      />
    );
  }

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
        onKeyDown={handleKeyDown}
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
            placeholder={t('signIn.apiId.placeholder')}
            value={apiId}
            onChange={handleApiIdChange}
            error={errors.apiId}
            helperText={errors.apiId ? t('signIn.apiId.error') : ''}
            sx={{ mb: 2 }}
            autoComplete='off'
          />
          <StyledTextField
            required
            fullWidth
            label={t('signIn.apiHash.label')}
            placeholder={t('signIn.apiHash.placeholder')}
            value={apiHash}
            onChange={handleApiHashChange}
            error={errors.apiHash}
            helperText={errors.apiHash ? t('signIn.apiHash.error') : ''}
            sx={{ mb: 2 }}
            autoComplete='off'
          />
          <StyledTextField
            required
            fullWidth
            label={t('signIn.phone.label')}
            placeholder={t('signIn.phone.placeholder')}
            value={phone}
            onChange={handlePhoneChange}
            error={errors.phone}
            helperText={errors.phone ? t('signIn.phone.error') : ''}
            sx={{ mb: 2 }}
            autoComplete='off'
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant='contained'
            color='primary'
            size='large'
            disabled={!isFormValid || loading}
            onClick={handleSubmit}
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
            {loading ? (
              <CircularProgress size={24} color='inherit' />
            ) : (
              t('signIn.next')
            )}
          </Button>
        </Box>
      </StyledPaper>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseError}
          severity='error'
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity='success'
          sx={{ width: '100%' }}
        >
          {t('signIn.connectSuccess')}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SignIn;
