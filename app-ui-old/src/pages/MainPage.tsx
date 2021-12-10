import React, { useEffect, useState } from 'react';

import { 
  Box, 
  Divider,
  Toolbar,
  Typography,
} from '@mui/material';

import { CommonComponentProps } from '../models/CommonComponentProps';

export interface MainPageProps {
  common: CommonComponentProps;
  isAuthenticated: boolean;
}

export default function MainPage(props: MainPageProps) {

  return(
    <Box sx={{ display: 'flex' }}>
      <Box component='main' sx={{ flexGrow: 1, px: 2 }}>
        <Toolbar/>
        <Typography>Main Page</Typography>
        <Divider sx={{marginBottom: '1em'}} />
        { props.isAuthenticated &&
          <Typography>
            User is currently authenticated with an EHR!
          </Typography>
        }
        { !props.isAuthenticated &&
          <Typography>
            User is NOT currently authenticated with an EHR!
          </Typography>
        }
      </Box>
    </Box>
  );
}