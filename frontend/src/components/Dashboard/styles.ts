import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

export const CreateCard = styled(Paper)(({ theme }) => ({
  width: '180px',
  height: '180px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '16px',
  border: '2px dashed rgba(0, 0, 0, 0.15)',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  position: 'relative',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 15px rgba(0, 0, 0, 0.05)',
  },
})); 