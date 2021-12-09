import React, { useState } from 'react';

import { 
  AppBar, 
  Divider,
  Drawer, 
  IconButton, 
  ToggleButtonGroup,
  ToggleButton,
  Toolbar, 
  Typography,
  Button,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

export interface AppHeaderProps {
  darkModeEnabled: boolean;
  toggleVisualMode: (() => void);
  toggleNavOpen: (() => void);
}

export default function AppHeader(props: AppHeaderProps) {

  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);

  function handleModeChange(event: React.MouseEvent<HTMLElement>, modeValue:any) {
    console.log(modeValue)
    if (modeValue !== null) {
      props.toggleVisualMode();
    }
  }

  return(
  <div>
    <AppBar 
      position='fixed'
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
      <Toolbar>
        <IconButton
          aria-label='navigation'
          onClick={() => props.toggleNavOpen()}
          >
          <MenuIcon/>
        </IconButton>
        <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
          UDAP Spike App
        </Typography>
        <IconButton aria-label='settings' onClick={() => setSettingsVisible(true)}>
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
    <Drawer
      anchor='right'
      open={settingsVisible}
      onClose={() => setSettingsVisible(false)}
      >
      <Typography variant='h6' component='div' sx={{ margin: 1}}>
        Settings
      </Typography>
      <Divider sx={{ marginBottom: 2 }} />
      <ToggleButtonGroup
        exclusive
        value={props.darkModeEnabled ? 'dark' : 'light'}
        aria-label='ui mode'
        onChange={handleModeChange}
        >
        <ToggleButton value='light'>
          <LightModeIcon />
          Light
        </ToggleButton>
        <ToggleButton value='dark'>
          <DarkModeIcon />
          Dark
        </ToggleButton>
      </ToggleButtonGroup>
    </Drawer>
  </div>
  );
}