
var crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'base64';
var mysql = require('./../../config/mysql');

exports.render_reg = function(req, res) {
	if (req.params.user_type === 'owner') {
		//show register owner page
		res.render('register_owner', {
			title: 'Register New Owner'
		});
	} else if (req.params.user_type === 'visitor') {
		//show register visitor page
		res.render('register_visitor', {
			title: 'Register New Visitor'
		});
	}
};

exports.render_admin = function(req, res) {
	res.render('admin_console', {
		title: "Admin Console",
		username: req.session.user.username
	});
};

exports.register = function(req, res) {
	//register new owner or visitor
	
};

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
					matchFound = true;
					//create user object and attach to session
					req.session.user = {
						username: username,
						user_type: results[0].user_type
					};
					//navigate to Admin choices page
					res.redirect('/admin_console');
					
				} else {
					console.log("no match");
				}
			} else {
				console.log("user not found");
			}
				
		});
		connection.release();
	}); 
	
};

exports.logout = function(req, res) {
	req.session.user = null;
};


hashPassword = function(password, salt) {
	return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512');
};