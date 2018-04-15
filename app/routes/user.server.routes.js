
module.exports = function(app) {
	var user = require('../controllers/user.server.controller');
	app.route('/').post(user.login);
	app.route('/register').get(user.render_reg)
						  .post(user.register);
	app.route('/main').get(user.render_main);
	
};