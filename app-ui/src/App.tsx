
import React, { useEffect, useState } from 'react';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import {
  Alert,
  CssBaseline,
  createTheme,
  Drawer,
  Snackbar,
  ThemeProvider,
  AlertColor,
} from '@mui/material'

import './App.css';

import AppHeader from './components/AppHeader';

import MainPage from './pages/MainPage';
import ControllerInfoPage from './pages/ControllerInfoPage';
import AppLayoutShell from './pages/AppLayoutShell';
import { ControllerInfo } from './models/ControllerInfo';
import { StorageHelper } from './util/StorageHelper';
import { CommonComponentProps } from './models/CommonComponentProps';
import { CopyHelper } from './util/CopyHelper';

import {
  ContentCopy, Warning,
} from '@mui/icons-material';
import SmartAuthPage from './pages/StartAuthPage';


const appApiUrl:string = 'http://localhost:3000/app/api'

export default function App() {
  interface AlertDialogInfo {
    isOpen: boolean;
    content: string;
    severity: AlertColor;
  }

  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [alertInfo, setAlertInfo] = useState<AlertDialogInfo>({
    isOpen: false,
    content: '',
    severity: 'error',
  });

  const [controllerInfo, setControllerInfo] = useState<ControllerInfo>({
    endorserApiUrl: '',
    developerId: '',
    developerStatement: '',
    appId: '',
    appEndorsement: '',
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [commonProps, setCommonProps] = useState<CommonComponentProps>({
    darkModeEnabled: false,
    showMessage: showMessage,
    copyToClipboard: copyToClipboard,
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

  function copyToClipboard(content: string, hint?: string) {
    const success = CopyHelper.copyToClipboard(content);

    if ((success) && (hint)) {
      showMessage(`${hint} Copied!`, 'success');
    }

    if ((!success) && (hint)) {
      showMessage('Failed to copy!', 'error');
    }
  }

  function showMessage(content:string, severity?:AlertColor) {
    setAlertInfo({
      isOpen: true,
      content: content,
      severity: severity ?? 'error',
    });
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
      showMessage(
        'Failed to retrieve app configuration!',
        'error');
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
    <>
    <BrowserRouter>
      <Routes>
        <Route path='*' element={
          <AppLayoutShell
            common={commonProps}
            theme={theme}
            toggleVisualMode={toggleVisualMode}
            />
          }>
            <Route path='smart' element={
              <SmartAuthPage 
                common={commonProps}
                isAuthenticated={isAuthenticated}
                />
            }/>
            <Route path='controller' element={
              <ControllerInfoPage 
                common={commonProps}
                controllerInfo={controllerInfo}
                />
            }/>
            <Route path='' element={
              <MainPage
                common={commonProps}
                isAuthenticated={isAuthenticated}
              />
            }/>
        </Route>
      </Routes>
    </BrowserRouter>
    <Snackbar
      open={alertInfo.isOpen}
      autoHideDuration={6000}
      onClose={() => setAlertInfo({...alertInfo, isOpen: false})}
      anchorOrigin={{vertical: 'top', horizontal: 'center'}}
      >
      <Alert
        onClose={() => setAlertInfo({...alertInfo, isOpen: false})}
        severity={alertInfo.severity}
        >
        {alertInfo.content}
      </Alert>
    </Snackbar>
    </>
    );
};