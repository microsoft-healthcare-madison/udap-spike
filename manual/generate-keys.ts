import * as jose from "jose";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

async function generate() {
  const keypair = await jose.generateKeyPair("RS256");
  const pubJwk = await jose.exportJWK(keypair.publicKey);
  const privJwk = await jose.exportJWK(keypair.privateKey);

  fs.writeFileSync(
    path.join(__dirname, "..", "fixtures", "app.jwks.json"),
    JSON.stringify({keys: [pubJwk]}, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "..", "fixtures", "app.jwks.private.json"),
    JSON.stringify({keys: [privJwk]}, null, 2)
  );
}

generate();
