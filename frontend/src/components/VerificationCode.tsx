import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  TextField,
  alpha,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import telegramService from '../services/telegramService';
import { ApiError } from '../services/apiService';
import { TelegramCredentials } from '../types/telegram';

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

interface VerificationCodeProps {
  credentials: TelegramCredentials;
  onSuccess: () => void;
  onBack: () => void;
}

const VerificationCode = ({
  credentials,
  onSuccess,
  onBack,
}: VerificationCodeProps) => {
  const { t } = useTranslation();
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerificationCodeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVerificationCode(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!verificationCode) {
        return;
      }

      // Submit verification code to backend
      const response = await telegramService.submitVerificationCode(
        credentials,
        verificationCode,
        needsPassword ? password : undefined
      );

      if (response.success) {
        onSuccess();
      } else if (response.needs_password) {
        setNeedsPassword(true);
      }
    } catch (err) {
      console.error('Verification failed:', err);
      let errorMessage = t('signIn.verificationError');

      if (err instanceof ApiError) {
        errorMessage = err.message;

        // Check if error indicates 2FA is needed
        if (
          err.status === 401 &&
          err.message.includes('two-step verification')
        ) {
          setNeedsPassword(true);
          errorMessage = t('signIn.passwordRequired');
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const isFormValid = needsPassword
    ? verificationCode.trim() !== '' && password.trim() !== ''
    : verificationCode.trim() !== '';

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
              {t('signIn.verificationTitle')}
            </Typography>
            <LanguageSwitcher />
          </Box>
          <Typography variant='body1' color='text.secondary'>
            {t('signIn.codePrompt')}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <StyledTextField
            required
            fullWidth
            label={t('signIn.verificationCode.label')}
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            sx={{ mb: 2 }}
          />

          {needsPassword && (
            <StyledTextField
              required
              fullWidth
              type='password'
              label={t('signIn.password.label')}
              value={password}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant='outlined'
            onClick={onBack}
            disabled={loading}
            sx={{
              minWidth: 100,
              height: 48,
              borderRadius: 24,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {t('common.back')}
          </Button>

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
              t('signIn.verify')
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
    </Container>
  );
};

export default VerificationCode;
