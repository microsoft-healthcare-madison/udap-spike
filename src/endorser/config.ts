const config = {
    iss: process.env.ENDORSER_ISS || "https://udap-spike.example.org/endorser",
    endorserFhirBase: process.env.ENDORSER_FHIR_BASE || "http://hapi.fhir.org/baseR4",
    certification_issuer: process.env.ENDORSER_CERTIFICATION_ISSUER || "Wadup Demo Endorser",
    certification_name: process.env.ENDORSER_CERTIFICATION_NAME || "Wadup Certified",
    certification_logo: process.env.ENDORSER_CERTIFICATION_LOGO || "https://udap-spike.example.org/endorser/logo.png",
    certification_uris: [process.env.ENDORSER_CERTIFICATION_URI || "https://udap-spike.example.org/endorser/policy.html"],
    certification_status_endpoint: process.env.ENDORSER_CERTIFICATION_STATUS_ENDPOINT || "https://udap-spike.example.org/endorser/api/status.json",

 };

export default config;

