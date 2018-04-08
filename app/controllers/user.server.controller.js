
var crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'base64';
var mysql = require('./../../config/mysql');

exports.login = function(req, res) {
	console.log("username: " + req.body.username);
	var username = req.body.username;
	var password = req.body.password;
	var matchFound = false;
	
	//first, see if the username is in the db.
	var dbpool = mysql();  //gets a reference to the connection pool.
	var query = "SELECT * from user WHERE username = ?";
	dbpool.getConnection(function(err, connection) {
		if (err) {
			console.error("Connection error: " + err.message);
			return;
		}
		connection.query(query, [username], (error, results, fields) => {
			if (error) {
				return console.error("Query error: " + error.message);
			}
			console.log(results);
			if (results.length === 1) {
				var salt = results[0].salt;
				var pwd = hashPassword(password, salt);
				
				if (pwd === results[0].password) {
					//username and password match
					res.render('admin_console', {
						title: 'Admin Console',
						username: username 
					});
					
				} else {
					console.log("no match");
				}
			} else {
				console.log("user not found");
			}
				
		});
		connection.release();
	}); 
	
}

hashPassword = function(password, salt) {
	return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512');
};