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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import telegramService from '../../services/telegramService';
import { DashboardSection } from './DashboardSection';
import { MetaTraderSection } from './MetaTraderSection';
import { SettingsSection } from './SettingsSection';

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

const Dashboard = () => {
  const { t } = useTranslation();
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
          <DashboardSection
            loadingDialogs={loadingDialogs}
            dialogsCount={dialogsCount}
            credentials={
              credentials
                ? { api_id: credentials.api_id.toString() }
                : undefined
            }
          />
        );
      case 'metaTrader':
        return <MetaTraderSection onCreateClick={handleCreateClick} />;
      case 'settings':
        return <SettingsSection />;
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
            {t('app.name')}
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
              primary={t('common.dashboard')}
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
              primary={t('metatrader.title')}
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
              primary={t('settings.title')}
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
            {t('common.create')}
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
              <SettingsIcon sx={{ mr: 2 }} />
              {t('settings.title')}
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 2 }} />
              {t('common.logout')}
            </MenuItem>
          </Menu>
        </Box>

        {renderContent()}
      </MainContentContainer>
    </Box>
  );
};

export default Dashboard;
