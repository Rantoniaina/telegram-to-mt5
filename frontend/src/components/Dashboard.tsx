import {
  Box,
  Paper,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Container,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import telegramService from '../services/telegramService';

const SidebarContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  width: '240px',
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
}));

const MainContentContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  backgroundColor: 'transparent',
  overflow: 'auto',
  height: '100%',
}));

// Create Card styled component
const CreateCard = styled(Paper)(({ theme }) => ({
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

const Dashboard = () => {
  const { logout, credentials } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogsCount, setDialogsCount] = useState<number>(0);
  const [loadingDialogs, setLoadingDialogs] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'metaTrader' | 'settings'
  >('dashboard');
  const open = Boolean(anchorEl);

  useEffect(() => {
    // Get dialogs count if credentials are available
    if (credentials) {
      const fetchDialogs = async () => {
        try {
          setLoadingDialogs(true);
          const dialogs = await telegramService.getDialogs(credentials);
          setDialogsCount(dialogs.length);
        } catch (error) {
          console.error('Failed to fetch dialogs:', error);
        } finally {
          setLoadingDialogs(false);
        }
      };

      fetchDialogs();
    }
  }, [credentials]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    if (credentials) {
      try {
        // Disconnect from Telegram
        await telegramService.disconnect(credentials);
      } catch (error) {
        console.error('Error disconnecting from Telegram:', error);
      }
    }

    // Call the logout function from auth context to clear stored credentials
    logout();
  };

  const handleCreateClick = () => {
    // This function will handle the create card click
    console.log('Create card clicked');
    // You can add your logic here, such as opening a modal or redirecting to another page
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant='h4' gutterBottom sx={{ color: '#292929' }}>
              Welcome to T2M Dashboard
            </Typography>
            {loadingDialogs ? (
              <Typography sx={{ color: '#292929' }}>
                Loading your Telegram data...
              </Typography>
            ) : (
              <Typography sx={{ color: '#292929' }}>
                You have access to {dialogsCount} Telegram dialogs
              </Typography>
            )}
            {credentials && (
              <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                Connected with API ID: {credentials.api_id}
              </Typography>
            )}
          </Box>
        );
      case 'metaTrader':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant='h4' gutterBottom sx={{ color: '#292929' }}>
              Metatrader 5 Sync
            </Typography>
            <Typography sx={{ color: '#292929', mb: 4 }}>
              Configure your Metatrader 5 integration settings here.
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
                <CreateCard onClick={handleCreateClick}>
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
                    Create
                  </Typography>
                </CreateCard>
              </Box>
            </Container>
          </Box>
        );
      case 'settings':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant='h4' gutterBottom sx={{ color: '#292929' }}>
              Settings
            </Typography>
            <Typography sx={{ color: '#292929' }}>
              Manage your application settings here.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        backgroundColor: '#f5f5f5',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      {/* Sidebar */}
      <SidebarContainer elevation={0}>
        {/* Logo text */}
        <Box sx={{ p: 1, mb: 4, textAlign: 'center' }}>
          <Typography variant='h5' fontWeight='bold' color='#000000'>
            T2M
          </Typography>
        </Box>

        {/* Main Navigation links */}
        <Box sx={{ mb: 2 }}>
          <ListItem
            button
            selected={activeSection === 'dashboard'}
            onClick={() => setActiveSection('dashboard')}
            sx={{
              borderRadius: '10px',
              mb: 1,
              backgroundColor:
                activeSection === 'dashboard'
                  ? '#292929 !important'
                  : 'transparent',
              color: activeSection === 'dashboard' ? '#ffffff' : 'inherit',
              '&:hover': {
                backgroundColor:
                  activeSection === 'dashboard'
                    ? '#3a3a3a'
                    : 'rgba(0, 0, 0, 0.05)',
              },
              py: 1.5,
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  activeSection === 'dashboard'
                    ? '#ffffff'
                    : 'rgba(0, 0, 0, 0.6)',
                minWidth: '40px',
              }}
            >
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary='Dashboard'
              primaryTypographyProps={{
                fontWeight: 'medium',
                fontSize: '0.9rem',
                color:
                  activeSection === 'dashboard'
                    ? '#ffffff'
                    : 'rgba(0, 0, 0, 0.6)',
              }}
            />
          </ListItem>

          <ListItem
            button
            selected={activeSection === 'metaTrader'}
            onClick={() => setActiveSection('metaTrader')}
            sx={{
              borderRadius: '10px',
              mb: 1,
              backgroundColor:
                activeSection === 'metaTrader'
                  ? '#292929 !important'
                  : 'transparent',
              color: activeSection === 'metaTrader' ? '#ffffff' : 'inherit',
              '&:hover': {
                backgroundColor:
                  activeSection === 'metaTrader'
                    ? '#3a3a3a'
                    : 'rgba(0, 0, 0, 0.05)',
              },
              py: 1.5,
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  activeSection === 'metaTrader'
                    ? '#ffffff'
                    : 'rgba(0, 0, 0, 0.6)',
                minWidth: '40px',
              }}
            >
              <SyncAltIcon />
            </ListItemIcon>
            <ListItemText
              primary='Metatrader 5 Sync'
              primaryTypographyProps={{
                fontWeight: 'medium',
                fontSize: '0.9rem',
                color:
                  activeSection === 'metaTrader'
                    ? '#ffffff'
                    : 'rgba(0, 0, 0, 0.6)',
              }}
            />
          </ListItem>
        </Box>

        {/* Bottom Section */}
        <Box sx={{ mt: 'auto' }}>
          <ListItem
            button
            selected={activeSection === 'settings'}
            onClick={() => setActiveSection('settings')}
            sx={{
              borderRadius: '10px',
              backgroundColor:
                activeSection === 'settings'
                  ? '#292929 !important'
                  : 'transparent',
              color: activeSection === 'settings' ? '#ffffff' : 'inherit',
              '&:hover': {
                backgroundColor:
                  activeSection === 'settings'
                    ? '#3a3a3a'
                    : 'rgba(0, 0, 0, 0.05)',
              },
              py: 1.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: '40px',
                color:
                  activeSection === 'settings'
                    ? '#ffffff'
                    : 'rgba(0, 0, 0, 0.6)',
              }}
            >
              <SettingsIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary='Settings'
              primaryTypographyProps={{
                fontWeight: 'medium',
                fontSize: '0.9rem',
                color:
                  activeSection === 'settings'
                    ? '#ffffff'
                    : 'rgba(0, 0, 0, 0.6)',
              }}
            />
          </ListItem>
        </Box>
      </SidebarContainer>

      {/* Main content */}
      <MainContentContainer>
        {/* Header with Create button and avatar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mb: 3,
            gap: 2,
          }}
        >
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#292929',
              color: 'white',
              borderRadius: '20px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#3a3a3a',
              },
              px: 3,
            }}
          >
            Create
          </Button>
          <IconButton onClick={handleClick}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                border: '2px solid #f5f5f5',
                cursor: 'pointer',
              }}
              alt='User avatar'
              src='/avatar.png' // You may need to provide a real avatar image path
            />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                borderRadius: 2,
                minWidth: 150,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => setActiveSection('settings')}>
              <SettingsIcon fontSize='small' />
              Settings
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize='small' />
              Log out
            </MenuItem>
          </Menu>
        </Box>

        {renderContent()}
      </MainContentContainer>
    </Box>
  );
};

export default Dashboard;
