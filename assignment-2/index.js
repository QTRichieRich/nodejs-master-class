/*
 *
 * 
 * Primary File for the API
 *
 *
 */

//Dependensice

const server = require('./lib/server');
// const workers = require('./lib/workers');


//Declare App

var app = {};

// Init
app.init = function () {

  //Start Server
  server.init();

  //Start Workers
  workers.init();

}

//Execute
app.init();

module.exports = app;