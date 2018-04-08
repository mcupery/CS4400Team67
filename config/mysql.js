
var config = require('./config'),
	mysql = require('mysql'),
	dbpool = null;
	
module.exports = function() {
	//create a connection pool to mysql.
	if (!dbpool) {
		dbpool = mysql.createPool(config.db);
	}
	//return the pool object
	return dbpool;
};