
var crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'base64';
var mysql = require('./../../config/mysql');
var property = require('./../models/property');

exports.render_reg = function(req, res, next) {
	if (req.query.user_type === 'Owner') {
		//show register owner page
		//load list of property items
		var query = "SELECT * FROM property_item WHERE is_approved = ? " +
			"ORDER BY item_type, item_name";
		var params = true;
		var items;
		runQuery(query, params, (error, results, fields) => {
			if (error) {
				return next(error);
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

exports.render_main_owner = function(req, res, next) {
	//get list of this owner's properties, joined
	//with their ratings, and send to main owner page
	var search = '';
	var searchterm = '';
	if (req.body.searchattribute != undefined && req.body.searchattribute != '') {
		search = "AND " + req.body.searchattribute + " LIKE ? ";
		if (req.body.searchterm != undefined && req.body.searchterm != '') {
			searchterm = "%" + req.body.searchterm + "%";
		}
	}
	var query = "SELECT id, name, property_type, " +
	"size, is_commercial, is_public, " +
	"street, city, zip, AVG(visit.rating) as rating, COUNT(visit.rating) as visits " +
	"FROM property LEFT OUTER JOIN visit ON property.id=visit.property_id " +
	"WHERE owner = ? ";
	if (req.body.searchterm != '') {
		query = query + search;
	}
	query = query + "GROUP BY id";

	var params;

	if (req.body.searchterm != '') {
		params = [req.session.user.username, searchterm];
	} else {
		params = [req.session.user.username];
	}

	runQuery(query, params, (error, results, fields) => {
		if (error) {
			return next(error);
		}
		res.render('owner_main', { username: req.session.user.username,
			results: results });
	});
	
};

exports.render_main_visitor = function(req, res, next) {

	
};

exports.render_main_admin = function(req, res, next) {
	res.render('admin_main', { username: req.session.user.username });
	
};

exports.render_add_property = function(req, res, next) {
	//load list of property items
	var query = "SELECT * FROM property_item WHERE is_approved = ? " +
		"ORDER BY item_type, item_name";
	var params = true;
	var items;
	runQuery(query, params, (error, results, fields) => {
		if (error) {
			return next(error);
		}
		if (results.length > 0) {
			items = results;
		}
		res.render('add_property', { username: req.session.user.username,
			items});
	});
};

exports.render_view_other_properties = function(req, res, next) {
	var query = "SELECT * FROM property WHERE owner <> ? AND approved_by IS NOT NULL";
	runQuery(query, [req.session.user.username], (error, results, fields) => {
		if (error) { return next(error); }
		res.render("owner_view_other_properties", { username: req.session.user.username,
			results: results });
	})
};

exports.search_other_properties = function(req, res, next) {
	var query = build_search_query(req, false);
	var params;

	if (req.body.searchterm != '') {
		params = [req.session.user.username, searchterm];
	} else {
		params = [req.session.user.username];
	}

	runQuery(query, params, (error, results, fields) => {
		if (error) {
			return next(error);
		}
		res.render('owner_view_other_properties', { username: req.session.user.username,
			results: results });
	});

}

exports.manage_property = function(req, res, next) {
	var id = req.query.id;
	if (id != '') {
		//load manage_property page with this property's info
		var info; //property information
		var prop_items; //property_has items
		var items; //all approved property items
		var query = "SELECT * from property WHERE id = ?"
		runQuery(query, [id], (error, results, fields) => {
			if (error) { return next(error); }
			if (results) {
				info = results;
				var nextQuery = "SELECT item_name from property_has WHERE property_id = ?";
				runQuery(nextQuery, [id], (err, records, f) => {
					if (err) { return next(err); }
					if (records) {
						prop_items = records;
					}
				
					var lastQuery = "SELECT * FROM property_item WHERE is_approved = ?";
					runQuery(lastQuery, [true], (e, r, f) => {
						if (e) { return next(e); }
						if (r) {
							items = r;
						}
						var request_response = '';
						if (req.request_response) {
							request_response = req.request_response;
						}
						res.render('manage_property', { request_response: request_response, info, prop_items, items });						
					});
				});
			}

		});
	}
};

exports.save_property_changes = function(req, res, next) {
	var query = "UPDATE property SET name = ?, size = ?, is_commercial = ?, " +
		"is_public = ?, street = ?, city = ?, zip = ? " +
		"WHERE id=?";
	runQuery(query, [req.body.propname, req.body.propacres, 
		convert_to_boolean(req.body.is_commercial),
		convert_to_boolean(req.body.is_public), 
		req.body.propaddress, req.body.propcity, req.body.propzip,
		req.query.id],
		(error, results, fields) => {
			if (error) { return next(error); }
			res.redirect("/main/" + req.session.user.user_type);
		});
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
				req.body.propzip, req.body.proptype, req.session.user.username]];		
				
				connection.query(insertProp, [insertPropParams], function(err, results, fields) {
					if (err) { 
						connection.rollback(function() {
							return next(err);
						});
					}
					//results should contain the new property id.
					var propId;
					try {
						propId = results.insertId;
					} catch (e) {
						connection.rollback(function() {
							return next(new Error("Insert property failed. Query: " + insertProp +
							" Params: " + [insertPropParams]));
						});
					}
					
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
						});
					});
				});
			 });
		});	
	}
	res.redirect('main/' + req.session.user.user_type);
};


exports.login = function(req, res, next) {
	var email = req.body.email;
	var password = req.body.password;
	
	//first, see if the user is in the db.
	var query = "SELECT * from user WHERE email = ?";
	runQuery(query, [email], (error, results, fields) => {
			if (error) {
				return next(new Error('Error querying database: ' + error.message));
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
					//user is now 'logged in'
					req.session.user = {
						username: results[0].username,
						user_type: results[0].user_type
					};
					
					res.redirect('main/' + results[0].user_type);
				} else {
					return next(new Error("Invalid username/password."));
				}
			} else {
				return next(new Error("Invalid username/password."));
			}
	});
	//next();
};

exports.request_item = function(req, res, next) {
	var propId = req.query.id;
	var property_type = req.query.type;
	var item_type = '';
	switch (property_type) {
		case 'Farm':
			item_type = req.body.farm_item_type;
			break;
		case 'Garden':
			item_type = req.body.garden_item_type;
			break;
		case 'Orchard':
			item_type = req.body.orchard_item_type;
			break;
		default:
			break;
	}
	var query = "INSERT INTO property_item (item_name, item_type, is_approved) " +
		"values (?,?,?)";
	runQuery(query, [req.body.item_name, item_type, false], (error, results, fields) => {
		if (error) { return next(error); }
		res.redirect("/manageProperty?id=" + propId);
	})
}

exports.add_property_item = function(req, res, next) {
	var query = "INSERT INTO property_has values ?";
	var propId = req.query.id;
	var propItems = [];
	switch (req.query.type) {
		case 'Farm':
			if (req.body.animal != 'None') { propItems.push([propId, req.body.animal]); }
			if (req.body.farmcrop != 'None') { propItems.push([propId, req.body.farmcrop]); }
			break;
		case 'Garden':
			if (req.body.gardencrop != 'None') { propItems.push([propId, req.body.gardencrop]); }
			break;
		case 'Orchard':
			if (req.body.orchardcrop != 'None') { propItems.push([propId, req.body.orchardcrop]); }
			break;
		default:
			break;
	}
	if (propItems.length > 0) {
		runQuery(query, [propItems], (error, results, fields) => {
			if (error) { return next(error); }
			res.redirect("/manageProperty?id=" + propId);
		});

	}
};

exports.delete_property_item = function (req, res, next) {
	var propId = req.query.id;
	var item_name = req.query.item_name;
	var query = "DELETE FROM property_has WHERE property_id = ?" +
		" AND item_name = ?";
	runQuery(query, [propId, item_name], (error, results, fields) => {
		if (error) { return next(error); }
		res.redirect("/manageProperty?id=" + propId);
	})
};

exports.render_property_details = function(req, res, next) {
	var query1 = "SELECT property.id, property.name, property.size, property.is_commercial," +
	" property.is_public, property.street, property.city, property.zip," +
	" property.property_type, property.owner, user.email, " +
	" AVG(visit.rating) as rating, COUNT(visit.rating) as visits " +
	" from property, user, visit where user.username = property.owner " +
	" and visit.property_id = property.id and property.id = ?";
	var query2 = "SELECT item_name, item_type from property_has natural join" +
	" property_item where property_id = ? group by item_type";
	runQuery(query1, [req.query.id], (error, results, fields) => {
		if (error) { return next(error); }
		runQuery(query2, [req.query.id], (e, items, fields) => {
			if (e) { return next(e); }
			res.render("property_details", {results: results, items: items});
		});
	});
};

exports.view_visitors = function(req, res, next) {
	var query = "Select user.username, user.email, count(visit.username) as num_visits " +
	"from user left join visit on visit.username = user.username " +
	"where user.user_type = 'Visitor' " +
	"group by user.username";
	runQuery(query, [], (error, results, fields) => {
		if (error) { return next(error); }
		res.render('view_visitors', {results: results} );
	});

};

exports.view_owners = function(req, res, next) {
	var query = "Select user.username, user.email, count(property.owner) as num_props " +
	"from user left join property on property.owner = user.username " +
	"where user.user_type = 'Owner' " +
	"group by user.username";
	runQuery(query, [], (error, results, fields) => {
		if (error) { return next(error); }
		res.render('view_owners', {results: results} );
	});	
}

exports.delete_visitor = function(req, res, next) {
	var query = "DELETE FROM user WHERE username = ?";
	runQuery(query, [req.query.username], (error, results, fields) => {
		if (error) { return next(error); }
		res.redirect('/viewVisitors');
	});
};

exports.delete_owner = function(req, res, next) {
	var query = "DELETE FROM user WHERE username = ?";
	runQuery(query, [req.query.username], (error, results, fields) => {
		if (error) { return next(error); }
		res.redirect('/viewOwners');
	});
};

exports.delete_visits = function(req, res, next) {
	var query = "DELETE FROM visit WHERE username = ?";
	runQuery(query, [req.query.username], (error, results, fields) => {
		if (error) { return next(error); }
		res.redirect('/viewVisitors');
	});	
};

exports.search_visitors = function(req, res, next) {
	
	var	query = "Select user.username, user.email, count(visit.username) as num_visits " +
		"from user left join visit on visit.username = user.username " +
		"where user.user_type = 'Visitor' and ";
	switch (req.body.searchattribute) {
		case 'Username' :
			query += "user.username";
			break;
		case 'Email':
			query += "user.email";
			break;
		default:
			break;
	}
	query += " LIKE ? group by user.username";
	var searchterm = "%" + req.body.searchterm + "%";
	runQuery(query, [searchterm], (error, results, fields) => {
		res.render('view_visitors', {results: results} );
	});
};

exports.search_owners = function(req, res, next) {
	
	var	query = "Select user.username, user.email, count(property.owner) as num_props " +
		"from user left join property on property.owner = user.username " +
		"where user.user_type = 'Owner' and ";
	switch (req.body.searchattribute) {
		case 'Username' :
			query += "user.username";
			break;
		case 'Email':
			query += "user.email";
			break;
		default:
			break;
	}
	query += " LIKE ? group by user.username";
	var searchterm = "%" + req.body.searchterm + "%";
	runQuery(query, [searchterm], (error, results, fields) => {
		res.render('view_owners', {results: results} );
	});
};

exports.logout = function(req, res) {
	req.session.user = null;
	res.redirect("/");
	
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
			 throw (new Error("Error connecting to MySql: " + err.message));
		} else {
			connection.query(query, params, resultHandler);
		}
		connection.release();
	});
};

convert_to_boolean = function(value) {
	return (value == 'Yes' ? true : false);
};

build_search_query = function(req, is_owner) {
	var search = '';
	var searchterm = '';
	var approved = '';
	var op = "=";
	if (req.body.searchattribute != undefined && req.body.searchattribute != '') {
		search = "AND " + req.body.searchattribute + " LIKE ? ";
		if (req.body.searchterm != undefined && req.body.searchterm != '') {
			searchterm = "%" + req.body.searchterm + "%";
		}
	}
	var query = "SELECT id, name, property_type, " +
	"size, is_commercial, is_public, " +
	"street, city, zip, AVG(visit.rating) as rating, COUNT(visit.rating) as visits " +
	"FROM property LEFT OUTER JOIN visit ON property.id=visit.property_id " +
	"WHERE owner ";
	if (!is_owner) {
		op = "<>";
		approved = "AND approved_by IS NOT NULL";
	}
	query += op + " ?" + approved;

	if (req.body.searchterm != '') {
		query = query + search;
	}
	query = query + ", GROUP BY id";
	return query;
};
