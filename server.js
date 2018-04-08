
process.env.NODE_ENV = process.env.NODE_ENV || 'development'; //set dev as default environment.

var express = require('./config/express');


var app = express(); //calls express as s function that returns the app instance.


app.listen(8080);
console.log("Server running at http://localhost:8080");

module.exports.app = app;
