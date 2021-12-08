import React, { useState } from 'react';

import { 
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  TextField,
  Typography,
} from '@mui/material';

import {
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  atomDark as highlightDark, 
  coy as highlightLight 
} from 'react-syntax-highlighter/dist/esm/styles/prism';


export interface AboutComponentProps {
  darkModeEnabled: boolean;
  endorserApiUrl: string;
  developerId: string;
  developerStatement: string;
  appId: string;
  appEndorsement: string;
}

export default function AboutComponent(props: AboutComponentProps) {

  const [showDeveloperStatement, setShowDeveloperStatement] = useState<boolean>(false);
  const [showAppEndorsement, setShowAppEndorsement] = useState<boolean>(false);

  async function handleToggleDevStatement(event:React.MouseEvent) {
    setShowDeveloperStatement(!showDeveloperStatement);
  }

  async function handleTogglesAppEndorsement(event:React.MouseEvent) {
    setShowAppEndorsement(!showAppEndorsement);
  }

  return(
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMore/>}
        aria-controls='dev-info'
        id='dev-info-header'
        >
        <Typography>App Configuration</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TextField
          fullWidth
          id='endorser-api-url'
          label='Endorser API URL'
          InputLabelProps={{shrink:true}}
          helperText='Full URL to the root of the Endorser API (e.g., http://localhost:3000/endorser/api)'
          value={props.endorserApiUrl}
          disabled={true}
          />
        <TextField
          fullWidth
          id='developer-id'
          label='Developer ID'
          InputLabelProps={{shrink:true}}
          helperText='ID of the developer endorsing this application'
          value={props.developerId}
          disabled={true}
          />
        <Button
          variant='contained'
          onClick={handleToggleDevStatement}
          >
          { (showDeveloperStatement) &&
            <ExpandLess />
          }
          { (!showDeveloperStatement) &&
            <ExpandMore />
          }
        </Button>
        { (showDeveloperStatement) &&
          <SyntaxHighlighter
            language='json'
            style={props.darkModeEnabled ? highlightDark : highlightLight}
            wrapLines={false}
            showLineNumbers
            >
            {props.developerStatement}
          </SyntaxHighlighter>
        }
        <TextField
          fullWidth
          id='app-id'
          label='App ID'
          InputLabelProps={{shrink:true}}
          helperText='ID of this application'
          value={props.appId}
          disabled={true}
          />
        <Button
          variant='contained'
          onClick={handleTogglesAppEndorsement}
          >
          { (showAppEndorsement) &&
            <ExpandLess />
          }
          { (!showAppEndorsement) &&
            <ExpandMore />
          }
        </Button>
        { (showAppEndorsement) &&
          <SyntaxHighlighter
            language='json'
            style={props.darkModeEnabled ? highlightDark : highlightLight}
            wrapLines={false}
            showLineNumbers
            >
            {props.appEndorsement}
          </SyntaxHighlighter>
        }
      </AccordionDetails>
    </Accordion>
  );
}