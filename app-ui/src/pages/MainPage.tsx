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

export default function MainPage(props: MainPageProps) {

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