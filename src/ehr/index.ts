import express from "express";
import fhir4 from "fhir/r4";
import * as jose from "jose";
import path from "path";
import config from "./config";
import crypto, { randomUUID } from "crypto";
import { ApiHelper } from "../ApiHelper";

const router = express.Router();
export default router;

interface RegisteredAppMetadata {
  redirect_uris: string[];
  client_name: string;
  client_id: string;
  grant_types: ("authorization_code" | "refresh_token")[];
  response_types: "code";
  token_endpoint_auth_methods: "private_key_jwt";
  jwks?: Record<string, any>[];
}

interface UDAP_Certification_JWT_Payload extends RegisteredAppMetadata {
  iss: string,
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
    client_id: randomUUID()
  } as RegisteredAppMetadata;

  let device: fhir4.Device = {
    resourceType: "Device",
    meta: {
      tag: [{ system: "https://udap-spike.example.org" }],
    },
    identifier: [
      {
        system: `https://udap-spike.example.org#client_id`,
        value: registered.client_id
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
  response_type: "code",
  client_id: string,
  redirect_uri: string,
  scope: string,
  state: string,
  aud: string
}

const authzSessions: Record<string, AuthzSession> = {}
router.post("/api/oauth/authorize", async (req, res, err) => {
  const sessionId = randomUUID();
  authzSessions[sessionId] = req.body;
  console.log(sessionId, req.body)
  res.redirect(`${config.authorizeUi}/login.html?session=${sessionId}`);
});

router.post("/api/authorization/:sessionId/:decision", async (req, res, err) => {
  const session = authzSessions[req.params.sessionId];
  if (req.params.decision === "approve") {
    // generate token and save it
    res.redirect(session.redirect_uri)
  }
});


router.get("/api/status.json", (req, res) => {
  res.json({ ehr: true });
});
