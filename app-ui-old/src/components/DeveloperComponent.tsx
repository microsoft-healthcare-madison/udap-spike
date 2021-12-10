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


export interface DeveloperComponentProps {
  darkModeEnabled: boolean;
  showError: ((content:string) => void);
  endorserApiUrl: string;
  developerId: string;
  setDeveloperId: ((value:string) => void);
  developerStatement: string;
  setDeveloperStatement: ((value:string) => void);
}

export default function DeveloperComponent(props: DeveloperComponentProps) {

  function handleDevIdChange(event: React.ChangeEvent<HTMLInputElement>) {
    props.setDeveloperId(event.target.value);
  }

  async function handleFetchClick(event:React.MouseEvent) {
    try {
      let response: Response = await fetch(
        `${props.endorserApiUrl}/developer/${props.developerId}`, {
          method: "GET",
      });
  
      let body: string = await response.text();
  
      props.setDeveloperStatement(JSON.stringify(JSON.parse(body), null, 2));
    } catch (err) {
      props.setDeveloperStatement('');
      console.log('Caught error', err);
      props.showError(
        'Failed to retrieve the developer statement, see console for details.');
    }
  }

  return(
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMore/>}
        aria-controls='dev-info'
        id='dev-info-header'
        >
        <Typography>Developer Information</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TextField
          fullWidth
          id='developer-id'
          label='Developer ID'
          InputLabelProps={{shrink:true}}
          helperText='ID of the developer endorsing this application'
          value={props.developerId}
          onChange={handleDevIdChange}
          />
        <Button
          variant='contained'
          onClick={handleFetchClick}
          disabled={(!props.developerId)}
          >
          Fetch Developer Statement
        </Button>
        <SyntaxHighlighter
          language='json'
          style={props.darkModeEnabled ? highlightDark : highlightLight}
          wrapLines={false}
          showLineNumbers
          >
          {props.developerStatement}
        </SyntaxHighlighter>
      </AccordionDetails>
    </Accordion>
  );

}