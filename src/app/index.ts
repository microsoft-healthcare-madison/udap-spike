import express, { application, response } from "express";
import path from "path";
import * as jose from "jose";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';

import config from "./config";

import { ApiHelper, ApiResponse } from "../ApiHelper";

const router = express.Router();
export default router;

const staticPath = path.join(__dirname, "static");
router.use("/static", express.static(staticPath));

const wellKnownPath = path.join(__dirname, ".well-known");
router.use('/.well-known', express.static(wellKnownPath));

/**
 * App backend API
 * - `GET /api/config`: return configuration information
 * - `GET /api/developer`: return developer info
 * - `GET /api/endorsement`: return app endorsement info
 * - `POST /api/registerWithEHR`: register with an EHR
 * Functions:
 * - initialize
 */

let developerId:string;
let developerStatement:any;
let appId:string;
let appEndorsement:any;

const developerData = {
  'organizationName': config.orgName,
  'developerName': config.devName,
};

const controllerAppData = {
  'sub': config.appUrl,
  'client_name': config.clientName,
  'redirect_uris': [
    `${config.appUrl}/oauth-redirect`,
    'http://localhost:3002/',
  ]
}

let appJWKS:any;
let appControllerKey:any;

async function initialize() {
  console.log('Initializing app api...');

  appJWKS = JSON.parse(
    fs
      .readFileSync(
        path.join(__dirname, '..', '..', 'fixtures', 'app.jwks.private.json')
      )
      .toString()
  );

  appControllerKey = await jose.importJWK(appJWKS.keys[0], "RS256");

  if (!config.defaultDeveloperId) {
    await createDeveloperAtEndorser();    
  } else {
    try {
      const devResp = await ApiHelper.apiGet<any>(`${config.endorserApiUrl}/developer/${config.defaultDeveloperId}`);
      developerStatement = devResp.value;
      developerId = devResp.value.id;
    } catch (err) {
      console.log(err);
      createDeveloperAtEndorser();
    }
  }

  if (!config.defaultAppId) {
    await createAppAtEndorser();
  } else {
    appId = config.defaultAppId;
  }

  try {
    const appResp = await ApiHelper.apiGet<any>(
      `${config.endorserApiUrl}/developer/${developerId}/app/${appId}/endorsement`);
    appEndorsement = appResp.value.endorsement;
  } catch (err) {
    console.log(err);
  }

  console.log('app api Initialized!');
  console.log(' <<< developerId:', developerId);
  console.log(' <<<       appId:', appId);
}

async function createAppAtEndorser() {
  const apiResp = await ApiHelper.apiPost<any>(
    `${config.endorserApiUrl}/developer/${developerId}/app`, controllerAppData);
  appId = apiResp.value.id;
}

async function createDeveloperAtEndorser() {  
  const apiResp = await ApiHelper.apiPost<any>(`${config.endorserApiUrl}/developer`, developerData);
  developerStatement = apiResp.value;
  developerId = apiResp.value.id;
}

initialize();


/**
 * - `POST /api/registerWithEHR`: register with an EHR
 */
 interface ControllerUdapRegistrationRequest {
  fhirUrl?: string|undefined,
  ehrRegistrationUrl?: string|undefined,
  instanceId?: string|undefined,
  keys?: string[]|jose.JWK[]|undefined,
}

interface SmartConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  introspection_endpoint: string;
  management_endpoint: string;
  revocation_endpoint: string;
  code_challenge_methods_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  scopes_supported: string[];
  response_types_supported: string[];
  capabilities: string[];

  udap_versions_supported: string[];
  udap_certifications_required: string[];
  grant_types_supported: string[];
  registration_endpoint: string;
}

router.post('/api/registerWithEHR', async(req, res) => {
  let registerInfo = (req.body || {}) as ControllerUdapRegistrationRequest;

  console.log('Registration Request', registerInfo);

  let statement: any;

  if ((!registerInfo.ehrRegistrationUrl) && (!registerInfo.fhirUrl)) {
    console.log('FHIR or EHR Registration URL is required');
    res.status(500).send('FHIR or EHR Registration URL is required');
    return;
  }

  if (!registerInfo.instanceId) {
    registerInfo.instanceId = uuidv4();
  }

  if (!registerInfo.ehrRegistrationUrl) {
    let url: string;
    if (registerInfo.fhirUrl?.endsWith('/')) {
      url = registerInfo.fhirUrl + '.well-known/smart-configuration';
    } else {
      url = registerInfo.fhirUrl + '/.well-known/smart-configuration';
    }

    const smartResp = await ApiHelper.apiGet<SmartConfiguration>(url);

    if (!smartResp.value?.registration_endpoint) {
      console.log('FHIR Server SMART config did not contain a UDAP registration endpoint URL')
      res.status(500).send('FHIR Server SMART config did not contain a UDAP registration endpoint URL');
      return;
    }

    registerInfo.ehrRegistrationUrl = smartResp.value.registration_endpoint;
  }

  if ((registerInfo.instanceId) && (registerInfo.keys)) {
    statement = await new jose.SignJWT({
      ...controllerAppData,
      iss: controllerAppData.sub,
      sub: `${controllerAppData.sub}#${registerInfo.instanceId}`,
      jwks: {keys:registerInfo.keys},
    }).setProtectedHeader({alg: "RS256"}).sign(appControllerKey);
  } else {
    statement = await new jose.SignJWT({
      ...controllerAppData,
      iss: controllerAppData.sub,
      sub: `${controllerAppData.sub}`,
      jwks: {keys:[appControllerKey]},
    }).setProtectedHeader({alg: "RS256"}).sign(appControllerKey);
  }

  console.log(' <<< registration url', registerInfo.ehrRegistrationUrl);
  console.log(' <<< statement', statement);

  console.log(' <<< appEndorsement.endorsement', appEndorsement);

  const ehrResp = await ApiHelper.apiPost<any>(
    `${registerInfo.ehrRegistrationUrl}`,
    {
      software_statement: statement,
      certifications: [appEndorsement],
      udap: '1',
    });

  res.status(ehrResp.statusCode || 500).send(ehrResp.body || 'request failed');
});

/**
 * - `GET /api/config`: return configuration information
 */
interface ConfigResponse {
  endorserApiUrl: string;
  developerId: string;
  appId: string;
}

router.get('/api/config', async(req, res) => {
  let current:ConfigResponse = {
    endorserApiUrl: config.endorserApiUrl,
    developerId: developerId,
    appId: appId,
  };

  res.json(current);
});

/**
 * - `GET /api/developer`: return developer info
 */
router.get('/api/developer', async(req, res) => {
  if (developerStatement) {
    res.json(developerStatement);
    return;
  }

  const apiResp = await ApiHelper.apiGet(`${config.endorserApiUrl}/developer/${config.defaultDeveloperId}`);
  res.json(apiResp.value);
});

/**
 * - `GET /api/endorsement`: return app endorsements
 */
 router.get('/api/endorsement', async(req, res) => {
  if (appEndorsement) {
    res.json(appEndorsement);
    return;
  }

  const apiResp = await ApiHelper.apiGet(
    `${config.endorserApiUrl}/developer/${developerId}/app/${appId}/endorsement`);
  res.json(apiResp.value);
});

