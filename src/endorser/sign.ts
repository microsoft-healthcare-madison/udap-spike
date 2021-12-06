import * as jose from "jose";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

interface Signer {
  sign(claims: Record<string, any>): Promise<string>;
  publicJwk: Record<string, any>;
}

export default async function create(
  iss: string,
  certificatePath: string,
  keyPath: string
): Promise<Signer> {

  const certificatePEM = fs.readFileSync(certificatePath).toString();
  const certificateDER = certificatePEM.split("\n").slice(1, -2).join("");
  const certificate = await jose.importX509(certificatePEM, "RS256");

  const privateKeyPEM = fs
    .readFileSync(keyPath)
    .toString();

  const privateKey = await jose.importPKCS8(privateKeyPEM, "RS256");

  const publicJwk = {
    ...(await jose.exportJWK(certificate)),
    alg: "RS256",
    use: "sig",
    x5c: [certificateDER],
  };
 
  return {
    sign: async (claims): Promise<string> => {
      const jwt = await new jose.SignJWT(claims)
        .setIssuer(iss)
        .setJti(randomUUID())
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt()
        .setExpirationTime("3 years")
        .setProtectedHeader({
          "alg": "RS256",
          "x5c": publicJwk.x5c
        })
        .sign(privateKey);

      return jwt;
    },
    publicJwk
  };
}
