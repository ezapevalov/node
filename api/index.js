/*
 * Primary file for the API
 *
 */

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

var serverFunction = function(request, response) {
    var parsed_url = url.parse(request.url, true);
    var path = parsed_url.pathname.replace(/^\/+|\/+$/g, '');
    var method = request.method.toLowerCase();
    var queryStringObject = parsed_url.query;
    var headers = request.headers;
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    request.on('data', function(data) {
        buffer += decoder.write(data);
    });

    request.on('end', function() {
        buffer += decoder.end();

        const chosenHandler = typeof (router[path]) !== 'undefined' ? router[path] : handlers.notFound;

        var data = {
            'path' : path,
            'query' : queryStringObject,
            'method' : method,
            'header' : headers,
            'payload' : buffer
        };

        chosenHandler(data, function (statusCode, payload) {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};

            var payloadJSON = JSON.stringify(payload);

            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.writeHead(statusCode);
            response.end(payloadJSON);

            console.log("Response: ", statusCode, payloadJSON);
        });
    });
};

var httpServer = http.createServer(serverFunction);

httpServer.listen(config.httpPort, function() {
    console.log(`The HTTP server is listening on port ${config.httpPort} in ${config.envName} mode`);
});

var httpsServerOptions = {
    key : fs.readFileSync('./https/key.pem'),
    sert : fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, function(request, response) {
    serverFunction(request, response);
});

httpsServer.listen(config.httpsPort, function() {
    console.log(`The HTTPS server is listening on port ${config.httpsPort} in ${config.envName} mode`);
});

var handlers = {};

handlers.ping = function(data, callback) {
    callback(200);
};

handlers.hello = function(data, callback) {
    let status = 200;
    let response = {
        message: "Hello, World!",
    };

    callback(status, response);
};

handlers.notFound = function(data, callback) {
    callback(404);
};

var router = {
    'ping' : handlers.ping,
    'hello': handlers.hello
};