
import React, { useEffect, useState } from 'react';

import { 
  Outlet,
  Link as RouterLink,
  LinkProps as RouterLinkProps,
 } from "react-router-dom";

import {
  Alert,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Theme,
  ThemeProvider,
  Toolbar,
} from '@mui/material'

import AppHeader from '../components/AppHeader';
import { CommonComponentProps } from '../models/CommonComponentProps';

export interface AppLayoutShellProps {
  common: CommonComponentProps;
  theme: Theme;
  toggleVisualMode: (() => void);
}

export default function AppLayoutShell(props: AppLayoutShellProps) {
  const [navIsOpen, setNavIsOpen] = useState<boolean>(false);

  function toggleNavOpen() {
    setNavIsOpen(!navIsOpen);
  }

  interface ListItemLinkProps {
    icon?: React.ReactElement;
    primary: string;
    to: string;
  }

  function ListItemLink(props: ListItemLinkProps) {
    const { icon, primary, to } = props;
  
    const renderLink = React.useMemo(
      () =>
        React.forwardRef<HTMLAnchorElement, Omit<RouterLinkProps, 'to'>>(function Link(
          itemProps,
          ref,
        ) {
          return <RouterLink to={to} ref={ref} {...itemProps} role={undefined} />;
        }),
      [to],
    );
  
    return (
      <li>
        <ListItem button component={renderLink}>
          {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
          <ListItemText primary={primary} />
        </ListItem>
      </li>
    );
  }

  return (
    <ThemeProvider theme={props.theme}>
      <CssBaseline />
      <AppHeader
        darkModeEnabled={props.common.darkModeEnabled}
        toggleVisualMode={props.toggleVisualMode}
        toggleNavOpen={toggleNavOpen}
        />
      <Drawer
        id='nav-menu'
        anchor='left'
        open={navIsOpen}
        onClose={() => setNavIsOpen(false)}
        >
        <Toolbar/>
        <List>
          <ListItemLink to='/' primary='Main Page'/>
          <ListItemLink to='/controller' primary='Controller Info'/>
          <ListItemLink to='/smart' primary='SMART Discovery'/>
        </List>
      </Drawer>
      <Outlet />      
    </ThemeProvider>
  );
};
