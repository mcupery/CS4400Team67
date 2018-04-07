//this is where we configure all the options for express.
var express = require('express');

module.exports = function() {
	var app = express();
	require('../app/routes/index.server.routes.js')(app);
	return app;
};