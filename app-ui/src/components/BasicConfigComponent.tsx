import React, { useState } from 'react';

import { 
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControl,
  Paper,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';

import { ExpandMore } from '@mui/icons-material';

export interface BasicConfigComponentProps {
  darkModeEnabled: boolean;
  endorserApiUrl: string;
  setEndorserApiUrl: ((value:string) => void);
}

export default function BasicConfigComponent(props: BasicConfigComponentProps) {

  function handleApiUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    props.setEndorserApiUrl(event.target.value);
  }

  return(
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMore/>}
        aria-controls='dev-info'
        id='dev-info-header'
        >
        <Typography>Basic Configuration</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TextField
          fullWidth
          id='endorser-api-url'
          label='Endorser API URL'
          InputLabelProps={{shrink:true}}
          helperText='Full URL to the root of the Endorser API (e.g., http://localhost:3000/endorser/api)'
          value={props.endorserApiUrl}
          onChange={handleApiUrlChange}
          />
      </AccordionDetails>
    </Accordion>
  );

}