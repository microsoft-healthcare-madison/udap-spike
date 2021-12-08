import * as jose from "jose";
import fs from "fs";
import path from "path";

let config = {
    trustedEndorser: process.env.TRUSTED_ENDORSER || "http://localhost:3000/endorser",
    ehrFhirBase: process.env.ENDORSER_FHIR_BASE || "https://hapi.fhir.org/baseR4",
    authorizeUi: process.env.AUTHORIZE_UI || "http://localhost:3001"
};

export default config;