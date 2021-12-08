import express from "express";
import fhir4 from "fhir/r4";
import * as jose from "jose";
import path from "path";
import config from "./config";
import crypto from "crypto";

const router = express.Router();
export default router;

interface RegisteredAppMetadata {
  redirect_uris: string[],
  client_name: string,
  client_id: string,
  grant_types: ("authorization_code" | "refresh_token")[],
  response_types: "code",
  token_endpoint_auth_methods: "private_key_jwt"
}

interface UDAP_Certification_JWT_Payload extends RegisteredAppMetadata {
  sub: string,
  certification_issuer: string,
  certification_name: string,
  certification_logo: string,
  certification_uris: string[],
  certification_status_endpoint: string,
  is_endorsement: boolean,
  developer_name: string,
}

interface RegistrationRequestBody {
  certifications: string[],
  software_statement: string,
  udap: "1" | "INVALID"
}

const getJwksForSubject = (s: string) => jose.createRemoteJWKSet(new URL(`${s}/.well-known/jwks.json`))

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
    const verifiedEndorsement = await jose.jwtVerify(endorsementJWT, trustedEndorserJWKS);
    const endorsement = verifiedEndorsement.payload as unknown as UDAP_Certification_JWT_Payload;
    console.log("Endorsement verified? ", endorsement);

    const trustedAppJWKS = getJwksForSubject(endorsement.sub);
    const verifiedSoftwareStatement = await jose.jwtVerify(body.software_statement, trustedAppJWKS);
    console.log("SW Statement", verifiedSoftwareStatement);



    const registered: RegisteredAppMetadata = { } as RegisteredAppMetadata;

    return; 
    /*
    let device: fhir4.Device = {
    resourceType: "Device",
    meta: {
      tag: [{ system: "https://udap-spike.example.org" }],
    },
    owner: {
      reference: `Organization/${devId}`,
    },
    identifier: [
      {
        system: `https://udap-spike.example.org#sub`,
        value: app.sub,
      },
      {
        system: `https://udap-spike.example.org#client_name`,
        value: app.client_name,
      },
      ...app.redirect_uris.map((r: string) => ({
          system: `https://udap-spike.example.org#redirect_uri`,
          value: r
        })),
    ],
  };
  */


})

router.get("/api/status.json", (req, res) => {
  res.json({ ehr: true });
});