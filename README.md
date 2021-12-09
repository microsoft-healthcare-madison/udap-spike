# udap-spike

## Discovered issues

* `RS256` as the only documented signature algorithm on endorsements. Should allow the same signatur algorithms as CDS Hooks, SMART Backed Servics, SMART Health Cards (`ES384`, `RS384`, `ES256`)

* Binding a registration request to keys

> This protocol MAY be used only by Client Apps that are able to protect the private key used to sign software statements, e.g. confidential clients and certain native device apps.

* Unclear how the key used to sign a software statement relates to the key used in `private_key_jwt` method. These should be separate to support a trusted dynamic registration protocol based entirely on endorsement metadata, even if some trust frameworks requires certificate chains, etc.

* ^ This language  is problematic because the "MAY" here is trying to reflect a "SHALL NOT", and "SHALL NOT" would prevent use by browser-based apps and other clients that could benefit from a trusted dynamic registration protocol (e.g., non-extractable WebCrypto usage)

* In HAPI where is `meta.source` coming from, with `#...`?

* UDAP --  after a registration, the client is not necessarily the undo to any key? But if it is bound to a key, does it need to be one that was  presented in an endorsement? Presumably not,  Even if an endorsement was presented.

* UDAP --  the prohibition on reuse of software statements and short lifetime of them is inconsistent with intentions in the underlying dynamic registration specification. This also  limits use of UDAPN scenarios where some data need to be  consistent across multiple registrations of a client and other data can vary

> The top-level elements of the response SHALL include the client_id issued by the Authorization Server for use by the Client App, the software statement as submitted by the Client App, and all of the registration related parameters that were included in the software statement:

* ^ Surely only the params *recognized*/accepted?


> as per RFC 7591 (optional); locks this certification to a specific client key or keys. Note that jwks_uri MUST NOT be used

* ^ RFC7591 allows and indeed prefers `jwks_uri`. UDAP should allow it too (and if it's going to be prohibited, call this out as a new requirement, not a "Note" which is misleading).


* `certification_name` is 0..1 but `certification_uris` is 0..* -- how does one name apply to >1 certification? There should be a data structure with {name, uri, logo} that repeats.


### Build and run in Docker

    docker build -t udap .
    docker network create udap
    docker run   --network=udap --name hapi -p 8080:8080 hapiproject/hapi:latest
    docker run -e ENDORSER_FHIR_BASE=http://hapi:8080/fhir --network=udap  --rm -it  -p 3000:3000  udap

### Building EHR UI


    cd ehr-ui
    npm run build && cp -r build/* ../src/ehr/static/
    cd ..

Then to point the EHR API to this statically hosted EHR authz screen, pass this location in via `AUTHORIZE_UI`, like:

    AUTHORIZE_UI="http://localhost:3000/ehr/static" npm run serve


### Running tests

    docker run -p 8080:8080 hapiproject/hapi:latest
    npm test -- tests/e2e-registration  --watch
