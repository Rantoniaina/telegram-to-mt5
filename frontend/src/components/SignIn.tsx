import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Grid,
  alpha,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import PhoneIcon from '@mui/icons-material/Phone';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import logo from '../assets/logo.svg';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha(theme.palette.common.white, 0.1),
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha(theme.palette.common.white, 0.2),
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
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
  const [country, setCountry] = useState('Jamaica');
  const [phone, setPhone] = useState('');

  const handleCountryChange = (event: SelectChangeEvent) => {
    setCountry(event.target.value);
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(event.target.value);
  };

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
          <img
            src={logo}
            alt='U&me Logo'
            style={{ width: 80, height: 80, marginBottom: 16 }}
          />
          <Typography variant='h4' component='h1' gutterBottom>
            Sign in
          </Typography>
          <Typography variant='body1' color='text.secondary' align='center'>
            Please choose your country and enter
            <br />
            your full phone number
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth variant='outlined'>
            <StyledSelect
              value={country}
              onChange={handleCountryChange}
              displayEmpty
              inputProps={{ 'aria-label': 'Select country' }}
              startAdornment={
                <InputAdornment position='start'>
                  <PublicIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              }
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                height: 56,
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              <MenuItem value='Jamaica'>Jamaica</MenuItem>
              <MenuItem value='United States'>United States</MenuItem>
              <MenuItem value='Canada'>Canada</MenuItem>
              <MenuItem value='United Kingdom'>United Kingdom</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <StyledTextField
              fullWidth
              disabled
              value='+1 876'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <PhoneIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: '#fff',
                  opacity: 0.7,
                },
              }}
            />
          </Grid>
          <Grid item xs={8}>
            <StyledTextField
              fullWidth
              placeholder='Enter your phone'
              value={phone}
              onChange={handlePhoneChange}
              InputProps={{
                sx: {
                  height: '100%',
                },
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant='contained'
            color='primary'
            size='large'
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
            Next
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignIn;
