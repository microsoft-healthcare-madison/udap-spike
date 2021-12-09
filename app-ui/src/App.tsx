
import React, { useEffect, useState } from 'react';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import {
  Alert,
  CssBaseline,
  createTheme,
  Drawer,
  Snackbar,
  ThemeProvider,
} from '@mui/material'

import './App.css';

import AppHeader from './components/AppHeader';

import MainPage from './pages/MainPage';
import ControllerInfoPage from './pages/ControllerInfoPage';
import AppLayoutShell from './pages/AppLayoutShell';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [alertDialogIsOpen, setAlertDialogIsOpen] = useState<boolean>(false);
  const [alertDialogContent, setAlertDialogContent] = useState<string>('');

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  function toggleVisualMode() {
    setDarkMode(!darkMode);
  }

  function showError(content:string) {
    setAlertDialogContent(content);
    setAlertDialogIsOpen(true);
  }

  useEffect(() => {
    console.log('rendering app...');
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route path='*' element={
          <AppLayoutShell
            theme={theme}
            darkModeEnabled={darkMode}
            toggleVisualMode={toggleVisualMode}
            alertDialogIsOpen={alertDialogIsOpen}
            setAlertDialogIsOpen={setAlertDialogIsOpen}
            alertDialogContent={alertDialogContent}
            />
          }>
            <Route path='controller' element={
              <ControllerInfoPage 
                darkModeEnabled={darkMode}
                toggleVisualMode={toggleVisualMode}
                showError={showError}
                />
            }/>
            <Route path='*' element={
              <MainPage
                darkModeEnabled={darkMode}
                toggleVisualMode={toggleVisualMode}
                showError={showError}
              />
            }/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
