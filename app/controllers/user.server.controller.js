
var crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'base64';
var mysql = require('./../../config/mysql');
var property = require('./../models/property');

exports.render_reg = function(req, res) {
	if (req.query.user_type === 'Owner') {
		//show register owner page
		//load list of property items
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

exports.checkuser = function(req, res, next) {
	//register new owner or visitor
	console.log(req.body);

	//first, make sure user does not already exist in user table.
	var uquery = "SELECT * FROM user WHERE username = ? OR email = ?";
	runQuery(uquery, [req.body.username, req.body.email], (error, results, fields) => {
		if (error) { return next(error); }
		if (results.length > 0) {
			return next(new Error("Username or email already exists."));
		}
		next();
	});
};

exports.checkProperty = function(req, res, next) {
	if (req.query.user_type != 'Visitor') {
		//make sure the property to add does not already exist.
		var query = "SELECT name from property WHERE name = ?";
		runQuery(query, [req.body.propname], (error, results, fields) => {
			if (error) { return next(error); }
			if (results != null && results.length > 0) {
				next(new Error("The property name you want to use is already taken."));
			}
		});
	}
	next();
};

exports.register = function(req, res, next) {
		//user does not already exist, and property name is OK.  Add user.
		var user_type = req.query.user_type;
		var saltvalue = crypto.randomBytes(8).toString('base64');
		var pwd = hashPassword(req.body.password, saltvalue);		
		var addQuery = "INSERT INTO user (username, email, password, salt, user_type)" +
			"values(?,?,?,?,?)";
		runQuery(addQuery, 
			[req.body.username, req.body.email, pwd, saltvalue, user_type],
			(error, results, fields) => {
				if (error) { return next(error); }
				//if no error, consider the user 'logged in'
				req.session.user = {
					username: req.body.username,
					user_type: req.query.user_type
				};
				next();
			}); 
};

exports.addProperty = function(req, res, next) {
	if (req.query.user_type != 'Visitor') {
		// add new property and new animal/crop
		// both must succeed, so wrap in transaction
		var dbpool = mysql();
		var connection = dbpool.getConnection(function(err, connection) {
			if (err) { return next(err); } 
			
			/* Begin transaction */
			connection.beginTransaction(function(err) {
				if (err) { return next(err); }
				var insertProp = "INSERT INTO property(name, size, is_commercial, is_public," +
					"street, city, zip, property_type, owner) " +
					"values ?";
				var is_commercial = (req.body.is_commercial === 'Yes') ? true : false;
				var is_public = (req.body.is_public === 'Yes') ? true : false;
				var insertPropParams = [[req.body.propname, req.body.propacres, 
				is_commercial, is_public, req.body.propaddress, req.body.propcity,
				req.body.propzip, req.body.proptype, req.body.username]];				
				connection.query(insertProp, [insertPropParams], function(err, results, fields) {
					if (err) { 
						connection.rollback(function() {
							return next(err);
						});
					}
					if (results === undefined) {
						connection.rollback(function() {
							return next(new Error("Insert property failed."));
						});
					}
					console.log(results);
					//results should contain the new property id.
					var propId = results.insertId;
					var insertPropHas = "INSERT INTO property_has(property_id, item_name) " +
						"values ?";
					var propItems = [];
					switch (req.body.proptype) {
						case 'Farm':
							propItems.push([propId, req.body.animal]);
							propItems.push([propId, req.body.farmcrop]);
							break;
						case 'Garden':
							propItems.push([propId, req.body.gardencrop]);
							break;
						case 'Orchard':
							propItems.push([propId, req.body.orchardcrop]);
							break;
					}
					connection.query(insertPropHas, [propItems], function(err, result) {
						if (err) { 
							connection.rollback(function() {
								return next(err);
							});
						}  
						connection.commit(function(err) {
							if (err) { 
								connection.rollback(function() {
									return next(err);
								});
							}
							console.log('Transaction Complete.');
							connection.release();
							//open the next page for the owner
							res.end();
						});
					});
				});
			 });
		});	
	} else {
		//open the next page for the visitor
		res.end();
	}
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
			connection.query(query, params, resultHandler);
		}
		connection.release();
	});
}

sendError = function(res, error, message) {
	res.status(422)
	.send({ errors: message + ' ' + error.message });
	return console.error("Query error: " + error.message);
}