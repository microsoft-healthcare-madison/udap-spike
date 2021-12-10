import React, { useEffect, useState } from 'react';

import { 
  Box, 
  Divider,
  Toolbar,
  Typography,
} from '@mui/material';

import { CommonComponentProps } from '../models/CommonComponentProps';
import { SmartConfiguration } from '../models/SmartConfiguration';
import { RenderDataAsTypes, SingleRequestData } from '../models/RequestData';
import { DataCardInfo } from '../models/DataCardInfo';
import DataCard from '../components/DataCard';
import { DataCardStatus } from '../models/DataCardStatus';

export interface SmartAuthPageProps {
  common: CommonComponentProps;
  isAuthenticated: boolean;
}

const _statusAvailable: DataCardStatus = {available: true, complete: false, busy: false};

export default function SmartAuthPage(props: SmartAuthPageProps) {

  const [aud, setAud] = useState<string>('http://localhost:3000/ehr/api/fhir');

  useEffect(() => {
    loadSmartConfig();
  }, [])

  const smartConfigCardInfo:DataCardInfo = {
    id: 'smart-config-card',
    heading: 'SMART Configuration',
    description: '',
    optional: false,
  }
  const [smartConfigCardData, setSmartConfigCardData] = useState<SingleRequestData[]>([]);


  async function loadSmartConfig() {
    if (!aud) {
      props.common.showMessage('A FHIR Server is required to fetch SMART Configuration', 'error');
      return;
    }

    let now:Date = new Date();
    let url:string;

    if (aud.endsWith('/')) {
      url = `${aud}.well-known/smart-configuration`;
    } else {
      url = `${aud}/.well-known/smart-configuration`;
    }

    try {
      let headers:Headers = new Headers();
      headers.append('Accept', 'application/json');
      let response:Response = await fetch(url, { method: 'GET', headers: headers });
      let body:string = await response.text();
      let config:SmartConfiguration = JSON.parse(body);

      let lines:string[] = [];

      let data:SingleRequestData = {
        id: `smart-${smartConfigCardData.length}`,
        name: `SMART Config Load #${smartConfigCardData.length}`,
        requestUrl: url,
        responseData: JSON.stringify(config, null, 2),
        responseDataType: RenderDataAsTypes.JSON,
      }

      let info:string =
        `* Processed at: \`${now.toLocaleString()}\`\n\n`;

      info +=
        '  | Endpoint | URL |\n' +
        '  |-------|-------|\n' +
        `  | Authorization | ${config.authorization_endpoint} |\n` +
        `  | Introspection | ${config.introspection_endpoint} |\n` +
        `  | Management | ${config.management_endpoint} |\n` +
        `  | Revocation | ${config.revocation_endpoint} |\n` +
        `  | Token | ${config.token_endpoint} |\n` + 
        '\n';

      lines = [];
      if (config.code_challenge_methods_supported.length > 0) {
        config.code_challenge_methods_supported.forEach((value:string) => {
          lines.push(`  * \`${value}\``);
        });
        lines.sort();
        info += '* Code Challenge Methods Supported\n';
        info += lines.join('\n');
        info += '\n\n\n';
      }

      lines = [];
      if (config.capabilities.length > 0) {
        config.capabilities.forEach((value:string) => {
          lines.push(`  * \`${value}\``);
        });
        lines.sort();
        info += '* Capabilities\n';
        info += lines.join('\n');
        info += '\n\n\n';
      }

      lines = [];
      if (config.scopes_supported.length > 0) {
        config.scopes_supported.forEach((value:string) => {
          lines.push(`  * \`${value}\``);
        });
        lines.sort();
        info += '* Scopes Supported\n';
        info += lines.join('\n');
        info += '\n\n\n';
      }

      lines = [];
      if (config.response_types_supported.length > 0) {
        config.response_types_supported.forEach((value:string) => {
          lines.push(`  * \`${value}\``);
        });
        lines.sort();
        info += '* Response Types Supported\n';
        info += lines.join('\n');
        info += '\n\n\n';
      }

      data.info = info;
      data.infoDataType = RenderDataAsTypes.Markdown;

      let updatedData:SingleRequestData[] = smartConfigCardData.slice();
      updatedData.push(data);
      setSmartConfigCardData(updatedData);

    } catch (error) {

      let data:SingleRequestData = {
        id: `smart-${smartConfigCardData.length}`,
        name: `SMART Config Load #${smartConfigCardData.length}`,
        requestUrl: url,
        responseData: JSON.stringify(error, null, 2),
        responseDataType: RenderDataAsTypes.Error,
      }

      let updatedData:SingleRequestData[] = smartConfigCardData.slice();
      updatedData.push(data);
      setSmartConfigCardData(updatedData);
    }
  }

  return(
    <Box sx={{ display: 'flex' }}>
      <Box component='main' sx={{ flexGrow: 1, px: 2 }}>
        <Toolbar/>
        <Typography>SMART Discovery Page</Typography>
        <Divider sx={{marginBottom: '1em'}} />
        <DataCard
          info={smartConfigCardInfo}
          data={smartConfigCardData}
          status={_statusAvailable}
          common={props.common}
          />
      </Box>
    </Box>
  );
}