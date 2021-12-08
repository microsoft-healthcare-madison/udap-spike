#!/bin/bash

openssl req -x509 -newkey \
  rsa:4096 \
  -sha256 \
  -days 3650 \
  -nodes \
  -keyout fixtures/endorser.private.key \
  -out fixtures/endorser.crt \
  -subj "/CN=Wadup Endorser Self Signed Root" \
  -addext "subjectAltName=URI:https://udap-spike.example.org/endorser" \
  -addext "subjectAltName=URI:http://localhost:3000/endorser"
