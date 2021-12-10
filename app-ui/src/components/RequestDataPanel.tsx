import React, {useState, useEffect} from 'react';

import {
  Button, 
  Box,
  Tabs,
  Tab,
  Tooltip, 
  Icon, 
  Switch, 
  IconButton, 
  FormControlLabel, 
  Typography,
} from '@mui/material';

import {
  TabContext,
  TabList,
  TabPanel,
} from '@mui/lab'

import { CommonComponentProps } from '../models/CommonComponentProps';
import { SingleRequestData, RenderDataAsTypes } from '../models/RequestData';

// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  atomDark as highlightDark, 
  coy as highlightLight 
} from 'react-syntax-highlighter/dist/esm/styles/prism';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'

import {
  Remove as NoTypeIcon,
  Code as JsonIcon,
  Error as ErrorIcon,
  LocalFireDepartment as FhirIcon,
  TextFormat as TextIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Language as RequestIcon,
} from '@mui/icons-material'


export interface RequestPanelProps {
  common: CommonComponentProps,
  data: SingleRequestData[],
  busy?: boolean,
  processRowDelete?: ((index: number) => void),
  processRowToggle?: ((index: number) => void),
  selectedDataRowIndex?: number,
  tabButtonText?: string,
  tabButtonHandler?: ((index: number) => void),
}

export default function RequestDataPanel(props: RequestPanelProps) {

  const [selectedTabId, setSelectedTabId] = useState<string>('');
  const [displayedTabId, setDisplayedTabId] = useState<string>('');

  const dataRowIndex:number = ((props.selectedDataRowIndex === undefined) || (props.selectedDataRowIndex === -1))
    ? (props.data ? props.data.length - 1 : -1 )
    : props.selectedDataRowIndex!;

  useEffect(() => {
    if ((selectedTabId === displayedTabId) && (selectedTabId !== '')) {
      return;
    }

    if ((!props.data) || (props.data.length === 0)) {
      setDisplayedTabId('');
      return;
    }

    if (selectedTabId !== '') {
      setDisplayedTabId(selectedTabId);
    }
    
    if (selectedTabId === '') {
      setDisplayedTabId('0');
      // if (props.data[dataRowIndex].info) {
      //   setDisplayedTabId('info');
      // } else if (props.data[dataRowIndex].responseData) {
      //   setDisplayedTabId('response_data');
      // } else if (props.data[dataRowIndex].outcome) {
      //   setDisplayedTabId('outcome');
      // } else if (props.data[dataRowIndex].requestData) {
      //   setDisplayedTabId('request_data');
      // } else if (props.data[dataRowIndex].requestUrl) {
      //   setDisplayedTabId('request_url');
      // }
    }
  }, [props.data, selectedTabId, displayedTabId, dataRowIndex]);

  if ((!props.data) || (props.data.length === 0)) {
    return(null);
  }

  function iconForType(dataType: RenderDataAsTypes|undefined):JSX.Element {
    switch (dataType)
    {
      case RenderDataAsTypes.None:  return <NoTypeIcon/>;
      case RenderDataAsTypes.FHIR:  return <FhirIcon/>;
      case RenderDataAsTypes.JSON:  return <JsonIcon/>;
      case RenderDataAsTypes.Error: return <ErrorIcon/>;
      case RenderDataAsTypes.Text:  return <TextIcon/>;
      default:                      return <InfoIcon/>;
    }
  }

  function handleTabChange(event: React.SyntheticEvent, navbarTabId: string) {
    setSelectedTabId(navbarTabId);
  }

  function handleCopyClick() {
    console.log(`Request to copy from ${displayedTabId}`);
    switch (displayedTabId)
    {
      case 'request_url':
        props.common.copyToClipboard(props.data[dataRowIndex].requestUrl!, 'Request URL');
        return;
        // break;
      case 'request_data':
        props.common.copyToClipboard(props.data[dataRowIndex].requestData!, 'Request Data');
        return;
        // break;
      case 'response_data':
        props.common.copyToClipboard(props.data[dataRowIndex].responseData!, 'Response Data');
        return;
        // break;
      case 'info':
        props.common.copyToClipboard(props.data[dataRowIndex].info!, 'Info');
        return;
        // break;
      case 'outcome':
        props.common.copyToClipboard(props.data[dataRowIndex].outcome!, 'OperationOutcome');
        return;
        // break;
    }

    if (props.data[dataRowIndex].extended) {
      props.data[dataRowIndex].extended!.forEach((value:string, name:string) => {
        let key:string = nameToKey(name);

        if (key === displayedTabId) {
          props.common.copyToClipboard(value);
        }
      });
    }
  }

  function handleDeleteClick() {
    props.processRowDelete!(dataRowIndex);
  }

  function handleToggle() {
    props.processRowToggle!(dataRowIndex);
  }

  function handleTabButtonClick() {
    props.tabButtonHandler!(dataRowIndex);
  }

  function buildTabPanel(
    key:string,
    content:string,
    index:string,
    renderAs?:RenderDataAsTypes):JSX.Element 
    {
    let lang:string;
    switch (renderAs) {
      case RenderDataAsTypes.Text:
          lang = 'text';
        break;

      case RenderDataAsTypes.Error:
      case RenderDataAsTypes.FHIR:
      case RenderDataAsTypes.JSON:
        lang = 'json';
        break;

      case RenderDataAsTypes.Markdown:
        lang = 'markdown';
        break;
  
      case RenderDataAsTypes.HTML:
        lang = 'html';
        break;
    
      default:
        lang = 'text';
        break;
    }

    if ((renderAs === RenderDataAsTypes.Markdown) || 
        (renderAs === RenderDataAsTypes.HTML)) {
      return (
        <TabPanel
          key={key}
          id={key}
          value={index}
          >
          <ReactMarkdown
            className={props.common.darkModeEnabled ? 'code-md-tab-dark' : 'code-md-tab-light'}
            skipHtml={false}
            children={content}
            remarkPlugins={[remarkGfm]}
            />
        </TabPanel>
      );
    }

    return (
      <TabPanel
        key={key}
        id={key}
        value={index}
        >
        <SyntaxHighlighter
          className='code-tab'
          language={lang}
          style={props.common.darkModeEnabled ? highlightDark : highlightLight}
          >
          {content}
        </SyntaxHighlighter>
      </TabPanel>
    );
  }

  function nameToKey(name:string):string {
    return name.replace(' ', '_').toLowerCase();
  }

  function buildDataTabPanels() {
    let tabs:JSX.Element[] = [];

    if (props.data[dataRowIndex].requestUrl) {
      tabs.push(
          buildTabPanel(
            'request_url',
            props.data[dataRowIndex].requestUrl!,
            tabs.length.toString(),
            RenderDataAsTypes.Text));
    }

    if (props.data[dataRowIndex].requestData) {
      tabs.push(
          buildTabPanel(
            'request_data',
            props.data[dataRowIndex].requestData!,
            tabs.length.toString(),
            props.data[dataRowIndex].requestDataType ?? RenderDataAsTypes.JSON));
    }

    if (props.data[dataRowIndex].outcome) {
      tabs.push(
          buildTabPanel(
            'outcome',
            props.data[dataRowIndex].outcome!,
            tabs.length.toString(),
            RenderDataAsTypes.FHIR));
    }

    if (props.data[dataRowIndex].responseData) {
      tabs.push(
          buildTabPanel(
            'response_data',
            props.data[dataRowIndex].responseData!,
            tabs.length.toString(),
            props.data[dataRowIndex].responseDataType ?? RenderDataAsTypes.Text));
    }

    if (props.data[dataRowIndex].info) {
      tabs.push(
          buildTabPanel(
            'info',
            props.data[dataRowIndex].info!,
            tabs.length.toString(),
            props.data[dataRowIndex].infoDataType ?? RenderDataAsTypes.JSON));
    }

    if (props.data[dataRowIndex].extended) {
      props.data[dataRowIndex].extended!.forEach((value:string, name:string) => {
        let key:string = nameToKey(name);
        tabs.push(
          buildTabPanel(
            key,
            value,
            tabs.length.toString(),
            props.data[dataRowIndex].extendedDataType ?? RenderDataAsTypes.Text));
      });
    }

    return tabs;
  }

  function buildDataTabs() {
    let tabs:JSX.Element[] = [];

    if (props.data[dataRowIndex].requestUrl) {
      tabs.push(
        <Tab
          key='request_url'
          value={tabs.length.toString()}
          label='Request URL'
          icon={<RequestIcon/>}
          iconPosition='start'
          />);
    }

    if (props.data[dataRowIndex].requestData) {
      tabs.push(
        <Tab
          key='request_data'
          value={tabs.length.toString()}
          label='Request Data'
          icon={iconForType(props.data[dataRowIndex].requestDataType ?? RenderDataAsTypes.JSON)}
          iconPosition='start'
          />);
    }

    if (props.data[dataRowIndex].outcome) {
      tabs.push(
        <Tab
          key='outcome'
          value={tabs.length.toString()}
          label='Outcome'
          icon={<FhirIcon/>}
          iconPosition='start'
          />);
    }

    if (props.data[dataRowIndex].responseData) {
      tabs.push(
        <Tab
          key='response_data'
          value={tabs.length.toString()}
          label='Response Data'
          icon={iconForType(props.data[dataRowIndex].responseDataType ?? RenderDataAsTypes.Text)}
          iconPosition='start'
          />);
    }

    if (props.data[dataRowIndex].info) {
      tabs.push(
        <Tab
          key='info'
          value={tabs.length.toString()}
          label='Info'
          icon={iconForType(props.data[dataRowIndex].requestDataType ?? RenderDataAsTypes.JSON)}
          iconPosition='start'
          />);
    }

    if (props.data[dataRowIndex].extended) {
      props.data[dataRowIndex].extended!.forEach((value:string, name:string) => {
        let key:string = nameToKey(name);
        tabs.push(
          <Tab
            key={key}
            value={tabs.length.toString()}
            label={name}
            icon={iconForType(props.data[dataRowIndex].extendedDataType ?? RenderDataAsTypes.Text)}
            iconPosition='start'
            />);
      });
    }

    return tabs;
  }

  return(
    <Box>
      <TabContext
        value={displayedTabId}
        // orientation='vertical'
        >
        <Box>
          <TabList onChange={handleTabChange}>
            {buildDataTabs()}
          </TabList>
        </Box>
        {/* <div>
          <Tooltip title='Copy To Clipboard'>
            <IconButton
              onClick={handleCopyClick}
              >
              <CopyIcon/>
            </IconButton>
          </Tooltip>
          { (props.processRowDelete !== undefined) &&
            <Tooltip title='Delete'>
              <IconButton
                onClick={handleDeleteClick}
                >
                <DeleteIcon/>
              </IconButton>
            </Tooltip>
          }
        </div> */}
        { (props.processRowToggle !== undefined) &&
          <FormControlLabel
            control={
              <Switch 
                disabled={props.busy}
                checked={props.data[dataRowIndex].enabled}
                onChange={handleToggle}
                />}
            label='Enabled'
            />
        }
        { ((props.tabButtonText !== undefined) && (props.tabButtonHandler !== undefined)) &&
          <div>
            <Button
              disabled={props.busy}
              onClick={handleTabButtonClick}
              >
              {props.tabButtonText!}
            </Button>
          </div>
        }
        {buildDataTabPanels()}
      </TabContext>
    </Box>
  );
}