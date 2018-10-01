/*
 *
 * 
 * Primary File for the API
 *
 *
 */

var config = require('./config');
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require("string_decoder").StringDecoder;
var fs = require('fs');

 // Instantiating the HTTP Server
var httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Create HTTPS Server Options
httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' :  fs.readFileSync('./https/cert.pem')
};

 // Instantiating the HTTPS Server
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

 // Start HTTP Server and listen to config.port (Config File)
 httpServer.listen(config.httpPort, () => {
  console.log('The Server is up and running now on ' + config.httpPort);
})

 // Start HTTPS Server and listen to config.port (Config File)
 httpsServer.listen(config.httpsPort, () => {
  console.log('The Server is up and running now on ' + config.httpsPort);
})


var unifiedServer = (req, res) => {

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
     var chosenHandler = typeof(router[path]) !== 'undefined' ? router[path] : handlers.notFound;
 
     //construct datahandler 
     var data = {
       'path' : path,
       'querystringObject': QuerystringObject,
       'method': method,
       'headers': headers,
       'payload': buffer,
     };
 
     console.log(buffer);

     //Route Request
     chosenHandler(data, (statusCode, payload) => {
       
       //Default Status Code
       statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
 
       //Default Pyaload
       payload = typeof(payload) == 'object' ? payload : {};
       
       // Convert Payload to String
       var payloadString = JSON.stringify(payload);
 
       //Return Respoonse
       res.setHeader('Content-Type', 'application/json');
       res.writeHead(statusCode);
       res.end(payloadString);
   
       // Log the request path
       console.log('Returning this response: ', statusCode, payloadString);
 
     });
     
   });
 
};

//Define Handlers
var handlers = {};

//Hello Handler
handlers.hello = (data, callback) => {

  //Set Hello message by default
  var response = {
    'message': 'Hello!!'
  };

  //Get the Payload and output - assuming it's the users name
  if (data.method === 'post') {
    var user = data.payload;
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
  callback(404);
};

// Defining a request router
var router = {
  'hello' : handlers.hello,
  'ping' : handlers.ping
}