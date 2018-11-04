/**
 * Worker Related Tasks
 */

const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');

// Instatiate Workers

const workers = {};

//Gather All Checks
workers.gatherAllChecks = () => {
  // Get all checks that exist in system;.

  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach(check => {
        // Read in check data
        _data.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            //Pass Data to Check Validator
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error Reading on the checsks data');
          }
        });
      });
    } else {
      console.log('Error: Could not find any checks to process');
    }
  });
};

//Sanity check check data
workers.validateCheckData = originalCheckData => {
  originalCheckData =
    typeof originalCheckData == 'object' && originalCheckData !== null
      ? originalCheckData
      : {};
  originalCheckData.id =
    typeof originalCheckData.id == 'string' &&
    originalCheckData.id.trim().length == 20
      ? originalCheckData.id.trim()
      : false;
  originalCheckData.userPhone =
    typeof originalCheckData.userPhone == 'string' &&
    originalCheckData.userPhone.trim().length == 10
      ? originalCheckData.userPhone.trim()
      : false;
  originalCheckData.protocol =
    typeof originalCheckData.protocol == 'string' &&
    ['http', 'https'].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false;
  originalCheckData.url =
    typeof originalCheckData.url == 'string' &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url.trim()
      : false;
  originalCheckData.method =
    typeof originalCheckData.method == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false;
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes == 'object' &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false;
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds == 'number' &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false;

  //Set Keys that may not be set if workrers have never seen this check before
  originalCheckData.state =
    typeof originalCheckData.state == 'string' &&
    ['up', 'down'].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : 'down';
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked == 'number' &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  //If all the checks pass, pass data to next step

  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    console.log('Error: Failed Check Validation, skipping');
  }
};

// Perform the check
workers.performCheck = originalCheckData => {
  
  // prepare initial check outcome
  let checkOutcome = {
    error: fasle,
    responseCode: false
  };

  //Mark outcome not yet sent
  let outcomeSent = false;

  //Parse the hostmane and the path ou of the original check data
  let parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);

};

//Timer to execute the worker process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

workers.init = () => {
  //Execute Checks
  workers.gatherAllChecks();

  //Call Loop to execute on own
  workers.loop();
};

module.exports = workers;
