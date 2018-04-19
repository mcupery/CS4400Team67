
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
	
};