import server from "../src/index";
import superagent from "superagent";
import * as jose from "jose";
import fs from "fs";
import path from "path";

import supertest from "supertest";

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

  const appKey = await jose.importJWK(appJWKS.keys[0], "RS256");

  const statement = await new jose.SignJWT({
    ...appDetails,
  }).setProtectedHeader({alg: "RS256"}).sign(appKey);

  const registered = await agent
    .post(`/ehr/api/oauth/register`)
    .set("Content-Type", "application/json")
    .send({
      software_statement: statement,
      certifications: [endorsement.body.endorsement],
      udap: "1",
    });

  expect(registered.statusCode).toBe(201)

  //   const post = await Post.create({ title: "Post 1", content: "Lorem ipsum" });

  //   await supertest(app).get("/api/posts")
  //     .expect(200)
  //     .then((response) => {
  //       // Check type and length
  //       expect(Array.isArray(response.body)).toBeTruthy();
  //       expect(response.body.length).toEqual(1);

  //       // Check data
  //       expect(response.body[0]._id).toBe(post.id);
  //       expect(response.body[0].title).toBe(post.title);
  //       expect(response.body[0].content).toBe(post.content);
  //     });
});
