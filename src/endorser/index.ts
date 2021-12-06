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

/**
 * - `POST /api/developer/:id/app/:id/endorsement`: returns a JWT endorsement for a registered app or an error if the app is not ready for endorsement
 */

interface AppEndorsementRequest {
  aud?: string | undefined;
}

interface AppEndorsementResponse {
  iss: string;
  sub: string;
  client_name: string;
  redirect_uris: string[];
  grant_types: GrantTypes[];
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
