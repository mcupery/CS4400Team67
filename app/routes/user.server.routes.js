
module.exports = function(app) {
	var user = require('../controllers/user.server.controller');
	app.route('/').post(user.login);
	app.route('/register/:user_type').get(user.render_reg);
	app.route('/admin_console').get(user.render_admin);
	
};