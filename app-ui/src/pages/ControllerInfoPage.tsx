import React, { useEffect, useState } from 'react';

import { 
  Box, 
  Divider,
  Toolbar,
} from '@mui/material';

import ControllerInfoComponent from '../components/ControllerInfoComponent';
import { ControllerInfo } from '../models/ControllerInfo';

export interface ControllerInfoPageProps {
  darkModeEnabled: boolean;
  toggleVisualMode: (() => void);
  showError: ((content:string) => void);
  controllerInfo: ControllerInfo;
}

const resourceDrawerWidth:number = 300;
const appApiUrl:string = 'http://localhost:3000/app/api'

export default function ControllerInfoPage(props: ControllerInfoPageProps) {

  return(
    <Box sx={{ display: 'flex' }}>
      <Box component='main' sx={{ flexGrow: 1, px: 2 }}>
        <Toolbar/>
        <ControllerInfoComponent
          darkModeEnabled={props.darkModeEnabled}
          controllerInfo={props.controllerInfo}
          />
        <Divider />
      </Box>
    </Box>
  );
}