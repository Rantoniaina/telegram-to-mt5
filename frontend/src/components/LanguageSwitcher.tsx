import { IconButton, Menu, MenuItem, alpha } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  return (
    <div>
      <IconButton
        size='large'
        onClick={handleMenu}
        sx={{
          color: alpha('#fff', 0.7),
          '&:hover': {
            color: '#fff',
          },
        }}
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        id='language-menu'
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: alpha('#1A202C', 0.9),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`,
          },
        }}
      >
        <MenuItem
          onClick={() => changeLanguage('en')}
          sx={{
            color: '#fff',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.1),
            },
          }}
        >
          English
        </MenuItem>
        <MenuItem
          onClick={() => changeLanguage('fr')}
          sx={{
            color: '#fff',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.1),
            },
          }}
        >
          Français
        </MenuItem>
      </Menu>
    </div>
  );
};

export default LanguageSwitcher;
