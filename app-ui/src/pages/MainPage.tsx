import React, { useEffect, useState } from 'react';

import { 
  Box, 
  Divider,
  Toolbar,
  Typography,
} from '@mui/material';

import * as fhir4 from 'fhir/r4';
import SoftwareStatementComponent from '../components/SoftwareStatementComponent';
import DeveloperComponent from '../components/DeveloperComponent';
import BasicConfigComponent from '../components/BasicConfigComponent';
import ControllerInfoComponent from '../components/ControllerInfoComponent';

export interface MainPageProps {
  darkModeEnabled: boolean;
  toggleVisualMode: (() => void);
  showError: ((content:string) => void);
}

const resourceDrawerWidth:number = 300;
const appApiUrl:string = 'http://localhost:3000/app/api'

export default function MainPage(props: MainPageProps) {

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
      props.showError(
        'Failed to retrieve app configuration!');
    }
  }


  return(
    <Box sx={{ display: 'flex' }}>
      <Box component='main' sx={{ flexGrow: 1, px: 2 }}>
        <Toolbar/>
        <Typography>Main Page</Typography>
        <Divider />
      </Box>
    </Box>
  );
}