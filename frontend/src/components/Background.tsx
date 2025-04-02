import { Box } from '@mui/material';
import { ReactNode } from 'react';

interface BackgroundProps {
  children: ReactNode;
}

const Background = ({ children }: BackgroundProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #2D3748 0%, #1A202C 25%, #2D3748 50%, #3B8070 75%, #6FCF97 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientAnimation 15s ease infinite',
        '@keyframes gradientAnimation': {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          },
        },
      }}
    >
      {children}
    </Box>
  );
};

export default Background;
