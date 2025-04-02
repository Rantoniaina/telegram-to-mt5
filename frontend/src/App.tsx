import { ThemeProvider, CssBaseline } from '@mui/material';
import Background from './components/Background';
import SignIn from './components/SignIn';
import theme from './theme';
import './i18n';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Background>
        <SignIn />
      </Background>
    </ThemeProvider>
  );
}

export default App;
