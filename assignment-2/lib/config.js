/*
 *  Create & Export Config Variables
 */ 

//Container for all environments
var environments = {};


// Create Staging
environments.staging = {
  'httpPort' : '3000',
  'httpsPort' : '3001',
  'envName' : 'staging',
  'hashingSecret' : 'uberSecret',
  'maxCheckLimit' : 5,
  'twilio' : {
    'accountSid' : 'AC4b1d1eb1348be487aeec59b910d058f0',
    'authToken' : 'c3082f3ae32e5e2e14da335dee336ee5',
    'fromPhone' : '+6421772998',
  }
};

// Production Object
environments.production = {
  'httpPort' : '5000',
  'httpsPort' : '5001',
  'envName' : 'production',
  'hashingSecret' : 'uberSecret',
  'maxCheckLimit' : 5,
  'maxCheckLimit' : 5,
  'twilio' : {
    'accountSid' : 'AC4b1d1eb1348be487aeec59b910d058f0',
    'authToken' : 'c3082f3ae32e5e2e14da335dee336ee5',
    'fromPhone' : '+6421772998',
  }
};

// Determine Enviroment
var currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check Environment Exists
var envToExport = typeof(environments[currentEnvironment]) == 'object' ?  environments[currentEnvironment] : environments.staging;

module.exports = envToExport;