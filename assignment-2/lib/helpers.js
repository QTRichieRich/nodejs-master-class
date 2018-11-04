/**
 * 
 * Helpers for various tasks
 * 
 */

 //Dependancies
 const crypto = require('crypto');
 const config = require('./config');

 const https = require('https');
 const querystring = require('querystring');

 // Helpers Container
const helpers = {};

// Create a SHA256 Hash Password
helpers.hash = (str) => {

  if (typeof(str) == 'string') {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  }else{
    return false;
  }
};

// Parse JSON in all cases without throwing
helpers.parseJsonToObject = (str) => {
  try{
    console.log(str);
    var obj = JSON.parse(str);
    return obj;
  }catch(e){
    return {};
  }
}

// Create a steing of random alpha-numeric characters of given length
helpers.createRandomString = (strLength) => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  
  if (strLength) {

    //Define Possible Chars
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    var str = '';
    for(i = 1; i <= strLength; i++) {
      //Get character from sting of possible characters

      var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

      str += randomCharacter;
    }

    //return final string
    return str;

  }else {
    return false;
  }
}



// Send an SMS Message

helpers.sendTwilioSms = (phone, msg, callback) => {

  phone = typeof(phone) == 'string' && phone.trim().length >= 8 ? phone.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

   if (phone && msg) {

    // COnfig Request Payload
    const payload = {
      'From' : config.twilio.fromPhone,
      'To' : '+1' + phone,
      'Body' : msg
    };

    console.log(payload);

    //Configure Request Details
    var stringPayload = querystring.stringify(payload);

    console.log(stringPayload);

    //configure requst
    const requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload),
      },
    };
    console.log(requestDetails)
    //Instatiate Request Obj
    const req = https.request(requestDetails, (res) => {
      //Get Status

      const status = res.statusCode;

      //Callback success if request went through
      if (status == 200 || status == 200) {
        callback(false);
      }else{
        callback('Status code returned: ' + status);
      }
    });

    // Bind to error Event So it doesnt get thrown.
    req.on('error', (e) => {
      callback('Bind Error Status code returned: ' + e);
    });

    //Add Payload
    req.write(stringPayload);

    // End Request
    req.end();

  }else{
    callback('Given Parameters Missing Or Invalid');
  }
};





//Export Module
module.exports = helpers;