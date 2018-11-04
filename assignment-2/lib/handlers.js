/*
 *
 * 
 * Request Handlers
 *
 *
 */

// Dependancies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

//Define Handlers
const handlers = {};

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

//container for user submethds
handlers._users = {

}

//users post
// Required data: firstname, lastName, phone, password, TOSAgreement
//Optional data: none
handlers._users.post = (data, callback) => {
  // Check fields are complete and fille out

  const firstname = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  console.log(data.payload);

  if (firstname && lastName && phone && password && tosAgreement) {
    // Make sure user is Unique
    _data.read('users', phone, (err, data) => {
      if (err) {
        //Hash Password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {

          //Create User Object
          const userObject = {
            'firstName': firstname,
            'lastName': lastName,
            'phone': phone,
            'hashedPassword': hashedPassword,
            'tosAgreement': true,
          };

          //Store User
          _data.create('users', phone, userObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {
                'Error': 'Could not create the new user'
              });
            }
          });


        } else {
          callback(500, {
            'Error': 'Could not hash the user\'s password'
          });
        }

      } else {
        // User Exists
        callback(400, {
          'Error': 'User with phone number exists'
        });
      };
    });
  } else {
    callback(400, {
      'Error': 'Missing required fields'
    });
  }
};

//users get
//REQUIRED DATA: phone
//OPTIONAL DATA: none
handlers._users.get = (data, callback) => {
  //Check phone is valid     
  const phone = (typeof (data.querystringObject.phone) == 'string' && data.querystringObject.phone.length == 10) ? data.querystringObject.phone : false;

  if (phone) {
    //Get Token from Headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    //Verify Token is valid
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {

        // Look Up User
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            //Remove Hashed Password before returning
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404, {
              'Error': 'Token Not Found'
            })
          }
        });

      } else {
        callback(403, {
          'Error': 'Token Missing or Invalid'
        });
      }

    });
  } else {
    callback(400, {
      'Error': 'Phone not valid or missing'
    });
  }
};

//users put
//REQUIRED DATA: phone, 
//OPTIONAL: firstName, lastName, password (one must be specified)
handlers._users.put = (data, callback) => {
  //Check Required Field
  const phone = (typeof (data.payload.phone) == 'string' && data.payload.phone.length == 10) ? data.payload.phone : false;

  // Check Optional Fields'
  const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  console.log(data);
  // Error if phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {

      const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

      //Verofy Token is valid
      handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {


          _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
              // Update Fields
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.password = helpers.hashedPassword(password);
              }

              //Store Passwords
              _data.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err)
                  callback(500, {
                    'Error': 'Problem Updating User Data'
                  });
                }
              });
            } else {
              callback(403, {
                'Error': 'Token Missing or Invalid'
              });
            }

          });
        } else {
          callback(400, {
            'Error': 'Specified User does not exist'
          });
        }
      });
    } else {
      callback(400, {
        'Error': 'Missing Fields to Update'
      });
    }
  } else {
    callback(400, {
      'Error': 'Phone not valid or missing'
    });
  }

};

//users delete
//REQUIRED: Phone

handlers._users.delete = (data, callback) => {

  //Get Phone Number
  const phone = (typeof (data.querystringObject.phone) == 'string' && data.querystringObject.phone.length == 10) ? data.querystringObject.phone : false;

  if (phone) {
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    console.log(phone);

    //Verofy Token is valid
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {


        // Look Up User
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            _data.delete('users', phone, (err) => {
              if (!err) {

                //DELETE EACH CHECK ASSOCIATED WITH USER
                const userChecks = typeof (data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                const checksToDelete = userChecks.length;

                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionErrors = false;

                  // Loop through checks
                  userChecks.forEach((checkID)=>{
                    _data.delete('checks', checkID, (err)=> {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (deletionErrors) {
                          callback(200);
                        }else{
                          callback(500, {'Error': 'Errors Encounted whilst attempting to deltet user checks'});
                        }
                      }
                    });
                  });

                }else{
                  callback(200);
                }

              } else {
                callback(500, {
                  'Error': 'Couldn\'t delete specified user'
                });
              }
            });

          } else {
            callback(400, {
              'Error': 'Couldn\'t find specified user'
            });
          }
        });
      } else {
        callback(403, {
          'Error': 'Token Missing or Invalid'
        });
      }

    });
  } else {
    callback(400, {
      'Error': 'Phone not valid or missing'
    });
  }


};

//Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

//_tokens Container
handlers._tokens = {};

// Tokens Post
// REQUIRED: phone, password
// OPTIONAL: name
handlers._tokens.post = (data, callback) => {
  const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  // console.log(password);
  if (phone && password) {
    //Look Up User who matches phone
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // Hash sent passowrd and compare to user object.
        const hashedPassword = helpers.hash(password);

        if (hashedPassword == userData.hashedPassword) {
          //Create a new Token with a random name, set expiration data 1 hour in future

          const tokenID = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;

          const tokenObject = {
            'phone': phone,
            'id': tokenID,
            'expires': expires
          }

          _data.create('tokens', tokenID, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              console.log(err);
              callback(500, {
                'Error': 'Could not save new token'
              });
            }
          });

        } else {
          callback(400, {
            'Error': 'Incorrect User and/or Password'
          });
        }

      } else {
        callback(400, {
          'Error': 'Couldn\'t find specified user'
        });
      }
    });

    //Match User to Password
  } else {
    callback(400, {
      'Error': 'Missing Required Fields'
    });
  }
};

// Tokens Get
// REQUIRED: TokenID
// OPTIONAL: none
handlers._tokens.get = (data, callback) => {
  //Check tokenID is valid     
  const tokenID = (typeof (data.querystringObject.tokenID) == 'string' && data.querystringObject.tokenID.length == 20) ? data.querystringObject.tokenID : false;

  if (tokenID) {
    // Look Up tokenID
    _data.read('tokens', tokenID, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, {
          'Error': 'Token Not Found'
        })
      }
    });
  } else {
    callback(400, {
      'Error': 'Token ID not valid or missing'
    });
  }
};

// Tokens Put
// REQUIRED: tokenID, extend
// OPTIONAL: none
handlers._tokens.put = (data, callback) => {
  const tokenID = (typeof (data.payload.tokenID) == 'string' && data.payload.tokenID.length == 20) ? data.payload.tokenID : false;
  const extend = (typeof (data.payload.extend) == 'boolean' && data.payload.extend == true) ? true : false;

  if (tokenID && extend) {
    //Lookup token
    _data.read('tokens', tokenID, (err, tokenData) => {
      if (!err && tokenData) {
        //Check Token not expired
        if (tokenData.expires > Date.now()) {
          //Set expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          //store new udpates
          _data.update('tokens', tokenID, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                'Error': 'Could not update token'
              });
            }
          });
        } else {
          callback(400, {
            'Error': 'Token has expired & can\'t be extended'
          });
        }
      } else {
        callback(400, {
          'Error': 'Token not exist'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing/Invalid Required Fields '
    });
  }
};

// Tokens Delete
// REQUIRED tokenID
// OPTIONAL none
handlers._tokens.delete = (data, callback) => {
  //Get tokenID
  const tokenID = (typeof (data.querystringObject.tokenID) == 'string' && data.querystringObject.tokenID.length == 20) ? data.querystringObject.tokenID : false;

  if (tokenID) {

    // Look Up User
    _data.read('tokens', tokenID, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', tokenID, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, {
              'Error': 'Couldn\'t delete specified token'
            });
          }
        });

      } else {
        callback(400, {
          'Error': 'Couldn\'t find specified token'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'token not valid or missing'
    });
  }

};

// Veroty a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
  //Look Up Token
  _data.read('tokens', id, (err, tokenData) => {

    if (!err && tokenData) {
      //Check token is for given user
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }

  });

}

//Checks
handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

//Container for all the check methods
handlers._checks = {};

// Checks Post
// Required protoco, successCodes, method, successCodes, timeoutSeconds
// Optional none
handlers._checks.post = (data, callback) => {

  // Validate inputs
  const protocol = (typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1) ? data.payload.protocol : false;
  const url = (typeof (data.payload.url) == 'string' && data.payload.url.length > 0) ? data.payload.url : false;
  const method = (typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1) ? data.payload.method : false;
  const successCodes = (typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0) ? data.payload.successCodes : false;
  const timeoutSeconds = (typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5) ? data.payload.timeoutSeconds : false;

  if (protocol && timeoutSeconds && method && successCodes && timeoutSeconds) {
    //Check User has provided token in header
    //Get Token From Header

    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    //Look up user form token
    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        //Look Up User Data
        _data.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            // Create Checks
            const userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

            //Verify has less than number of Max Checks
            if (userChecks.length < config.maxCheckLimit) {
              // Create Random ID for check
              const checkID = helpers.createRandomString(20);

              // Create Check Object & include users phone
              const checkObject = {
                'checkID': checkID,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds': timeoutSeconds
              };

              _data.create('checks', checkID, checkObject, (err) => {
                if (!err) {
                  // Add CHeck Id to Users Object

                  userData.checks = userChecks;
                  userData.checks.push(checkID);

                  // Save New User Data
                  _data.update('users', userPhone, userData, (err) => {
                    if (!err) {
                      // Return new Check
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        'Error': 'Could not update user with new check',
                        err
                      });
                    }
                  });
                } else {
                  callback(500, {
                    'Error': 'Could not create new check'
                  });
                }
              });

            } else {
              callback(400, {
                'Error': 'User has reached check limit (' + config.maxCheckLimit + ')'
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });

  } else {
    callback(400, {
      'Error': 'Inputs are invalid'
    });
  }

};

// Check Get
// REQUIRED checkID
// OPTIONAL none
handlers._checks.get = (data, callback) => {
  //Check phone is valid     
  const checkID = (typeof (data.querystringObject.checkID) == 'string' && data.querystringObject.checkID.length == 20) ? data.querystringObject.checkID : false;

  if (checkID) {
    //Look up the check

    _data.read('checks', checkID, (err, checkData) => {
      if (!err && checkData) {

        //Get Token from Headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        //Verify Token is valid
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {

            // return check data
            callback(200, checkData);

          } else {
            callback(403);
          }

        });

      } else {
        callback(404)
      }
    });

  } else {
    callback(400, {
      'Error': 'Phone not valid or missing'
    });
  }
};


// CHecks Put
// REQUIRED checkID
// OPTIONAL protocol, url, methd, timeoutSeconds, successCodes - one of these mus be set

handlers._checks.put = (data, callback) => {
  //Check Required Field
  const checkID = (typeof (data.payload.checkID) == 'string' && data.payload.checkID.length == 20) ? data.payload.checkID : false;

  // console.log((typeof (data.payload.checkID) == 'string' && data.payload.checkID.length == 20));
  // console.log(checkID);

  // Validate inputs
  const protocol = (typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1) ? data.payload.protocol : false;
  const url = (typeof (data.payload.url) == 'string' && data.payload.url.length > 0) ? data.payload.url : false;
  const method = (typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1) ? data.payload.method : false;
  const successCodes = (typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0) ? data.payload.successCodes : false;
  const timeoutSeconds = (typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5) ? data.payload.timeoutSeconds : false;

  // console.log(data);
  // Error if checkID is invalid
  if (checkID) {
    // Error if nothing is sent to update
    if (protocol || url || method || successCodes || timeoutSeconds) {

      // Look Up Check
      _data.read('checks', checkID, (err, checkData) => {
        if (!err && checkData) {
          const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

          //Verofy Token is valid
          handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
            if (tokenIsValid) {
              // Update the check where necessary

              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              _data.update('checks', checkID, checkData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, {
                    'Error': 'Check data could not be updated'
                  });
                }
              });

            } else {
              callback(400, {
                'Error': 'Specified Check does not exist'
              });
            }

          });
        } else {
          callback(400, {
            'Error': 'Check ID not exist'
          });
        }

      });


    } else {
      callback(400, {
        'Error': 'Missing Fields to Update'
      });
    }

  } else {
    callback(400, {
      'Error': 'Missing required fields'
    });
  }

};

// Checks Delete
// REQUIRED checkID
// OPTIONAL none
handlers._checks.delete = (data, callback) => {

  //Get Phone Number
  const checkID = (typeof (data.querystringObject.checkID) == 'string' && data.querystringObject.checkID.length == 20) ? data.querystringObject.checkID : false;

  if (checkID) {

    //LOOKUP CHECK
    _data.read('checks', checkID, (err, checkData) => {
      if (!err && checkData) {
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        //Verofy Token is valid
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {

            _data.delete('checks', checkID, (err) => {
              if (!err) {

                // Look Up User
                _data.read('users', checkData.userPhone, (err, userData) => {
                  if (!err && userData) {
                    const userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                    //Remove the check from user check
                    const checkPosition = userChecks.indexOf(checkID);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition,1);

                      //Resave
                      _data.update('users', checkData.userPhone, userData, (err) => {

                        if (!err) {
                          callback(200);
                        }else{
                          callback(500, {'Error': 'Could not update user object'});
                        }

                      });
                    }else{
                      callback(500, {'Error': 'Could not find check on user object'});
                    }

                  } else {
                    callback(400, {
                      'Error': 'Couldn\'t find specified user who created check'
                    });
                  }
                });

                callback(200);
              } else {
                callback(500, {
                  'Error': 'Couldn\'t delete specified check'
                });
              }
            });



          } else {
            callback(403, {
              'Error': 'Token Missing or Invalid'
            });
          }

        });

      } else {
        callback(400, {
          'Error': 'Check ID does not exist'
        })
      }
    });

  } else {
    callback(400, {
      'Error': 'Phone not valid or missing'
    });
  }


};



//Hello Handler
handlers.hello = (data, callback) => {

  //Set Hello message by default
  const response = {
    'message': 'Hello!!'
  };

  //Get the Payload and output - assuming it's the users name
  if (data.method === 'post') {
    const user = data.payload;
    response = {
      'message': 'Hello ' + user + '!!'
    };
  };
  callback(300, response);
}


//Ping Handler
handlers.ping = (data, callback) => {
  callback(200);
};

//Not Found Handler
handlers.notFound = (data, callback) => {
  callback(404, {
    'Error': 'Route Not Found'
  })
};


//export handlers
module.exports = handlers;