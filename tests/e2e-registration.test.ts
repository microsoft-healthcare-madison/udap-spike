import server from "../src/index";
import superagent from "superagent";
import * as jose from "jose";
import fs from "fs";
import path from "path";

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
  const appInstanceJwk = await jose.exportJWK(appInstanceKey.publicKey);

  const statement = await new jose.SignJWT({
    ...appDetails,
    iss: appDetails.sub,
    sub: `${appDetails.sub}#${randomUUID()}`,
    jwks: {"keys": [appInstanceJwk]}
  }).setProtectedHeader({alg: "RS256"}).sign(appControllerKey);



  const registered = await agent
    .post(`/ehr/api/oauth/register`)
    .set("Content-Type", "application/json")
    .send({
      software_statement: statement,
      certifications: [endorsement.body.endorsement],
      udap: "1",
    });

  expect(registered.statusCode).toBe(201)
});
