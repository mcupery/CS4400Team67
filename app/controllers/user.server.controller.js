
var crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'base64';
var mysql = require('./../../config/mysql');

exports.render_reg = function(req, res) {
	if (req.query.user_type === 'Owner') {
		//show register owner page
		//get list of property items
		var query = "SELECT * FROM property_item WHERE is_approved = ? " +
			"ORDER BY item_type, item_name";
		var params = true;
		var items;
		runQuery(query, params, (error, results, fields) => {
			if (error) {
				res.status(422)
					.send({ errors: 'Error querying database: ' + error.message });
				return console.error("Query error: " + error.message);
			}
			console.log(results);
			if (results.length > 0) {
				items = results;
			}
			res.render('owner_reg', {items});
		});

		
	} else if (req.query.user_type === 'Visitor') {
		//show register visitor page
		res.render('visitor_reg', {});
	}
};

exports.render_main = function(req, res) {
	var user_type = req.query.user_type;
	switch(user_type) {
		case 'Admin':  	res.render('admin_console', {
			title: "Admin Console",
			username: req.session.user.username
		});
		break;
			
	}

};

exports.register = function(req, res) {
	//register new owner or visitor
	var user_type = req.query.user_type;
	var saltvalue = crypto.randomBytes(8).toString('base64');
	var pwd = hashPassword('1234567!', saltvalue);
	console.log('salt: ' + saltvalue);
	console.log('2:' + pwd);
};

exports.login = function(req, res) {
	var email = req.body.email;
	var password = req.body.password;
	
	//first, see if the user is in the db.
	var query = "SELECT * from user WHERE email = ?";
	runQuery(query, [email], (error, results, fields) => {
			if (error) {
				res.status(422)
					.send({ errors: 'Error querying database: ' + error.message });
				return console.error("Query error: " + error.message);
			}
			console.log(results);
			if (results.length === 1) {
				var salt = results[0].salt;
				var pwd = hashPassword(password, salt);
				console.log('hashed pwd:' + pwd);
				if (pwd === results[0].password) {
					//username and password match
					matchFound = true;
					//create user object and attach to session
					req.session.user = {
						username: results[0].username,
						user_type: results[0].user_type
					};
					
					res.redirect('main?user_type=' + results[0].user_type);
					
				} else {
					res.status(422)
						.send({ errors: 'Invalid username/password'});
					console.log("no match");
				}
			} else {
				res.status(422)
					.send({ errors: 'Invalid username/password'});
				console.log("user not found");
			}
				
		});
};


exports.logout = function(req, res) {
	req.session.user = null;
	
};


hashPassword = function(password, salt) {
	return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512');
};


runQuery = function(query, params, resultHandler) {
	var dbpool = mysql();  //gets a reference to the connection pool.
	var result;
	console.log("Query says: " + query);
	console.log("params says: " + params);
	dbpool.getConnection(function(err, connection) {
		if (err) {
			result = "Error connecting to MySql: " + err.message;
		} else {
			connection.query(query, [params], resultHandler);
		}
		connection.release();
	});
}