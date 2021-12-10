import * as React from 'react';

import { 
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  Divider,
  Icon,
  CircularProgress,
  Button,
  IconButton,
  Typography,
  Select,
  SelectChangeEvent,
} from '@mui/material';

import {
  Remove as MinusIcon,
  Done as CompleteIcon,
  ArrowRightAlt as AvailableIcon,
  DoNotDisturb as DisabledIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'


import { DataCardInfo } from '../models/DataCardInfo';
import { CommonComponentProps } from '../models/CommonComponentProps';
import { SingleRequestData } from '../models/RequestData';
import RequestDataPanel from './RequestDataPanel';
import { DataCardStatus } from '../models/DataCardStatus';

export interface DataCardProps {
  info: DataCardInfo,
  status: DataCardStatus
  data: SingleRequestData[],
  common: CommonComponentProps,
  children?: React.ReactNode,
  processRowDelete?: ((index: number) => void),
  processRowToggle?: ((index: number) => void),
  tabButtonText?: string,
  tabButtonHandler?: ((index: number) => void),
  renderChildrenAfter?: boolean,
}

export default function DataCard(props: DataCardProps) {

  const [showContent, setShowContent] = React.useState<boolean>(true);
  const [selectedDataIndex, setSelectedDataIndex] = React.useState<number>(-1);

  /** Function to toggle show/hide of this card's content */
  function handleToggleCardContentClick() {
    setShowContent(!showContent);
  }

  /** Function to get an appropriate icon for this card */
  function iconForCard():JSX.Element {
    if (props.status.busy) {
      return(<CircularProgress />);
    }
    if (!props.info.stepNumber) {
      return(<MinusIcon />);
    }
    if (props.status.complete) {
      return(<CompleteIcon />);
    }
    if (props.status.available) {
      return(<AvailableIcon />);
    }
    return(<DisabledIcon />);
  }

  /** Process HTML events for the data index select box */
	function handleDataIndexChange(event:SelectChangeEvent) {
		setSelectedDataIndex(parseInt(event.target.value));
  }

  return (
    <Accordion
      key={props.info.id}
      >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon/>}
        >
        <Typography variant='h5'>
          {iconForCard()}
          {props.info.optional ? '(Optional) ':''}{props.info.heading}
          { ((showContent) && (props.data.length > 1)) &&
            <Select
              id='index-selector'
              value={selectedDataIndex.toString()}
              onChange={handleDataIndexChange}
              style={{margin: 5}}
              >
              <option value={-1}>Latest</option>
              { props.data.map((value, index) => (
                <option key={index} value={index}>{value.name}</option> 
                ))}
            </Select>
          }
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        { (props.info.description !== '') &&
            <Typography variant='h6'>{props.info.description}</Typography>
          }
          { ((props.renderChildrenAfter !== true) && (props.children !== undefined)) &&
            props.children
          }
          { ((props.renderChildrenAfter === true) || (props.children !== undefined)) &&
            <br />
          }
          <RequestDataPanel
            common={props.common}
            data={props.data}
            busy={props.status.busy}
            selectedDataRowIndex={selectedDataIndex}
            processRowDelete={props.processRowDelete}
            processRowToggle={props.processRowToggle}
            tabButtonText={props.tabButtonText}
            tabButtonHandler={props.tabButtonHandler}
            />
          { ((props.renderChildrenAfter === true) && (props.children !== undefined)) &&
            <>
              <br />
              {props.children}
            </>
          }
        </AccordionDetails>
    </Accordion>
    // <Box key={props.info.id}>
    //   <IconButton
    //     onClick={handleToggleCardContentClick}
    //     sx={{float: 'right'}}
    //     >
    //     {showContent ? <ExpandMoreIcon /> : <ExpandLessIcon />}
    //   </IconButton>
    //   <div style={{float:'left', width: '20px', marginLeft: '5px', marginRight: '10px'}}>
    //     {iconForCard()}
    //   </div>
    //   { showContent &&
    //     <div>

    //     </div>
    //   }
    // </Box>
  );
}


