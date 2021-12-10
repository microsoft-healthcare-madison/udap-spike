import React, { useState } from 'react';


import { 
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  Paper,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';

import { ExpandMore } from '@mui/icons-material';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  atomDark as highlightDark, 
  coy as highlightLight 
} from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface SoftwareStatementComponentProps {
  darkModeEnabled: boolean;
  showError: ((content:string) => void);
  endorserApiUrl: string;
  developerId: string;
  appId: string;
  setAppId: ((value:string) => void);
  appEndorsement: string;
  setAppEndorsement: ((value:string) => void);
}

export default function SoftwareStatementComponent(props: SoftwareStatementComponentProps) {

  function handleAppIdChange(event: React.ChangeEvent<HTMLInputElement>) {
    props.setAppId(event.target.value);
  }

  async function handleFetchClick(event:React.MouseEvent) {
    try {
      let response: Response = await fetch(
        `${props.endorserApiUrl}/developer/${props.developerId}/app/${props.appId}/endorsement`, {
          method: "GET",
      });
    
      let body: string = await response.text();

      props.setAppEndorsement(JSON.stringify(JSON.parse(body), null, 2));
    } catch (err) {
      props.setAppEndorsement('');
      console.log('Caught error', err);
      props.showError(
        'Failed to retrieve the application endorsement, see console for details.');
    }
  }

  return(
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMore/>}
        aria-controls='dev-info'
        id='dev-info-header'
        >
        <Typography>Application Information</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TextField
          fullWidth
          id='app-id'
          label='App ID'
          InputLabelProps={{shrink:true}}
          helperText='ID of this application'
          value={props.appId}
          onChange={handleAppIdChange}
          />
        <Button
          variant='contained'
          onClick={handleFetchClick}
          disabled={(!props.appId)}
          >
          Fetch Application Endorsement
        </Button>
        <SyntaxHighlighter
          language='json'
          style={props.darkModeEnabled ? highlightDark : highlightLight}
          wrapLines={false}
          showLineNumbers
          >
          {props.appEndorsement}
        </SyntaxHighlighter>
      </AccordionDetails>
    </Accordion>
  );

}