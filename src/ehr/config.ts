import * as jose from "jose";
import fs from "fs";
import path from "path";

let config = {
    trustedEndorser: process.env.TRUSTED_ENDORSER!,
    ehrFhirBase: process.env.ENDORSER_FHIR_BASE!,
    authorizeUi: process.env.AUTHORIZE_UI!,
    ehrPublicBase: process.env.EHR_PUBLIC_BASE!
};

export default config;