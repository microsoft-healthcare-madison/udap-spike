import * as jose from "jose";
import fs from "fs";
import path from "path";

async function test() {
  const certificatePEM = fs
    .readFileSync(path.join(__dirname, "..", "fixtures", "endorser.crt"))
    .toString();

  const certificateDER = certificatePEM.split("\n").slice(1, -2).join("");
  console.log("Read cert", certificatePEM, certificateDER);

  const certificate = await jose.importX509(certificatePEM, "RS256");
  console.log("Imported as", certificate);

  const privateKeyPEM = fs
    .readFileSync(
      path.join(__dirname, "..", "fixtures", "endorser.private.key")
    )
    .toString();

  const privateKey = await jose.importPKCS8(privateKeyPEM, "RS256");
  console.log("Imported as", privateKey);

  const jwt = await new jose.SignJWT({ "urn:example:claim": true })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setIssuer("urn:example:issuer")
    .setAudience("urn:example:audience")
    .setExpirationTime("2h")
    .sign(privateKey);

  const exported = {
    ...(await jose.exportJWK(certificate)),
    alg: "RS256",
    use: "sig",
    x5c: [certificateDER],
  };
  console.log(exported);

  //   console.log(jwt);
}

test();
