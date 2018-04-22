
var crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'base64';
var mysql = require('./../../config/mysql');
var property = require('./../models/property');
var basePropQuery = "Select * From (" +
	"select property.id, property.name, property.size, property.is_commercial, " +
	"property.is_public, property.street, property.city, property.zip, " +
	"property.property_type, property.owner, property.approved_by, "+
	"count(visit.property_id) as num_visits, avg(visit.rating) as avg_rating " +
	"from property left outer join visit " +
	"on visit.property_id=property.id " +
	"group by property.id) as props ";

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
	var search = {searchphrase: '', searchparam:'' };
	
	var query = basePropQuery +	"WHERE owner = ? ";
	build_search_clause(search, req, "AND");
	if (search.searchphrase != '') {
		query = query + search.searchphrase;
	}

	var params;

	if (search.searchparam != '') {
		params = [req.session.user.username, search.searchparam];
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
	//get list of this confirmed, public properties, joined
	//with their ratings, and send to main visitor page
	var search = {searchphrase: '', searchparam:'' };
	
	var query = basePropQuery +	"WHERE is_public = true AND approved_by IS NOT NULL ";
	build_search_clause(search, req, "AND");
	if (search.searchphrase != '') {
		query = query + search.searchphrase;
	}

	var params;

	if (search.searchparam != '') {
		params = [search.searchparam];
	} else {
		params = [];
	}

	runQuery(query, params, (error, results, fields) => {
		if (error) {
			return next(error);
		}
		res.render('visitor_main', { username: req.session.user.username,
			results: results });
	});
	
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
	var query = basePropQuery + "where owner <> ? and approved_by is not null";
	runQuery(query, [req.session.user.username], (error, results, fields) => {
		if (error) { return next(error); }
		res.render("owner_view_other_properties", { username: req.session.user.username,
			results: results });
	})
};

exports.view_approved_properties = function(req, res, next) {
	//get list of all owners' properties that have been approved, joined
	//with their ratings, and send to confirmed properties page
	var query = basePropQuery +	"WHERE approved_by IS NOT NULL ";
	var search = {searchphrase: '', searchparam: ''};
	build_search_clause(search, req, "AND");
	if (search.searchphrase != '') {
		query = query + search.searchphrase;
	}
	var params;

	if (search.searchparam != '') {
		params = [search.searchparam];
	} else {
		params = [];
	}

	runQuery(query, params, (error, results, fields) => {
		if (error) {
			return next(error);
		}
		res.render('view_approved_properties', { results: results });
	});
	
};

exports.search_other_properties = function(req, res, next) {
	var search = { searchphrase: '', searchparam: ''};
	var query = build_owner_query(search, req, false);
	if (search.searchphrase != '') {
		query = query + " " + search.searchphrase;
	}
	var params;

	if (search.searchparam != '') {
		params = [req.session.user.username, search.searchparam];
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
	var user_type = req.session.user.user_type;
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
						if (user_type === 'Owner') {
							res.render('manage_property', { request_response: request_response, info, prop_items, items });
						} else {
							res.render('manage_pending_property',  { request_response: request_response, info, prop_items, items })
						}

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
		convert_to_boolean(req.body.is_commercial), convert_to_boolean(req.body.is_public), 
		req.body.propaddress, req.body.propcity, req.body.propzip,
		req.query.id],
		(error, results, fields) => {
			if (error) { return next(error); }
			deleteVisitsForProperty(req.query.id);
			res.redirect("/main/" + req.session.user.user_type);
		});
};

exports.save_pending_property_changes = function(req, res, next) {
	var query = "UPDATE property SET name = ?, size = ?, is_commercial = ?, " +
		"is_public = ?, street = ?, city = ?, zip = ?, " +
		"approved_by = ? " +
		"WHERE id=?";
		
	runQuery(query, [req.body.propname, req.body.propacres, 
		convert_to_boolean(req.body.is_commercial),
		convert_to_boolean(req.body.is_public), 
		req.body.propaddress, req.body.propcity, req.body.propzip,
		req.session.user.username,
		req.query.id],
		(error, results, fields) => {
			if (error) { return next(error); }
			deleteVisitsForProperty(req.query.id, next);
			console.log(req.url);
			if (req.url.includes('managePendingProperty')) {
				res.redirect('/viewPendingProperties');
			} else {
				res.redirect('/viewApprovedProperties');
			}
		});
};

deleteVisitsForProperty = function(id, next) {
	var query = "DELETE FROM visit where property_id = ?";
	runQuery(query, [id], (error, results, fields) => {
		if (error) { return next(error); }
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
				var is_commercial = convert_to_boolean(req.body.is_commercial);
				var is_public = convert_to_boolean(req.body.is_public);
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
	if (item_type != 'None' && req.body.item_name.trim() != '') {
		var query = "INSERT INTO property_item (item_name, item_type, is_approved) " +
		"values (?,?,?)";
		runQuery(query, [req.body.item_name, item_type, false], (error, results, fields) => {
			if (error) { return next(error); }
			res.redirect("/manageProperty?id=" + propId);
		});
	} else {
		res.redirect("/manageProperty?id=" + propId);
	}

};

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

	} else {
		res.redirect("/manageProperty?id=" + propId);
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
	" AVG(visit.rating) as avg_rating, COUNT(visit.rating) as num_visits " +
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

exports.view_visit_property = function(req, res, next) {
	//first check to see if user has already visited the property.
	var query0 = "SELECT * from visit where property_id = ? and username = ?";
	var render_view = "visit_property";
	runQuery(query0, [req.query.id, req.session.user.username], (err, record, f) => {
		if (record) {
			if (record.length > 0){
				//user has visited this property already.
				render_view = "unvisit_property";
			}
		}	
		var query1 = "SELECT property.id, property.name, property.size, property.is_commercial," +
		" property.is_public, property.street, property.city, property.zip," +
		" property.property_type, property.owner, user.email," +
		" AVG(visit.rating) as avg_rating, COUNT(visit.rating) as num_visits" +
		" from property, user, visit where" +
		" visit.property_id = property.id and property.id = ?";
		var query2 = "SELECT item_name, item_type from property_has natural join" +
		" property_item where property_id = ? group by item_type";
		runQuery(query1, [req.query.id], (error, results, fields) => {
			if (error) { return next(error); }
			runQuery(query2, [req.query.id], (e, items, fields) => {
				if (e) { return next(e); }
				res.render(render_view, {results: results, items: items});
			});
		});
	});
};

exports.submit_visit = function(req, res, next) {
	var query = "INSERT into visit (username, property_id, rating) " +
		"values(?,?,?)";
	runQuery(query, [req.session.user.username, req.query.id, req.body.rating],
		(error, results, fields) => {
		if (error) { return next(error); }
		res.redirect('/main/Visitor');
	});
};

exports.remove_visit = function(req, res, next) {
	var query = "DELETE FROM visit where username = ? and property_id = ?";
	runQuery(query, [req.session.user.username, req.query.id],
		(error, results, fields) => {
		if (error) { return next(error); }
		res.redirect('/main/Visitor');
	});	
};

exports.view_visit_history = function(req, res, next) {
	var query = "SELECT visit.username, visit.property_id, visit.visit_date, " +
	"visit.rating, property.name from visit, property " +
		"WHERE visit.username = ? and property.id = visit.property_id";
		runQuery(query, [req.session.user.username],
			(error, results, fields) => {
			if (error) { return next(error); }
			res.render('view_visit_history', { results: results});
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
};

exports.view_approved_items = function(req, res, next) {
	var query = "SELECT * from property_item WHERE is_approved = true";
	runQuery(query, [], (error, results, fields) => {
		if (error) { return next(error); }
		res.render('view_approved_items', { results: results });
	})
};

exports.view_pending_items = function(req, res, next) {
	var query = "SELECT * from property_item WHERE is_approved = false";
	runQuery(query, [], (error, results, fields) => {
		if (error) { return next(error); }
		res.render('view_pending_items', { results: results });
	})
};

exports.view_pending_properties = function(req, res, next) {
	var query = "SELECT * from property WHERE approved_by IS NULL";
	runQuery(query, [], (error, results, fields) => {
		if (error) { return next(error); }
		res.render('view_pending_properties', { results: results });
	})
};

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

exports.delete_approved_item = function(req, res, next) {
	var query = "DELETE FROM property_item WHERE item_name = ?";
	runQuery(query, [req.query.item_name], (error, results, fields) => {
		if (error) { return next(error); }
		res.redirect('/viewApprovedItems');
	});	
};

exports.delete_pending_item = function(req, res, next) {
	var query = "DELETE FROM property_item WHERE item_name = ?";
	runQuery(query, [req.query.item_name], (error, results, fields) => {
		if (error) { return next(error); }
		res.redirect('/viewPendingItems');
	});	
};

exports.delete_property = function(req, res, next) {

	var query = "DELETE FROM property WHERE id = ?";
	runQuery(query, [req.query.id], (error, results, fields) => {
		if (error) { return next(error); }
		if (req.session.user.user_type === 'Owner') {
			res.redirect('/main/Owner');
		} else {
			res.redirect('/viewPendingProperties');
		}
	});	
};

exports.approve_pending_item = function(req, res, next) {
	var query = "UPDATE property_item SET is_approved = true WHERE item_name = ?";
	runQuery(query, [req.query.item_name], (error, results, fields) => {
		if (error) { return next(error); }
		res.redirect('/viewPendingItems');
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


exports.search_approved_items = function(req, res, next) {
	
	var	query = "Select * from property_item where is_approved = true and ";
	switch (req.body.searchattribute) {
		case 'Name' :
			query += "item_name";
			break;
		case 'Type':
			query += "item_type";
			break;
		default:
			break;
	}
	query += " LIKE ?";
	var searchterm = "%" + req.body.searchterm + "%";
	runQuery(query, [searchterm], (error, results, fields) => {
		res.render('view_approved_items', {results: results} );
	});
};

exports.add_approved_item = function(req, res, next) {
	if (req.body.typeattribute != 'None') {
		var query = "INSERT INTO property_item values (?,?,?)";
		runQuery(query, [req.body.item_to_add, req.body.typeattribute, true],
		(error, results, fields) => {
			if (error) { return next(error); }
			res.redirect('/viewApprovedItems');
		});
	} else {
		res.redirect('/viewApprovedItems');
	}
};

exports.search_pending_properties = function(req, res, next) {
	
	var	query = "Select * from property where approved_by IS NULL and ";
	var searchby = req.body.searchattribute.toLowerCase();
	var searchterm = '';
	if (searchby == 'public' || searchby == 'commercial') {
		searchby = "is_" + searchby;
	} else if (searchby == 'type') {
		searchby = 'property_type';
	}
	if (req.body.searchterm.toLowerCase() == "true" || req.body.searchterm.toLowerCase() == "false") {
		query += searchby + " = " + req.body.searchterm.toLowerCase();
	} else {
		query += searchby + " LIKE ?";
		searchterm = "%" + req.body.searchterm + "%";
	}

	runQuery(query, [searchterm], (error, results, fields) => {
		res.render('view_pending_properties', {results: results} );
	});
};

exports.logout = function(req, res) {
	req.session.user = null;
	res.redirect("/");
	
};


hashPassword = function(password, salt) {
	return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512');
};

convert_to_boolean = function(value) {
	if (value.toLowerCase() == 'true' || value.toLowerCase() == 'yes') {
		return true;
	}
	return false;
}
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


build_owner_query = function(search, req, is_owner) {
	var searchterm = '';
	var approved = '';
	var op = "=";
	
	build_search_clause(search, req, "AND");

	var query = basePropQuery +	"WHERE owner ";
	if (!is_owner) {
		op = "<>";
		approved = "AND approved_by IS NOT NULL";
	}
	query += op + " ? " + approved;

	return query;
};

build_search_clause = function(search, req, conjunction) {
	//conjunction = AND, WHERE, OR
	//search = { searchphrase: '', searchparam: ''}
	var searchterm = '';

	if (req.body.searchterm) {
		searchterm = req.body.searchterm.trim();
		if (req.body.searchattribute) {
			var searchattribute = req.body.searchattribute.toLowerCase();
			if (searchattribute != '' && searchterm != '') {
				if (searchattribute != 'public' && searchattribute != 'commercial' && searchattribute != 'visits'
					&& searchattribute != 'verified by' && searchattribute != 'avg rating') {
						search.searchphrase = conjunction + " " + searchattribute + " LIKE ? ";
						search.searchparam = "%" + searchterm + "%";
				} else if (searchattribute == 'public' || searchattribute == 'commercial') {
					search.searchphrase = conjunction + " is_" + searchattribute + " = " + convert_to_boolean(searchterm) + " ";
					search.searchparam = '';
				} else if (searchattribute == 'verified by') {
					search.searchphrase = conjunction + " approved_by LIKE ? ";
					search.searchparam = "%" + searchterm + "%";
				} else if (searchattribute == 'avg rating' || searchattribute == 'visits') {
					searchterm = searchterm.replace("-", " AND ");
					searchterm = searchterm.replace(" to ", " AND ");
					if (searchattribute == 'avg rating') { 
						searchattribute = "avg_rating"; 
					} else { 
						searchattribute = 'num_visits';
					}
					var op = "=";
					if (searchterm.includes(" AND ")) {
						op = " BETWEEN "
					}
					search.searchphrase = conjunction + " " + searchattribute + op + searchterm;
					search.searchparam = '';
				}
			}
		}
	}
		
}
