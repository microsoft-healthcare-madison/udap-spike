
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
import { ControllerInfo } from './models/ControllerInfo';
import { StorageHelper } from './util/StorageHelper';

const appApiUrl:string = 'http://localhost:3000/app/api'


export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [alertDialogIsOpen, setAlertDialogIsOpen] = useState<boolean>(false);
  const [alertDialogContent, setAlertDialogContent] = useState<string>('');

  const [controllerInfo, setControllerInfo] = useState<ControllerInfo>({
    endorserApiUrl: '',
    developerId: '',
    developerStatement: '',
    appId: '',
    appEndorsement: '',
  });

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  function toggleVisualMode() {

    if (StorageHelper.isLocalStorageAvailable) {
      localStorage.setItem('visualModeDark', (!darkMode).toString());
    } else {
      sessionStorage.setItem('visualModeDark', (!darkMode).toString());
    }

    setDarkMode(!darkMode);
  }

  function showError(content:string) {
    setAlertDialogContent(content);
    setAlertDialogIsOpen(true);
  }

  // useEffect(() => {
  //   console.log('rendering root app...');
  // });

  useEffect(() => {
    loadSettings();
    loadControllerInfo();
  }, []);

  function loadSettings() {
    if (localStorage.getItem('visualModeDark') === 'true') {
      setDarkMode(true);
    } else if (sessionStorage.getItem('visualModeDark') === 'true') {
      setDarkMode(true);
    }
  }

  async function loadControllerInfo() {
    let info:ControllerInfo = {
      endorserApiUrl: '',
      developerId: '',
      developerStatement: '',
      appId: '',
      appEndorsement: '',
    };

    try {
      let response: Response = await fetch(
        `${appApiUrl}/config`, {
          method: 'GET',
      });

      let body: string = await response.text();

      let data: any = JSON.parse(body);

      info = {...info,
        endorserApiUrl: data.endorserApiUrl,
        developerId: data.developerId,
        appId: data.appId,
      };

      response = await fetch(
        `${appApiUrl}/developer`, {
          method: 'GET',
      });

      body = await response.text();
      data = JSON.parse(body);

      info = {...info,
        developerStatement: JSON.stringify(data, null, 2),
      };

      response = await fetch(
        `${appApiUrl}/endorsement`, {
          method: 'GET',
        }
      );

      body = await response.text();
      data = JSON.parse(body);

      info = {...info,
        appEndorsement: JSON.stringify(data, null, 2),
      };

      setControllerInfo(info);
    } catch (err) {
      console.log('Caught error', err);
      showError(
        'Failed to retrieve app configuration!');
    }
  }

  function getFromQueryOrStorage(url:URL, key:string, setter?:((val:string) => void), save?:boolean) {
    if (url.searchParams.has(key)) {
      let val:string = url.searchParams.get(key) ?? '';

      if (save) {
        sessionStorage.setItem(key, val);
      }

      if (setter) {
        setter(val);
      }
      return(val);
    }

    let val = sessionStorage.getItem(key);
    if (val) {
      if (setter) {
        setter(val);
      }
      return(val);
    }

    return(undefined);
  }

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
                controllerInfo={controllerInfo}
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