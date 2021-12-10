import React, {useState, useRef, useEffect} from 'react';
import { CommonProps } from '../models/CommonProps';
import { 
  Button,
  Card, 
  Elevation,
  H5, H6,
  Tabs, 
  TabId,
  Tab,
  Tooltip,
  FormGroup,
  InputGroup,
  Divider,
  Checkbox,
} from '@blueprintjs/core';
import ParametersTabV1 from './ParametersTabV1';

export interface StandaloneParametersProps {
  common:CommonProps;
  getControllerInfo: (() => void);
  registerUdapClient: (() => void);
  loadSmartConfig: (() => void);
}


export default function StandaloneParameters(props: StandaloneParametersProps) {
  const initialLoadRef = useRef<boolean>(true);

  const [selectedTabId, setSelectedTabId] = useState<string>('');

  useEffect(() => {
    if (initialLoadRef.current) {
      setSelectedTabId(sessionStorage.getItem('standalone-selected-tab-id') ?? 'parameter-tab-v1');

      initialLoadRef.current = false;
    }
  }, []);

  function handleTabChange(tabId: TabId) {
    setSelectedTabId(tabId.toString());
    sessionStorage.setItem('standalone-selected-tab-id', tabId.toString());
  }

  function handleInputAudChange(event: React.ChangeEvent<HTMLInputElement>) {
    props.common.setAud(event.target.value);
  }

  function handleInputAppIdChange(event: React.ChangeEvent<HTMLInputElement>) {
    props.common.setAppId(event.target.value);
  }


  function handleLaunchClick() {
    if (!props.common.requestedScopes) {
      props.common.toaster('No Scopes Available!');
      return;
    }

    props.common.startAuth();
  }

  return(
    <Card
      interactive={false}
      elevation={Elevation.ONE}
      >
      <H5>Standalone Launch</H5>
      <FormGroup
        label='FHIR Server'
        helperText='Base URL for FHIR Server to connect to'
        labelFor='input-aud'
        >
        <InputGroup
          id='input-aud'
          value={props.common.aud}
          onChange={handleInputAudChange}
          />
      </FormGroup>
      <FormGroup
        label='Client ID'
        helperText='OAuth client ID'
        labelFor='input-appId'
        >
        <InputGroup
          id='input-appId'
          value={props.common.appId}
          onChange={handleInputAppIdChange}
          />
      </FormGroup>
      <Divider />
      <Tabs
        id='standalone-parameter-tabs'
        animate={true}
        vertical={false}
        selectedTabId={selectedTabId}
        onChange={handleTabChange}
        
        >
        <H6>Scopes:</H6>
        <Tab
          id='parameter-tab-v1'
          title='SMART V1'
          panel={
            <ParametersTabV1
              common={props.common}
              />
          }
          />
      </Tabs>
      <Divider />
      <Button
        key='run-request'
        id='run-request'
        text='Launch Auth Redirect'
        onClick={handleLaunchClick}
        />
      <Tooltip
        content='Refresh the existing token (does NOT change scopes)'
        >
        <Button
          key='refresh-request'
          id='refresh-request'
          text='Refresh Token'
          disabled={false}
          onClick={() => props.common.refreshAuth()}
          />
      </Tooltip>
      <Tooltip
        content='Fetch the current .well-known/smart-configuration data'
        >
        <Button
          key='load-smart-config'
          id='load-smart-config'
          text='Get SMART Config'
          disabled={false}
          onClick={() => props.loadSmartConfig()}
          />
      </Tooltip>

      <Tooltip
        content='Get Controller Info'
        >
        <Button
          key='get-controller-info'
          id='get-controller-info'
          text='Get Controller Info'
          disabled={false}
          onClick={() => props.getControllerInfo()}
          />
      </Tooltip>

      <Tooltip
        content='Register a UDAP client'
        >
        <Button
          key='register-udap-client'
          id='register-udap-client'
          text='Register UDAP Client'
          disabled={false}
          onClick={() => props.registerUdapClient()}
          />
      </Tooltip>

    </Card>
  );
}
