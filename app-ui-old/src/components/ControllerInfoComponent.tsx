import React, { useState } from 'react';

import { 
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
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
import { ControllerInfo } from '../models/ControllerInfo';
import { CommonComponentProps } from '../models/CommonComponentProps';


export interface ControllerInfoComponentProps {
  common: CommonComponentProps;
  controllerInfo: ControllerInfo;
}

export default function ControllerInfoComponent(props: ControllerInfoComponentProps) {

  const [showDeveloperStatement, setShowDeveloperStatement] = useState<boolean>(false);
  const [showAppEndorsement, setShowAppEndorsement] = useState<boolean>(false);

  async function handleToggleDevStatement(event:React.MouseEvent) {
    setShowDeveloperStatement(!showDeveloperStatement);
  }

  async function handleTogglesAppEndorsement(event:React.MouseEvent) {
    setShowAppEndorsement(!showAppEndorsement);
  }

  return(
    <Box>
      <Typography>
        Controller App Information
      </Typography>
      <TextField
          fullWidth
          id='endorser-api-url'
          label='Endorser API URL'
          InputLabelProps={{shrink:true}}
          helperText='Full URL to the root of the Endorser API (e.g., http://localhost:3000/endorser/api)'
          value={props.controllerInfo.endorserApiUrl}
          disabled={true}
          />
        <TextField
          fullWidth
          id='developer-id'
          label='Developer ID'
          InputLabelProps={{shrink:true}}
          helperText='ID of the developer endorsing this application'
          value={props.controllerInfo.developerId}
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
            style={props.common.darkModeEnabled ? highlightDark : highlightLight}
            wrapLines={false}
            showLineNumbers
            >
            {props.controllerInfo.developerStatement}
          </SyntaxHighlighter>
        }
        <TextField
          fullWidth
          id='app-id'
          label='App ID'
          InputLabelProps={{shrink:true}}
          helperText='ID of this application'
          value={props.controllerInfo.appId}
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
            style={props.common.darkModeEnabled ? highlightDark : highlightLight}
            wrapLines={false}
            showLineNumbers
            >
            {props.controllerInfo.appEndorsement}
          </SyntaxHighlighter>
        }
    </Box>
  );
}