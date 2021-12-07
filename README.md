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
