import express from "express";
import path from "path";

import fetch from "cross-fetch";
import r4 from "fhir/r4";

import {ApiHelper} from "./ApiHelper";

const ENDORSER_FHIR_BASE =
  process.env.ENDORSER_FHIR_BASE || "https://hapi.fhir.org/baseR4";

const router = express.Router();
export default router;

/**
 * implements https://www.udap.org/udap-certifications-and-endorsements.html
 * Routes:
 * - `/static`: website for generating endorsements
 */

const staticPath = path.join(__dirname, "static");
router.use("/static", express.static(staticPath));

/** - `POST /api/developer`: register a new developer with the endorsement service
 *      - save data in Organization
 *      - `developer_name`
 *      - `developer_address`
 */
interface DeveloperPostBody {
  organizationName: string;
  developerName: string;
}

router.post("/api/developer", async (req, res) => {
  let dev = JSON.parse(req.body || "{}") as DeveloperPostBody;

  if (!dev.organizationName) {
    dev.organizationName = "fake org name";
    dev.developerName = "fake dev name";
  }

  let org: r4.Organization = {
    resourceType: "Organization",
    meta: {
      tag: [{ system: "https://udap-spike.example.org" }],
    },
    extension: [{
        "url": "https://upda-spike.example.org/verification-status",
        "valueCode": "unverified"
    }],
    name: dev.organizationName,
    contact: [
      {
        name: {
          text: dev.developerName,
        },
      },
    ],
  };

  const posted = await ApiHelper.apiPostFhir(`${ENDORSER_FHIR_BASE}/Organization`, org);
  console.log("Created org", posted);
  res.json(posted.body)
});

/**
 * - `GET /api/developer/:id`: return FHIR organization resource or JSON blob??
 */

/** - `POST /api/developer/:id/app`: register a new app with the endorsement service (includes a reference to one or more developers)
 *      - save data in Device
 *      - attach JSON blob of all dynamic registration properties
 *        - Fixed values per registration
 *          - `iss`: Client App Operator’s unique identifying URI (identifying the holder of private key,
 *                   also serves as the base URI for UDAP metadata including lookup of certificates)
 *          - `sub`: same as iss
 *          //  omit `aud` this so the endorsement is general purpose
 *          - `client_name`: string
 *          - `redirect_uris`: array of URIs (required if grant_types includes authorization_code)
 *          - `grant_types`: array of strings, e.g. authorization_code, refresh_token, client_credentials
 *          - `response_types`: array of strings, e.g. code (omit for client_credentials)
 *                  Can hard-code `response_types` to `["code"]` for this demo
 *          - `token_endpoint_auth_method`: string, fixed value: private_key_jwt
 *                  Can hard-code
 *        - Dynamic values per registration
 *          - `exp`: number, expiration time (should be short-lived, max 5 minutes from iat)
 *          - `iat`: number, issued at time
 *          - `jti`: string, unique token identifier used to identify token replay
 *          - `scope`: string, space delimited list of requested scopes (optional)
 *          - public keys for client authn
 *      - Parameters
 *          - Developer (by reference, conveyed by path param)
 *          - iss/sub
 *          - client_name
 *          - redirect_uris
 *          - grant_types (limited to `authorization_code` and `refresh_token`)
 */

type GrantTypes = "authorization_code" | "refresh_token";
type ResponseTypes = "code";
type TokenEndpointAuthMethod = "private_key_jwt";

interface AppRegistrationRequest {
  iss: string | undefined;
  sub: string | undefined;
  client_name: string;
  redirect_uris: string[];
  grant_types: GrantTypes[];
}

interface AppRegistrationResponse {
  status: string;
  id: string;
}


router.post("/api/developer/:developerId/app", async (req, res) => {
    let app = JSON.parse(req.body || "{}") as AppRegistrationRequest;

    let devId = req.params.developerId;

    let devOrgResponse:ApiResponse<r4.Organization> = await 
        ApiHelper.apiGetFhir<r4.Organization>(`${ENDORSER_FHIR_BASE}/Organization/${devId}`);
    
    // if ((!response.value) || (!response.value.entry) || (!response.value.entry)) {
        
    // }
    
  
    // if (!dev.organizationName) {
    //   dev.organizationName = "fake org name";
    //   dev.developerName = "fake dev name";
    // }
  
    // let org: r4.Organization = {
    //   resourceType: "Organization",
    //   meta: {
    //     tag: [{ system: "https://udap-spike.example.org" }],
    //   },
    //   extension: [{
    //       "url": "https://upda-spike.example.org/verification-status",
    //       "valueCode": "unverified"
    //   }],
    //   name: dev.organizationName,
    //   contact: [
    //     {
    //       name: {
    //         text: dev.developerName,
    //       },
    //     },
    //   ],
    // };
  
    // const posted = await ApiHelper.apiPostFhir(`${ENDORSER_FHIR_BASE}/Organization`, org);
    // console.log("Created org", posted);
    // res.json(posted.body)
  });
  

/**
 * - `POST /api/developer/:id/app/:id/endorsement`: returns a JWT endorsement for a registered app or an error if the app is not ready for endorsement
 */

interface AppEndorsementRequest {
  aud?: string | undefined;
}

/**
 * Software Statement JWT Claims
 * Notes:
 * The unique client URI used for the iss claim SHALL match the uriName entry in the 
 * Subject Alternative Name extension of the client app operator’s X.509 certificate, and 
 * SHALL uniquely identify a single client app operator and application over time. The 
 * software statement is intended for one-time use with a single OAuth 2.0 server. As such, 
 * the aud claim SHALL list the URL of the OAuth Server’s registration endpoint, and the 
 * lifetime of the software statement (exp minus iat) SHALL be 5 minutes.
 */
interface AppEndorsementJwtPayload {
    /** 
     * Issuer of the JWT -- unique identifying client URI. This SHALL match the value of a 
     * uniformResourceIdentifier entry in the Subject Alternative Name extension of the 
     * client's certificate included in the x5c JWT header
     */
    iss: string;

    /** 
     * Same as iss. In typical use, the client application will not yet have a client_id 
     * from the Authorization Server
     */
    sub: string;

    /**
     * The Authorization Server's "registration URL" (the same URL to which the registration 
     * request  will be posted) 
     */
    aud?: string|undefined;

    /** 
     * Expiration time integer for this software statement, expressed in seconds since the 
     * "Epoch" (1970-01-01T00:00:00Z UTC). The exp time SHALL be no more than 5 minutes 
     * after the value of the iat claim.
     */
    exp: number;

    /** Issued time integer for this software statement, expressed in seconds since the "Epoch" */
    iat: number;

    /**
     * A nonce string value that uniquely identifies this software statement. This value SHALL NOT 
     * be reused by the client app in another software statement or authentication JWT before 
     * the time specified in the exp claim has passed
     */
    jti: string;

    /** A string containing the human readable name of the client application */
    client_name: string;

    /** 
     * An array of one or more redirection URIs used by the client application. This claim 
     * SHALL be present if grant_types includes "authorization_code" and this claim SHALL 
     * be absent otherwise. Each URI SHALL use the https scheme.
     */
    redirect_uris?: string[]|undefined;

    /**
     * An array of URI strings indicating how the data holder can contact the app operator 
     * regarding the application. The array SHALL contain at least one valid email address 
     * using the mailto scheme, e.g. ["mailto:operations@example.com"] 
     */
    contacts: string[];

    /**
     * A URL string referencing an image associated with the client application, i.e. a logo. 
     * If grant_types includes "authorization_code", client applications SHALL include this 
     * field, and the authorization server MAY display this logo to the user during the 
     * authorization process. The URL SHALL use the https scheme and reference a PNG, JPG, 
     * or GIF image file, e.g. "https://myapp.example.com/MyApp.png" 
     */
    logo_uri: string;

    /** 
     * Array of strings, each representing a requested grant type, from the following list: 
     * "authorization_code", "refresh_token", "client_credentials". The array SHALL include 
     * either "authorization_code" or "client_credentials", but not both. The value 
     * "refresh_token" SHALL NOT be present in the array unless "authorization_code" 
     * is also present. 
     */
    grant_types: GrantTypes[];

    /**
     * Array of strings. If grant_types contains "authorization_code", then this element 
     * SHALL have a fixed value of ["code"], and SHALL be omitted otherwise 
     */
    response_types: ResponseTypes[];

    /** Fixed string value: "private_key_jwt" */
    token_endpoint_auth_method: TokenEndpointAuthMethod[];

    /**
     * String containing a space delimited list of scopes requested by the client application 
     * for use in subsequent requests. The Authorization Server MAY consider this list when 
     * deciding the scopes that it will allow the application to subsequently request. Client 
     * apps requesting the "client_credentials" grant type SHOULD request system scopes; apps 
     * requesting the "authorization_code" grant type SHOULD request user or patient scopes. 
     */
    scope: string;
    }

/**
 * - `POST /api/developer/:id/app/:id/endorsement/status`: Returns some specific error if the endorsement has been revoked or if it has expired
 */

/**
 * Misc
 */

router.get("/api/status.json", (req, res) => {
  res.json({ endorser: true });
});
