import React, {useState, useEffect, useRef} from 'react';

import MainNavigation from '../components/MainNavigation';
import { StorageHelper } from '../util/StorageHelper';
import {
  Overlay,
  Classes,
  Switch,
  Card,
  Elevation,
  H5, H6,
  Divider,
  IToaster,
  IconName,
  IToasterProps,
  Position,
  Toaster,
  Intent,
} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';

import StandaloneParameters from '../components/StandaloneParameters';
import { LaunchScope } from '../models/LaunchScope';

import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

import { CopyHelper } from '../util/CopyHelper';
import DataCard from '../components/DataCard';
import { DataCardInfo } from '../models/DataCardInfo';
import { SingleRequestData, RenderDataAsTypes } from '../models/RequestData';
import { DataCardStatus } from '../models/DataCardStatus';
import { JwtHelper } from '../util/JwtHelper';
import ResourceComponent from '../components/ResourceComponent';
import { CommonProps } from '../models/CommonProps';
import { SmartConfiguration } from '../models/SmartConfiguration';

import * as jose from 'jose';

export interface MainPageProps {}

const _fhirServer:string = 'http://localhost:3000/ehr/api/fhir';
const _appId:string = 'client_app';

const _statusAvailable: DataCardStatus = {available: true, complete: false, busy: false};
// const _statusNotAvailable: DataCardStatus = {available: false, complete: false, busy: false};
// const _statusBusy: DataCardStatus = {available: true, complete: false, busy: true};
// const _statusComplete: DataCardStatus = {available: true, complete: true, busy: false};

let _client:Client|undefined = undefined;
let _authTimeoutCheck:any = undefined;

export default function MainPage() {
  const mainDiv = React.createRef<HTMLDivElement>();
  const toasterRef = useRef<IToaster | null>(null);

  const [uiDark, setUiDark] = useState<boolean>(false);
  const [settingsOverlayVisible, setSettingsOverlayVisible] = useState<boolean>(false);

  const [authTimeout, setAuthTimeout] = useState<number>(-1);

  const [clientId, setClientId] = useState<string>(_appId);
  const [aud, setAud] = useState<string>(_fhirServer);
  const [requestedScopes, setRequestedScopes] = useState<LaunchScope>(new LaunchScope());
  const [profile, setProfile] = useState<string>('');
  const [fhirUser, setFhirUser] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');

  const [instanceId, setInstanceId] = useState<string>()
  const [keyPair, setKeyPair] = useState<jose.GenerateKeyPairResult>();
  const [publicKeyId, setPublicKeyId] = useState<string>('');

  const smartConfigCardInfo:DataCardInfo = {
    id: 'smart-config-card',
    heading: 'SMART Configuration',
    description: '',
    optional: false,
  }
  const [smartConfigCardData, setSmartConfigCardData] = useState<SingleRequestData[]>([]);

  const controllerCardInfo:DataCardInfo = {
    id: 'controller-info-card',
    heading: 'Controller Info',
    description: '',
    optional: false,
  }
  const [controllerCardData, setControllerCardData] = useState<SingleRequestData[]>([]);

  const udapCardInfo:DataCardInfo = {
    id: 'udap-info-card',
    heading: 'UDAP Registration',
    description: '',
    optional: false,
  }
  const [udapCardData, setUdapCardData] = useState<SingleRequestData[]>([]);

  const authCardInfo:DataCardInfo = {
    id: 'auth-info-card',
    heading: 'Authorization Information',
    description: '',
    optional: false,
  }
  const [authCardData, setAuthCardData] = useState<SingleRequestData[]>([]);

  const [showUserCard, setShowUserCard] = useState<boolean>(false);
  const [userResourceType, setUserResourceType] = useState<string>('');

  const [resourcesToShow, setResourcesToShow] = useState<string[]>([]);

  useEffect(() => {
    if (localStorage.getItem('uiDark') === 'true') {
      setUiDark(true);
    } else if (sessionStorage.getItem('uiDark') === 'true') {
      setUiDark(true);
    }

    var url = new URL(window.location.href);

    getFromQueryOrStorage(url, 'aud', setAud, true);
    getFromQueryOrStorage(url, 'appId', setClientId, true);
    getFromQueryOrStorage(url, 'instanceId', setInstanceId, true);

    if (getFromQueryOrStorage(url, 'code')) {
      FHIR.oauth2.ready(onAuthReady, onAuthError);
    }
  }, []);

  function toggleUiTheme() {
    setUiDark(!uiDark);
  };
  useEffect(() => {
    if (!mainDiv) {
      return;
    }

    if (uiDark) {
      if (mainDiv.current!.className !== 'bp3-dark') {
        mainDiv.current!.className = 'bp3-dark';
      }
      if (document.body.className !== 'body-dark') {
        document.body.className = 'body-dark';
      }

      if (StorageHelper.isLocalStorageAvailable) {
        localStorage.setItem('uiDark', (uiDark).toString());
      } else {
        sessionStorage.setItem('uiDark', (uiDark).toString());
      }

      return;
    }

    if (mainDiv.current!.className === 'bp3-dark') {
      mainDiv.current!.className = '';
    }
    if (document.body.className === 'body-dark') {
      document.body.className = '';
    }

    if (StorageHelper.isLocalStorageAvailable) {
      localStorage.setItem('uiDark', (uiDark).toString());
    } else {
      sessionStorage.setItem('uiDark', (uiDark).toString());
    }

    return;
  }, [uiDark, mainDiv]);

  function toggleSettingsVisible() {
    setSettingsOverlayVisible(!settingsOverlayVisible);
  }

  function getFromQueryOrStorage(url:URL, key:string, setter?:((val:string) => void), save?:boolean) {
    if (url.searchParams.has(key)) {
      let val:string = url.searchParams.get(key) ?? '';

      if (save) {
        sessionStorage.setItem(key, val);
      }

      if (setter) {
        setter(val);
      }
      return(val);
    }

    let val = sessionStorage.getItem(key);
    if (val) {
      if (setter) {
        setter(val);
      }
      return(val);
    }

    return(undefined);
  }

  function showToastMessage(message:string, iconName?:IconName, timeout?:number, intent?:Intent) {
    let toaster:IToaster = getOrCreateToaster();
    toaster.show({message: message, icon: iconName, timeout: timeout, intent:intent});
  }

  function getOrCreateToaster():IToaster {
    if (!toasterRef.current) {
      var toasterProps: IToasterProps = {
        autoFocus: false,
        canEscapeKeyClear: true,
        position: Position.TOP,
      }

      toasterRef.current = Toaster.create(toasterProps, document.body);
    }

    return toasterRef.current;
  }

  function copyToClipboard(message: string, toast?: string) {
    const success = CopyHelper.copyToClipboard(message);

    if ((success) && (toast)) {
      showToastMessage(`${toast} Copied!`, IconNames.CLIPBOARD, 500);
    }

    if ((!success) && (toast)) {
      showToastMessage('Failed to copy!', IconNames.WARNING_SIGN, 1000);
    }
  }

  function checkAuthTimeout() {
    _authTimeoutCheck = setTimeout(checkAuthTimeout, 10000);

    let now:number = new Date().getTime();

    if (authTimeout < now) {
      return;
    }

    if ((now + 10000) > authTimeout) {
      showToastMessage(
        `Auth token will timeout in ${(authTimeout - now) / 1000} seconds`,
        IconNames.TIME,
        2000,
        Intent.WARNING);
    }
  }

  async function getControllerInfo() {
    let now:Date = new Date();
    let url:string = '/app/api/config';

    try {
      let headers:Headers = new Headers();
      headers.append('Accept', 'application/json');
      let response:Response = await fetch(url, { method: 'GET', headers: headers });
      let body:string = await response.text();
      let typed:any = await JSON.parse(body);

      let data:SingleRequestData = {
        id: `controller-${controllerCardData.length}`,
        name: `Controller Load #${controllerCardData.length}`,
        requestUrl: url,
        responseData: JSON.stringify(typed, null, 2),
        responseDataType: RenderDataAsTypes.JSON,
      }

      let updatedData:SingleRequestData[] = controllerCardData.slice();
      updatedData.push(data);
      setControllerCardData(updatedData);
    } catch (error) {

      let data:SingleRequestData = {
        id: `controller-${controllerCardData.length}`,
        name: `Controller Load #${controllerCardData.length}`,
        requestUrl: url,
        responseData: JSON.stringify(error, null, 2),
        responseDataType: RenderDataAsTypes.Error,
      }

      let updatedData:SingleRequestData[] = controllerCardData.slice();
      updatedData.push(data);
      setControllerCardData(updatedData);
    }
  }

  interface ControllerUdapRegistrationRequest {
    fhirUrl?: string|undefined,
    ehrRegistrationUrl?: string|undefined,
    instanceId?: string|undefined,
    keys?: string[]|jose.JWK[]|undefined,
  }
  
  async function registerUdapClient() {
    if (!aud) {
      showToastMessage('A FHIR Server is required to fetch register a UDAP client', IconNames.ERROR);
      return;
    }

    let url:string = '/app/api/registerWithEHR';

    try {
      // TODO: do not actually want these extractable, artifact of current build of client-js
      const keyResult = await jose.generateKeyPair('RS384', {extractable: true});
      setKeyPair(keyResult);
  
      let publicJWK = await jose.exportJWK(keyResult.publicKey,);
      let keyId = await jose.calculateJwkThumbprint(publicJWK, 'sha256');
      setPublicKeyId(keyId);
  
      let req: ControllerUdapRegistrationRequest = {
        fhirUrl: aud,
        keys: [ {...publicJWK, kid: keyId, alg: 'RS384'}],
      };

      let headers:Headers = new Headers();
      headers.append('Accept', 'application/json');
      headers.append('Content-Type', 'application/json');
      
      let response:Response = await fetch(url, { 
        method: 'POST', 
        headers: headers,
        body: JSON.stringify(req),
      });

      let body:string = await response.text();

      console.log('body', body);

      let typed:any = await JSON.parse(body);

      if (typed.client_id) {
        setClientId(typed.client_id);
      }

      let data:SingleRequestData = {
        id: `udap-${udapCardData.length}`,
        name: `UDAP Reg #${udapCardData.length}`,
        requestUrl: url,
        responseData: JSON.stringify(typed, null, 2),
        responseDataType: RenderDataAsTypes.JSON,
      }

      let updatedData:SingleRequestData[] = udapCardData.slice();
      updatedData.push(data);
      setUdapCardData(updatedData);
    } catch (error) {

      let data:SingleRequestData = {
        id: `udap-${udapCardData.length}`,
        name: `UDAP Reg #${udapCardData.length}`,
        requestUrl: url,
        responseData: JSON.stringify(error, null, 2),
        responseDataType: RenderDataAsTypes.Error,
      }

      let updatedData:SingleRequestData[] = udapCardData.slice();
      updatedData.push(data);
      setUdapCardData(updatedData);
    }
  }

  async function loadSmartConfig() {
    if (!aud) {
      showToastMessage('A FHIR Server is required to fetch SMART Configuration', IconNames.ERROR);
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
        `  | UDAP Registration | ${config.registration_endpoint} |\n` + 
        '\n';

      if (config.udap_versions_supported.length > 0) {
        info += '* UDAP\n\n';
        info +=
        '  | UDAP Config | Value |\n' +
        '  |-------|-------|\n' +
        `  | Versions Supported | ${config.udap_versions_supported.join(', ')} |\n` +
        `  | Certifications Required | ${config.udap_certifications_required.join(', ')} |\n` +
        '\n';
      }

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

  async function startAuth() {
    if (!aud) {
      showToastMessage('Standalone launch requires an Audience!', IconNames.ERROR);
      return;
    }

    let scopeString:string = requestedScopes.getScopes();

    let privateJWK:jose.JWK = await jose.exportJWK(keyPair?.privateKey!);

    FHIR.oauth2.authorize({
      client_id: clientId,
      scope: scopeString,
      iss: aud,
      redirect_uri: process.env.REACT_APP_REDIRECT_URL || undefined,
      pkceMode: 'ifSupported',
      clientPrivateJwk: {...privateJWK, 
        kid: publicKeyId,
        kty: 'RSA',
        alg: 'RS384',
      },
    });
  }

  function refreshAuth() {
    if (!_client) {
      showToastMessage('Refreshing requires an authorication token!', IconNames.ERROR, undefined, Intent.DANGER);
      return;
    }

    let request:string = _client?.state.tokenResponse?.refresh_token ?? '';

    _client.refresh()
      .then((refreshedState:fhirclient.ClientState) => {
        buildAuthCardDataSuccess(
            true,
            request,
            RenderDataAsTypes.Text,
            false,
            requestedScopes.getScopeGrants(_client!.state.scope ?? ''));
      })
      .catch((reason:any) => {
        buildAuthCardDataError(true, reason);
      });
  }

  function buildAuthCardDataError(isRenewal:boolean, error:any) {
    let now:Date = new Date();

    let id:string;
    let name:string;

    if (isRenewal) {
      id = `refresh_${authCardData.length}`;
      name = `Token Refresh #${authCardData.length} - ${now.toLocaleTimeString()}`;
    } else {
      id = 'initial_auth';
      name = `SMART Launch - ${now.toLocaleString()}`;
    }

    let url:string;
    if ((_client?.state) && (_client?.state.authorizeUri)) {
      url = _client?.state.authorizeUri;
    } else {
      url = _client?.state.serverUrl.replace(/fhir$/, 'auth/token') ?? aud;
    }

    let data:SingleRequestData = {
      id: id,
      name: name,
      requestUrl: url + '\n<<< ' + now.toLocaleString(),
      responseData: JSON.stringify(error, null, 2),
      responseDataType: RenderDataAsTypes.Error,
    }

    let scopes:LaunchScope = LaunchScope.load('requestedScopes');
    if (scopes.size > 0) {
      data.requestData = scopes.getScopes().split(' ').join('\n');
      data.requestDataType = RenderDataAsTypes.Markdown;
    }

    if (isRenewal) {
      let updatedData:SingleRequestData[] = authCardData.slice();
      updatedData.push(data);
      setAuthCardData(updatedData);

      showToastMessage('Token renewal failed!', IconNames.ERROR, undefined, Intent.DANGER);
    } else {
      setAuthCardData([data]);

      showToastMessage('Authorization failed!', IconNames.ERROR, undefined, Intent.DANGER);
    }
  }

  function buildAuthCardDataSuccess(
    isRenewal:boolean,
    request?:any,
    requestDataType?:RenderDataAsTypes,
    stringifyRequest?:boolean,
    scopeGrants?:LaunchScope)
    {
    let now:Date = new Date();
    let expires:number = _client?.state.tokenResponse?.expires_in ?? -1;

    if (expires < 0) {
      setAuthTimeout(-1);
    } else {
      setAuthTimeout(now.getTime() + expires);

      if (_authTimeoutCheck) {
        window.clearTimeout(_authTimeoutCheck);
        _authTimeoutCheck = undefined;
      }
      _authTimeoutCheck = setTimeout(checkAuthTimeout, 10000);
    }

    let id:string;
    let name:string;

    if (isRenewal) {
      id = `refresh_${authCardData.length}`;
      name = `Token Refresh #${authCardData.length} - ${now.toLocaleTimeString()}`;
    } else {
      id = 'initial_auth';
      name = `SMART Launch - ${now.toLocaleString()}`;
    }

    let extended:Map<string,string> = new Map([
      ['ID Token', JwtHelper.getDecodedTokenString(_client?.state.tokenResponse?.id_token)],
      ['Refresh Token', _client?.state.tokenResponse?.refresh_token ?? '']
    ]);

    let url:string = _client?.state.serverUrl.replace(/fhir$/, 'auth/token') ?? aud;

    let data:SingleRequestData = {
      id: id,
      name: name,
      requestUrl: url,
      responseData: JSON.stringify(_client!.state.tokenResponse, null, 2),
      responseDataType: RenderDataAsTypes.JSON,
      extended: extended,
      extendedDataType: RenderDataAsTypes.JSON,
    }

    if (scopeGrants) {
      let info:string =
        `* Processed at: \`${now.toLocaleString()}\`\n` +
        '\n' +
        '  | Scope | State |\n' +
        '  |-------|-------|\n';

      let lines:string[] = [];
      scopeGrants.forEach((granted:boolean, key:string) => {
        lines.push(`|${key.replace('|', '\\|')}|${granted ? 'Accepted' : 'Denied'}|`);
      });

      lines.sort();
      info += lines.join('\n');

      data.info = info;
      data.infoDataType = RenderDataAsTypes.Markdown;
    } else {
      data.info = `Processed at: \`${now.toLocaleString()}\``;
      data.infoDataType = RenderDataAsTypes.Text;
    }

    if (request) {
      data.requestData = stringifyRequest ? JSON.stringify(request, null, 2) : request;
      data.requestDataType = requestDataType ?? RenderDataAsTypes.Text;
    }

    let updatedData:SingleRequestData[] = authCardData.slice();
    updatedData.push(data);
    setAuthCardData(updatedData);

    if (isRenewal) {
      let updatedData:SingleRequestData[] = authCardData.slice();
      updatedData.push(data);
      setAuthCardData(updatedData);
    } else {
      setAuthCardData([data]);
    }
  }

  function onAuthReady(client:Client) {
    // log the client in the console for those who want to inspect it
    console.log('SMART Ready:', client);
    _client = client;

    let currentAud:string = sessionStorage.getItem('aud') ?? '';

    let scopes:LaunchScope = LaunchScope.load('requestedScopes');
    setRequestedScopes(scopes);

    // let comparison:ScopeComparison = scopes.compareToGranted(_client!.state.scope ?? '');
    let grants:LaunchScope = scopes.getScopeGrants(_client!.state.scope ?? '');

    let tokenParts:any[] = JwtHelper.decodeToken(_client!.state.tokenResponse?.id_token ?? '');
    if (tokenParts.length === 3) {
      if (tokenParts[1].profile) {
        setProfile(tokenParts[1].profile as string);
      } else {
        setProfile('');
      }
      
      if (tokenParts[1].fhirUser) {
        setFhirUser(tokenParts[1].fhirUser as string);
      } else {
        setFhirUser('');
      }
    }

    let pat:string = determinePatientId();
    setPatientId(pat);

    let showUser:boolean = false;

    let resources:string[] = [];
    scopes.forEach((requested:boolean, name:string) => {
      if (!name) {
        return;
      }

      if (!requested) {
        return;
      }

      switch (name) {
        case 'openid':
        case 'fhirUser':
        case 'offline_access':
        case 'online_access':
        case 'smart/orchestrate_launch':
        case 'profile':
          // ignore
        break;

        case 'launch/patient':
        case 'patient/*.read':
        case 'patient/*.write':
        case 'patient/*.*':
          if (resources.indexOf('Patient') === -1) {
            resources.push('Patient');
          }
        break;

        case 'launch/encounter':
          if (resources.indexOf('Encounter') === -1) {
            resources.push('Encounter');
          }
        break;

        case 'user/*.*':
          showUser = true;
          if (resources.indexOf('Patient') === -1) {
            resources.push('Patient');
          }
          if (resources.indexOf('Encounter') === -1) {
            resources.push('Encounter');
          }
          setUserResourceType(client.user.resourceType ?? '');
        break;

        default:
          let split:string[] = name.split('/');
          let components:string[] = split[1].split(/[.?]/);
          if (resources.indexOf(components[0]) === -1) {
            resources.push(components[0]);
          }
        break;
      }
    });

    setShowUserCard(showUser);
    setResourcesToShow(resources);

    let scopeString:string = scopes.buildScopeString('`', '`<br/>`', '`', true, false) ?? '`NONE`';

    //let scopesString:string = sessionStorage.getItem(`r_${currentAud}`) ?? '';

    // TODO(gino): remove during normal use - leaving for dev testing
    // if (scopes) {
    //   sessionStorage.removeItem(`r_${currentAud}`);
    // }

    let request:string =
      '| Name | Value |\n' +
      '|-------|-------|\n' +
      `|client id|${clientId}|\n` +
      `|scopes|${scopeString}|\n` +
      `|aud|${currentAud}|\n` +
      `|PKCE:Challenge|${client.state.codeChallenge}|\n` +
      `|PKCE:Verifier|${client.state.codeVerifier}|\n`;

    buildAuthCardDataSuccess(false, request, RenderDataAsTypes.Markdown, false, grants);
  }

  function onAuthError(error:Error) {
    buildAuthCardDataError(false, error);
  }

  function setAudAndSave(value:string) {
    sessionStorage.setItem('aud', value);
    setAud(value);
  }

  function setAppIdAndSave(value:string) {
    sessionStorage.setItem('appId', value);
    setClientId(value);
  }

  function setScopesAndSave(scopes:LaunchScope) {
    scopes.save('requestedScopes');
    setRequestedScopes(scopes);
  }

  function getFhirClient():Client|undefined {
    return _client;
  }

  function determinePatientId():string {
    if (!_client) {
      return '';
    }

    if (_client!.patient.id) {
      return _client!.patient.id;
    }

    if (profile) {
      if (profile.startsWith('Patient/')) {
        return profile.substr(8);
      }
    }

    if (fhirUser) {
      if (fhirUser.startsWith('Patient/')) {
        return fhirUser.substr(8);
      }
    }

    return '';
  }

  function buildContentCards():JSX.Element[] {
    let cards:JSX.Element[] = [];

    let common:CommonProps = {
      isUiDark: uiDark,
      aud: aud,
      setAud: setAudAndSave,
      appId: clientId,
      setAppId: setAppIdAndSave,
      profile: profile,
      fhirUser: fhirUser,
      patientId: patientId,
      requestedScopes: requestedScopes,
      setRequestedScopes: setScopesAndSave,
      startAuth: startAuth,
      refreshAuth: refreshAuth,
      getFhirClient: getFhirClient,
      toaster: showToastMessage,
      copyToClipboard: copyToClipboard,
    };

    if ((showUserCard) && (userResourceType)) {
      cards.push(
        <ResourceComponent
          key='data-user-card'
          title='User Information'
          id={_client?.user.id ?? undefined}
          resourceName={userResourceType}
          common={common}
          />
      );
    }

    resourcesToShow.forEach((resourceName:string) => {
      switch (resourceName) {
        case 'Patient':
          cards.push(
            <ResourceComponent
              key={'data-' + resourceName + '-card'}
              title={resourceName + ' Resource'}
              id={patientId ?? undefined}
              resourceName={resourceName}
              common={common}
              />
          );
          break;

        case 'Encounter':
          cards.push(
            <ResourceComponent
              key={'data-' + resourceName + '-card'}
              title={resourceName + ' Resource'}
              id={_client?.encounter.id ?? undefined}
              resourceName={resourceName}
              common={common}
              />
          );
          break;

        default:
          cards.push(
            <ResourceComponent
              key={'data-' + resourceName + '-card'}
              title={resourceName + ' Resource'}
              id={undefined}
              resourceName={resourceName}
              common={common}
              />
          );
          break;
      }
    });

    return cards;
  }

  const currentCommon:CommonProps = {
    isUiDark: uiDark,
    aud: aud,
    setAud: setAudAndSave,
    appId: clientId,
    setAppId: setAppIdAndSave,
    profile: profile,
    fhirUser: fhirUser,
    patientId: patientId,
    requestedScopes: requestedScopes,
    setRequestedScopes: setScopesAndSave,
    startAuth: startAuth,
    refreshAuth: refreshAuth,
    getFhirClient: getFhirClient,
    toaster: showToastMessage,
    copyToClipboard: copyToClipboard,
  }

  return (
    <div ref={mainDiv}>
      <MainNavigation
        toggleSettingsVisible={toggleSettingsVisible}
        />
      <Overlay
        isOpen={settingsOverlayVisible}
        onClose={toggleSettingsVisible}
        className={Classes.OVERLAY_SCROLL_CONTAINER}
        usePortal={false}
        autoFocus={true}
        hasBackdrop={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        >
        <Card
          className='centered'
          interactive={false}
          elevation={Elevation.TWO}
          >
          <H5>Settings</H5>
          <Divider />
          <H6>UI</H6>
          <Switch
            checked={uiDark}
            label='Use Dark Theme'
            onChange={() => toggleUiTheme()}
            />
        </Card>
      </Overlay>
      <StandaloneParameters
        common={currentCommon}
        loadSmartConfig={loadSmartConfig}
        registerUdapClient={registerUdapClient}
        getControllerInfo={getControllerInfo}
        />
      <DataCard
        info={smartConfigCardInfo}
        data={smartConfigCardData}
        status={_statusAvailable}
        common={currentCommon}
        />
      <DataCard
        info={controllerCardInfo}
        data={controllerCardData}
        status={_statusAvailable}
        common={currentCommon}
        />
      <DataCard
        info={udapCardInfo}
        data={udapCardData}
        status={_statusAvailable}
        common={currentCommon}
        />
      <DataCard
        info={authCardInfo}
        data={authCardData}
        status={_statusAvailable}
        common={currentCommon}
        />
      {buildContentCards()}
    </div>
  );
}
