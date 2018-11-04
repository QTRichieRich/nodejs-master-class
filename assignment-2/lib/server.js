/*
 *
 * 
 * Server Related Tasks
 *
 *
 */


//Dependencies
const config = require('./config');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require("string_decoder").StringDecoder;
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

//Instantiate the server module

const server = {};

// Instantiating the HTTP Server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

// Create HTTPS Server Options
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname, '../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
};

// Instantiating the HTTPS Server
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});




server.unifiedServer = (req, res) => {

  // Parse URL 
  var parsedURL = url.parse(req.url, true);

  // Get path from URL
  var path = parsedURL.pathname.replace(/^\/+|\/+$/g, '');

  // Get Querystring
  var QuerystringObject = parsedURL.query;

  // Get HTTP Method
  var method = req.method.toLowerCase();

  // Get the headers
  var headers = req.headers;

  // Get Payload
  var decoder = new StringDecoder('utf-8');
  var buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    //Choose Handler Request Should go to
    var chosenHandler = typeof (server.router[path]) !== 'undefined' ? server.router[path] : handlers.notFound;

    //construct datahandler 
    const data = {
      'path': path,
      'querystringObject': QuerystringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer),
    };

    console.log(buffer);

    //Route Request
    chosenHandler(data, (statusCode, payload) => {

      //Default Status Code
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      //Default Pyaload
      payload = typeof (payload) == 'object' ? payload : {};

      // Convert Payload to String
      const payloadString = JSON.stringify(payload);

      //Return Respoonse
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Returning this response: ', statusCode, payloadString);

    });

  });

};

// Defining a request router
server.router = {
  'hello': handlers.hello,
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
}

// Init
server.init = () => {
  //Start HTTP Server
  // Start HTTP Server and listen to config.port (Config File)
  server.httpServer.listen(config.httpPort, () => {
    console.log('The Server is up and running now on ' + config.httpPort);
  })

  // Start HTTPS Server and listen to config.port (Config File)
  server.httpsServer.listen(config.httpsPort, () => {
    console.log('The Server is up and running now on ' + config.httpsPort);
  })
}

module.exports = server;