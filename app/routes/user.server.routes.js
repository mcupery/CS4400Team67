
module.exports = function(app) {
	var user = require('../controllers/user.server.controller');
	app.route('/').post(user.login);
	app.route('/register').get(user.render_reg)
						  .post(user.checkuser, user.checkProperty, 
							user.register, user.addProperty);
	app.route('/main/Owner').get(user.render_main_owner)
							.post(user.render_main_owner);
	app.route('/main/Admin').get(user.render_main_admin);
	app.route('/main/Visitor').get(user.render_main_visitor);
	app.route('/addProperty').get(user.render_add_property)
							.post(user.checkProperty, user.addProperty);
	app.route('/manageProperty').get(user.manage_property);
	//app.route('/viewProperties').get(user.render_view_properties);
	app.route('/requestItem').post(user.request_item);
	app.route('/addItemToProperty').post(user.add_property_item);
	app.route('/deletePropertyItem').get(user.delete_property_item);
	app.route('/logout').get(user.logout);
	
};