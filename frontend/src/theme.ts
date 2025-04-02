import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#6FCF97', // Green color from the logo and button
            light: '#8ED7A9',
            dark: '#5BB980',
        },
        secondary: {
            main: '#2D3748', // Dark blue-gray from the background
            light: '#4A5568',
            dark: '#1A202C',
        },
        background: {
            default: '#1A202C',
            paper: 'rgba(45, 55, 72, 0.7)', // Semi-transparent card background
        },
        text: {
            primary: '#FFFFFF',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 500,
        },
        body1: {
            fontSize: '0.9rem',
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    padding: '10px 30px',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                },
            },
        },
    },
    defaultColorScheme: undefined,
    colorSchemes: undefined
});

export default theme;