
module.exports = function(app) {
	var user = require('../controllers/user.server.controller');
	app.route('/login')
		.post(user.login);
};