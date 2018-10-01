/*
 *  Create & Export Config Variables
 */ 

//Container for all environments
var environments = {};

// Create Staging
environments.staging = {
  'httpPort' : '3000',
  'httpsPort' : '3001',
  'envName' : 'staging'
};

// Production Object
environments.production = {
  'httpPort' : '5000',
  'httpsPort' : '5001',
  'envName' : 'production'
};

// Determine Enviroment
var currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check Environment Exists
var envToExport = typeof(environments[currentEnvironment]) == 'object' ?  environments[currentEnvironment] : environments.staging;

module.exports = envToExport;