const config = {
    iss: process.env.ENDORSER_ISS!,
    endorserFhirBase: process.env.ENDORSER_FHIR_BASE!,
    certification_issuer: process.env.ENDORSER_CERTIFICATION_ISSUER!,
    certification_name: process.env.ENDORSER_CERTIFICATION_NAME!,
    certification_logo: process.env.ENDORSER_CERTIFICATION_LOGO!,
    certification_uris: [process.env.ENDORSER_CERTIFICATION_URI!],
    certification_status_endpoint: process.env.ENDORSER_CERTIFICATION_STATUS_ENDPOINT!
 };

export default config;

