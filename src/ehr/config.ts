import * as jose from "jose";
import fs from "fs";
import path from "path";



let config = {
    trustedEndorser: process.env.TRUSTED_ENDORSER || "http://localhost:3000/endorser"
};

export default config;