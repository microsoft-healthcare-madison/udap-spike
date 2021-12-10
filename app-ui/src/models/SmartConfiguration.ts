
export interface SmartConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  introspection_endpoint: string;
  management_endpoint: string;
  revocation_endpoint: string;
  code_challenge_methods_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  scopes_supported: string[];
  response_types_supported: string[];
  capabilities: string[];

  udap_versions_supported: string[];
  udap_certifications_required: string[];
  grant_types_supported: string[];
  registration_endpoint: string;
}