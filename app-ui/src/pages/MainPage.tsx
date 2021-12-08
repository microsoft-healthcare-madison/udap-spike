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
import ControllerInfoComponent from '../components/ControllerInfoComponent';

export interface MainPageProps {
  darkModeEnabled: boolean;
  toggleVisualMode: (() => void);
}

const resourceDrawerWidth:number = 300;
const appApiUrl:string = 'http://localhost:3000/app/api'

export default function MainPage(props: MainPageProps) {

  const [alertDialogIsOpen, setAlertDialogIsOpen] = useState<boolean>(false);
  const [alertDialogContent, setAlertDialogContent] = useState<string>('');

  const [endorderApiUrl, setEndorserApiUrl] = useState<string>('');

  const [developerId, setDeveloperId] = useState<string>('');
  const [developerStatement, setDeveloperStatement] = useState<string>('');

  const [appId, setAppId] = useState<string>('');
  const [appEndorsement, setAppEndorsement] = useState<string>('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      let response: Response = await fetch(
        `${appApiUrl}/config`, {
          method: 'GET',
      });

      let body: string = await response.text();

      let data: any = JSON.parse(body);

      setEndorserApiUrl(data.endorserApiUrl);
      setDeveloperId(data.developerId);
      setAppId(data.appId);

      response = await fetch(
        `${appApiUrl}/developer`, {
          method: 'GET',
      });

      body = await response.text();
      data = JSON.parse(body);

      setDeveloperStatement(JSON.stringify(data, null, 2));


      response = await fetch(
        `${appApiUrl}/endorsement`, {
          method: 'GET',
        }
      );

      body = await response.text();
      data = JSON.parse(body);

      setAppEndorsement(JSON.stringify(data, null, 2));
    } catch (err) {
      console.log('Caught error', err);
      showError(
        'Failed to retrieve app configuration!');
    }
  }

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
        <ControllerInfoComponent
          darkModeEnabled={props.darkModeEnabled}
          endorserApiUrl={endorderApiUrl}
          developerId={developerId}
          developerStatement={developerStatement}
          appId={appId}
          appEndorsement={appEndorsement}
          />
        {/*
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
        */}
        <Divider />
      </Box>
    </Box>
  );
}