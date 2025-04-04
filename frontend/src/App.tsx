import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme';
import './i18n';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './components/AppRouter';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </Box>
    </ThemeProvider>
  );
}

export default App;
