import React, { useEffect, useState } from 'react';

import { 
  Alert,
  Box, 
  Divider,
  Snackbar,
  Toolbar,
} from '@mui/material';

import * as fhir4 from 'fhir/r4';
import SoftwareStatementComponent from '../components/SoftwareStatementComponent';
import DeveloperComponent from '../components/DeveloperComponent';
import BasicConfigComponent from '../components/BasicConfigComponent';

export interface MainPageProps {
  darkModeEnabled: boolean;
  toggleVisualMode: (() => void);
}

const resourceDrawerWidth:number = 300;

export default function MainPage(props: MainPageProps) {

  const [alertDialogIsOpen, setAlertDialogIsOpen] = useState<boolean>(false);
  const [alertDialogContent, setAlertDialogContent] = useState<string>('');

  const [endorderApiUrl, setEndorserApiUrl] = useState<string>('http://localhost:3000/endorser/api');

  const [developerId, setDeveloperId] = useState<string>('2705933');
  const [developerStatement, setDeveloperStatement] = useState<string>('2705948');

  const [appId, setAppId] = useState<string>('');
  const [appEndorsement, setAppEndorsement] = useState<string>('');

  function showError(content:string) {
    setAlertDialogContent(content);
    setAlertDialogIsOpen(true);
  }

  return(
    <Box sx={{ display: 'flex' }}>
      <Snackbar
        open={alertDialogIsOpen}
        autoHideDuration={6000}
        onClose={() => setAlertDialogIsOpen(false)}
        anchorOrigin={{vertical: 'top', horizontal: 'center'}}
        >
        <Alert
          onClose={() => setAlertDialogIsOpen(false)}
          severity='error'
          >
          {alertDialogContent}
        </Alert>
      </Snackbar>
      <Box component='main' sx={{ flexGrow: 1, px: 2 }}>
        <Toolbar/>
        <BasicConfigComponent
          darkModeEnabled={props.darkModeEnabled}
          endorserApiUrl={endorderApiUrl}
          setEndorserApiUrl={setEndorserApiUrl}
          />
        <DeveloperComponent
          darkModeEnabled={props.darkModeEnabled}
          showError={showError}
          endorserApiUrl={endorderApiUrl}
          developerId={developerId}
          setDeveloperId={setDeveloperId}
          developerStatement={developerStatement}
          setDeveloperStatement={setDeveloperStatement}
          />
        <Divider />
        <SoftwareStatementComponent
          darkModeEnabled={props.darkModeEnabled}
          showError={showError}
          endorserApiUrl={endorderApiUrl}
          developerId={developerId}
          appId={appId}
          setAppId={setAppId}
          appEndorsement={appEndorsement}
          setAppEndorsement={setAppEndorsement}
          />
        <Divider />
      </Box>
    </Box>
  );
}