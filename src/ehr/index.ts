import express from "express";
import fhir4, { Device } from "fhir/r4";
import * as jose from "jose";
import { KeyLike } from "jose";
import path from "path";
import config from "./config";
import crypto, { randomUUID } from "crypto";
import { ApiHelper } from "../ApiHelper";
import { parse } from "path/posix";
import { genericTypeAnnotation } from "@babel/types";

const router = express.Router();
export default router;

interface RegisteredAppMetadata {
  redirect_uris: string[];
  client_name: string;
  client_id: string;
  grant_types: ("authorization_code" | "refresh_token")[];
  response_types: "code";
  token_endpoint_auth_methods: "private_key_jwt";
  jwks?: {keys: any[]}
}

interface UDAP_Certification_JWT_Payload extends RegisteredAppMetadata {
  iss: string;
  sub: string;
  certification_issuer: string;
  certification_name: string;
  certification_logo: string;
  certification_uris: string[];
  certification_status_endpoint: string;
  is_endorsement: boolean;
  developer_name: string;
}

interface RegistrationRequestBody {
  certifications: string[];
  software_statement: string;
  udap: "1" | "INVALID";
}

const getJwksForSubject = (s: string) =>
  jose.createRemoteJWKSet(new URL(`${s}/.well-known/jwks.json`));

router.post("/api/oauth/register", async (req, res, err) => {
  console.log("Reg requset");
  let body = req.body as RegistrationRequestBody;
  if (body.udap !== "1") {
    return err("Only udap flavor dynreg supported");
  }

  // For now, hard-coded a trusted issuance cert to represent the trust framework
  // Later (maybe?) check whether certificate chains up to a trusted root
  // https://stackoverflow.com/questions/48377731/using-node-js-to-verify-a-x509-certificate-with-ca-cert
  // let endorsementHeaders = jose.decodeProtectedHeader(endorsement);
  // let der = Buffer.from(endorsementHeaders.x5c![0], "base64");
  // let cert = new crypto.X509Certificate(der);

  const endorsementJWT = body.certifications[0];

  const trustedEndorserJWKS = getJwksForSubject(config.trustedEndorser);
  const verifiedEndorsement = await jose.jwtVerify(
    endorsementJWT,
    trustedEndorserJWKS
  );
  const endorsement =
    verifiedEndorsement.payload as unknown as UDAP_Certification_JWT_Payload;
  console.log("Endorsement verified? ", endorsement);

  const trustedAppJWKS = getJwksForSubject(endorsement.sub);
  const verifiedSoftwareStatement = await jose.jwtVerify(
    body.software_statement,
    trustedAppJWKS
  );
  const softwareStatement =
    verifiedSoftwareStatement.payload as unknown as UDAP_Certification_JWT_Payload;
  console.log("SW Statement", softwareStatement);

  if (softwareStatement.iss !== endorsement.sub) {
    return err(
      "Issuer of software statement does not match subject of endorsement"
    );
  }

  if (softwareStatement.client_name !== endorsement.client_name) {
    return err(
      "Client name from software statement does not match endorsement"
    );
  }

  if (
    !softwareStatement.redirect_uris.every((u) =>
      endorsement.redirect_uris.includes(u)
    )
  ) {
    return err(
      "Redirect URIs from software statement do not match endorsement"
    );
  }

  // TODO verify all properties

  const registered: RegisteredAppMetadata = {
    ...endorsement,
    sub: undefined,
    iss: undefined,
    redirect_uris: softwareStatement.redirect_uris,
    jwks: softwareStatement.jwks || undefined,
    client_id: randomUUID(),
  } as RegisteredAppMetadata;

  let device: fhir4.Device = {
    resourceType: "Device",
    meta: {
      tag: [{ system: "https://udap-spike.example.org" }],
    },
    identifier: [
      {
        system: `https://udap-spike.example.org#client_id`,
        value: registered.client_id,
      },
      {
        system: `https://udap-spike.example.org#sub`,
        value: softwareStatement.sub,
      },
    ],
    extension: [
      {
        url: "https://upda-spike.example.org/dynreg",
        valueString: JSON.stringify(registered),
      },
    ],
  };

  const posted = await ApiHelper.apiPostFhir(
    `${config.ehrFhirBase}/Device`,
    device
  );

  if (posted.statusCode !== 201) {
    return err("Failed to save registration");
  }

  res.status(201);
  res.json(registered);

  return;
});

interface AuthzSession {
  request: {
    response_type: "code";
    client_id: string;
    redirect_uri: string;
    scope: string;
    state: string;
    aud: string;
  };
  registration?: UDAP_Certification_JWT_Payload;
}

const authzSessions: Record<string, AuthzSession> = {
  "123": {
    request: {
      redirect_uri: "https://udap.org",
      scope: "patient/*.read",
    },
    registration: { client_name: "Test Client for Demo Session" },
  } as AuthzSession,
};

router.get("/api/oauth/authorize", async (req, res, err) => {
  const sessionId = randomUUID();

  const clientDetails = await getExtensionFromIdentified<UDAP_Certification_JWT_Payload>("Device", `client_id|${req.query.client_id}`, "dynreg");
  console.log("CDS", clientDetails);

  if (clientDetails.redirect_uris.includes(req.body.redirect_uri)) {
    return err("Redirect URL does not match registered values");
  }

  console.log("REqu qyer", JSON.stringify(req.query ))

  const session = {
    request: req.query as AuthzSession["request"],
    registration: clientDetails,
  };

  console.log("Assign session", sessionId, session)
  authzSessions[sessionId] = session;
  res.redirect(`${config.authorizeUi}?task=authorize&session=${sessionId}`);
});


// In real life, this would be protected :-)
router.get("/api/authorization/:sessionId", async (req, res, err) => {
  const session = authzSessions[req.params.sessionId];
  res.json(session);
});

router.post(
  "/api/authorization/:sessionId/:decision",
  async (req, res, err) => {
    const session = authzSessions[req.params.sessionId];
    if (req.params.decision === "approve") {
      const authorizationCode = randomUUID();
      console.log("Approve", req.params.sessionId, session)

      let consent: fhir4.Consent = {
        resourceType: "Consent",
        status: "draft",
        scope: {},
        category: [],
        meta: {
          tag: [{ system: "https://udap-spike.example.org" }],
        },
        identifier: [
          {
            system: `https://udap-spike.example.org#authorization_code`,
            value: authorizationCode,
          },
        ],
        extension: [
          {
            url: "https://upda-spike.example.org/grant",
            valueString: JSON.stringify(session),
          },
        ],
      };

      const posted = await ApiHelper.apiPostFhir(
        `${config.ehrFhirBase}/Consent`,
        consent
      );

      if (posted.statusCode !== 201) {
        return err("Failed to save grant");
      }

      const targetUrl = new URL(session.request.redirect_uri);
      targetUrl.searchParams.append("code", authorizationCode);
      targetUrl.searchParams.append("state", session.request.state);
      res.redirect(targetUrl.toString());
    }
  }
);

interface TokenRequestBody {
  grant_type: string;
  code: string;
  redirect_uri: string;
  code_verifier: string;
  client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
  client_assertion: string;
}

async function getIdentifiedResource<T>(
  resourceType: fhir4.FhirResource["resourceType"],
  identifier: string,
): Promise<T> {
  const bundle = await ApiHelper.apiGetFhir<fhir4.Bundle>(
    `${config.ehrFhirBase}/${resourceType}?identifier=${encodeURIComponent("https://udap-spike.example.org#"+identifier)}`
  );

  return bundle!.value?.entry?.[0].resource as unknown as T
}

async function parseExtension<T>(
  entry: fhir4.DomainResource,
  extension: string
): Promise<T> {
  const details = JSON.parse(
    entry.extension?.filter(
      (e) => e.url === `https://upda-spike.example.org/${extension}`
    )[0]?.valueString!
  ) as T;

  return details;
}


async function getExtensionFromIdentified<T>(
  resourceType: fhir4.FhirResource["resourceType"],
  identifier: string,
  extension: string
): Promise<T> {
  const entry = await getIdentifiedResource<fhir4.DomainResource>(resourceType, identifier);
  const details = JSON.parse(
    entry.extension?.filter(
      (e) => e.url === `https://upda-spike.example.org/${extension}`
    )[0]?.valueString!
  ) as T;

  return details;
}

router.post("/api/oauth/token", async (req, res, err) => {
  const requestBody = req.body as TokenRequestBody;

  const grant = await getIdentifiedResource<fhir4.Consent>("Consent", `authorization_code|${req.body.code}`);
  const grantDetails = await parseExtension<AuthzSession>(grant, "grant");

  const jwksKeys = grantDetails.registration?.jwks?.keys!;
  const getKey = async (h: jose.JWTHeaderParameters, t: jose.FlattenedJWSInput): Promise<KeyLike | Uint8Array> => {
    return jose.importJWK(jwksKeys.filter(k => k.kid === h.kid)[0] as any)
  }

  const clientAuthenticated = await jose.jwtVerify(requestBody.client_assertion, getKey);
  // TODO add aud check to this validation
  if (clientAuthenticated.payload.aud !== `${config.ehrPublicBase}${req.url}`) {
    return err("Bad audience on authentication JWT: " + `${config.ehrPublicBase}${req.url}`)
  }
  if (clientAuthenticated.payload.iss !== grantDetails.registration!.client_id){
    return err("Wrong iss on client authentication JWT")
  }
  if (clientAuthenticated.payload.sub !== grantDetails.registration!.client_id){
    return err("Wrong sub on client authentication JWT")
  }
  if (clientAuthenticated.payload.exp! > new Date().getTime() / 1000 + 300) {
    return err("Client authenticatin JWT expires too far into the future")
  }

  const accessTokenResponse = {
    access_token: randomUUID(),
    scope: grantDetails.request.scope,
    exp: 3600,
    token_type: "Bearer"
  }

  grant.status = "active";
  grant.extension?.push({
        url: "https://upda-spike.example.org/token",
        valueString: JSON.stringify(accessTokenResponse),
  });

  grant.identifier = [{
        system: `https://udap-spike.example.org#access_token`,
        value: accessTokenResponse.access_token
  }]; // The authz code is not valid anymore

  const posted = await ApiHelper.apiPutFhir<fhir4.Consent>(`${config.ehrFhirBase}/Consent/${grant.id}`, grant);
  if (posted.statusCode !== 200) {
    return err("Could not save access token")
  }
  console.log("Saved consent", grant)


  res.json(accessTokenResponse)

});

router.get("/api/status.json", (req, res) => {
  res.json({ ehr: true });
});
