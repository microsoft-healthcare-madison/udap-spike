import express, { application, response } from "express";
import fhir4 from "fhir/r4";
import path from "path";
import * as jose from "jose";
import fs from "fs";

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

const appData = {
  'sub': config.appUrl,
  'client_name': config.clientName,
  'redirect_uris': [
    `${config.appUrl}/oauth-redirect`,
    'http://localhost:3002/',
  ]
}

async function initialize() {
  console.log('Initializing app api...');

  if (!config.defaultDeveloperId) {
    createDeveloperAtEndorser();
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
    createAppAtEndorser();
  } else {
    try {
      const appResp = await ApiHelper.apiGet<any>(
        `${config.endorserApiUrl}/developer/${developerId}/app/${config.defaultAppId}/endorsement`);
      appEndorsement = appResp.value;
    } catch (err) {
      console.log(err);
      createAppAtEndorser();
    }
  }

  console.log('app api Initialized!');
}

async function createAppAtEndorser() {
  const apiResp = await ApiHelper.apiPost<any>(
    `${config.endorserApiUrl}/developer/${developerId}/app`, appData);
  appEndorsement = apiResp.value;
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
interface RegisterRequest {
  ehrRegistrationUrl: string,
}

router.post('/api/registerWithEHR', async(req, res) => {
  let registerInfo = (req.body || {}) as RegisterRequest;

  const appJWKS = JSON.parse(
    fs
      .readFileSync(
        path.join(__dirname, '..', '..', 'fixtures', 'app.jwks.private.json')
      )
      .toString()
  );

  const appKey = await jose.importJWK(appJWKS.keys[0], "RS256");

  const statement = await new jose.SignJWT({
    ...appData,
  }).setProtectedHeader({alg: "RS256"}).sign(appKey);

  const ehrResp = await ApiHelper.apiPost<any>(
    `${registerInfo.ehrRegistrationUrl}`,
    {
      software_statement: statement,
      certifications: [appEndorsement.endorsement],
      udap: '1',
    });

  res.status(ehrResp.statusCode || 500).send(ehrResp.body);
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
    developerId: config.defaultDeveloperId,
    appId: config.defaultAppId,
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
    `${config.endorserApiUrl}/developer/${config.defaultDeveloperId}/app/${config.defaultAppId}/endorsement`);
  res.json(apiResp.value);
});

