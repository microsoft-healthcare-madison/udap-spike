import server from "../src/index";
import superagent from "superagent";
import * as jose from "jose";
import fs from "fs";
import path from "path";
import qs from "qs";

import supertest from "supertest";
import { randomUUID } from "crypto";

const agent = supertest.agent(server);

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("Basic reg flow", async () => {
  // const ehrStatus = await superagent.get("http://localhost:3000/ehr/api/status.json");

  const developer = await agent
    .post("/endorser/api/developer")
    .set("Content-Type", "application/json")
    .send({
      organizationName: "Test App Developer Org",
      developerName: "Test App Developer Name",
    });

  const appDetails = {
    sub: "http://localhost:3000/app",
    client_name: "The best health app available",
    redirect_uris: [
      "https://mysub.example.com/redirect",
      "https://mysub.example.com/redirect-2",
    ],
  };

  const app = await agent
    .post(`/endorser/api/developer/${developer.body.id}/app`)
    .set("Content-Type", "application/json")
    .send({
      ...appDetails,
    });

  const endorsement = await agent.get(
    `/endorser/api/developer/${developer.body.id}/app/${app.body.id}/endorsement`
  );

  console.log("endorsement", endorsement.body.endorsement);
  const ehrStatus = await agent.get("/ehr/api/status.json");
  expect(ehrStatus.statusCode).toBe(200);

  const appJWKS = JSON.parse(
    fs
      .readFileSync(
        path.join(__dirname, "..", "fixtures", "app.jwks.private.json")
      )
      .toString()
  );

  const appControllerKey = await jose.importJWK(appJWKS.keys[0], "RS256");
  const appInstanceKey = await jose.generateKeyPair("RS256");
  const appInstanceJwk = {
    ...(await jose.exportJWK(appInstanceKey.publicKey)),
    alg: "RS256",
    kid: "key-001",
  };

  const statement = await new jose.SignJWT({
    ...appDetails,
    iss: appDetails.sub,
    sub: `${appDetails.sub}#${randomUUID()}`,
    jwks: { keys: [appInstanceJwk] },
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(appControllerKey);

  const registered = await agent
    .post(`/ehr/api/oauth/register`)
    .set("Content-Type", "application/json")
    .send({
      software_statement: statement,
      certifications: [endorsement.body.endorsement],
      udap: "1",
    });

  const authzRequestParams = {
    response_type: "code",
    client_id: registered.body.client_id,
    redirect_uri: registered.body.redirect_uris[0],
    scope: "user/*.cruds",
    state: randomUUID(),
    aud: `http://localhost:3000/ehr/api/fhir`,
  };

  console.log("start au", authzRequestParams);
  const authorize = await agent.get(
    `/ehr/api/oauth/authorize?${qs.stringify(authzRequestParams)}`
  );
  const redirectToSkip = new URL(authorize.headers["location"]);

  // this is cheating, to skip user authz step
  const fakeUserApproval = await agent.post(
    `/ehr/api/authorization/${redirectToSkip.searchParams.get(
      "session"
    )}/approve`
  );
  const authzCode = new URL(
    fakeUserApproval.headers["location"]
  ).searchParams.get("code");
  console.log("Authz code", authzCode);

  const clientAuthnAssertion = await new jose.SignJWT({
    iss: authzRequestParams.client_id,
    sub: authzRequestParams.client_id,
    aud: "http://localhost:3000/ehr/api/oauth/token",
  })
    .setExpirationTime("2 minutes")
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: "key-001" })
    .setJti(randomUUID())
    .sign(appInstanceKey.privateKey);

  const tokenRequestParams = {
    grant_type: "authorization_code",
    code: authzCode,
    redirect_uri: appDetails.redirect_uris[0],
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAuthnAssertion,
  };

  const tokenResponse = await agent
    .post(`/ehr/api/oauth/token`)
    .set("Content-Type", "application/x-www-form-urlencoded")
    .send(qs.stringify(tokenRequestParams));

  expect(registered.statusCode).toBe(201);
  expect(tokenResponse.statusCode).toBe(200);
});
