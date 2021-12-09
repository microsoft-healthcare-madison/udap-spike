let config = {
  appUrl: process.env.APP_URL || 'http://localhost:3000/app',
  orgName: process.env.ORGANIZATION_NAME || 'Test Org',
  devName: process.env.DEVELOPER_NAME || 'Developer of Test',
  clientName: process.env.CLIENT_NAME || 'UDAP Spike App',
  endorserApiUrl:  process.env.ENDORSER_API_URL || 'http://localhost:3000/endorser/api',
  defaultDeveloperId: process.env.DEVELOPER_ID==="" ? "" : process.env.DEVELOPER_ID ?? '2705933',
  defaultAppId: process.env.APP_ID ==="" ? "" : process.env.APP_ID  ?? '2706100',
};

export default config;
