# udap-spike

## Discovered issues

### Support a pattern of trusted per-device registration

* Allow an endorsement bound to an "app template" or "app controller" -- i.e., an entity that's allowed to register per-device app instances, for one specific template of app configuration details (redirect URIs, client namee, etc).

> This protocol MAY be used only by Client Apps that are able to protect the private key used to sign software statements, e.g. confidential clients and certain native device apps.

* ^ This language  is problematic because the "MAY" here is trying to reflect a "SHALL NOT", and "SHALL NOT" would prevent use by browser-based apps and other clients that could benefit from a trusted dynamic registration protocol (e.g., non-extractable WebCrypto usage). The bigger issue is that the protocol should allow the keys used for signing a software statement to be distinct from the keys that will be used by the newly registered instance (i.e., the key the instance will use when authenticating to a server via the `private_key_jwt` method). These should be separate to support a trusted dynamic registration protocol based entirely on endorsement metadata, even if some trust frameworks requires certificate chains, etc. When performing instance-specific registration, it's important for the protocol to *avoid* letting the app controller generate new keys/certificates that would allow one instance to impersonate another.

* UDAP --  the prohibition on reuse of software statements and short lifetime of them is inconsistent with intentions in the underlying dynamic registration specification. This is OK but it's worth calling out explicitly. And without the changes suggested above, it also unnecessarily prevents use of UDAP in per-device trusted registration scenarios.

### Allow endorsement JWTs to convey more granular certification metadata

* `certification_name` is 0..1 but `certification_uris` is 0..* -- how does one name apply to >1 certification? Perhaps there should be a data structure with {name, uri, logo} that repeats? Or else constrain `certification_uris` to 0..1 and ask the client to get multiple endorsements?

### Support use of `jwks_uri` in addition to x.509 trust frameworks

> as per RFC 7591 (optional); locks this certification to a specific client key or keys. Note that jwks_uri MUST NOT be used

* ^ RFC7591 allows and indeed prefers `jwks_uri`. UDAP should allow it too (and if it's going to be prohibited, call this out as a new requirement, not a "Note" which is misleading).

### Support additional signature algorithms
* `RS256` as the only documented signature algorithm on endorsements and on software statements. Should allow the same signature algorithms as CDS Hooks, SMART Backed Servics, SMART Health Cards (`ES384`, `RS384`, `ES256`) in addition, even if one algorithm is "recommended".

### Bugs

> The top-level elements of the response SHALL include the client_id issued by the Authorization Server for use by the Client App, the software statement as submitted by the Client App, and all of the registration related parameters that were included in the software statement:

* ^ Surely only the params *recognized*/accepted?


## UDAP Spike Project Details


### Build and run in Docker

    docker build -t udap .
    docker network create udap
    docker run   --network=udap --name hapi -p 8080:8080 hapiproject/hapi:latest
    docker run \
      -e AUTHORIZE_UI="http://localhost:3000/ehr/static" \
      -e ENDORSER_FHIR_BASE="http://hapi:8080/fhir" \
      --network=udap  --rm -it  -p 3000:3000  udap

### Building EHR UI


    cd ehr-ui
    npm run build && cp -r build/* ../src/ehr/static/
    cd ..

Then to point the EHR API to this statically hosted EHR authz screen, pass this location in via `AUTHORIZE_UI`, like:

    AUTHORIZE_UI="http://localhost:3000/ehr/static" npm run serve


### Running tests

    docker run -p 8080:8080 hapiproject/hapi:latest
    npm test -- tests/e2e-registration  --watch
    
### TODO

For https://github.com/microsoft-healthcare-madison/client-js/tree/own-jws branch, two discovered issues:

* The `privateJwk` should be replaced (or augmented) with a signer function, to support non-extractable keys
* The detection for "is running in browser" fails when dropping `dist` into a typescript project as an NPM dependency -- need to clean up or document this interface
