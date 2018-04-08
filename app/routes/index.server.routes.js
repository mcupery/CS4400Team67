
module.exports = function(app) {
	var index = require('../controllers/index.server.controller');
	var user = require('../controllers/user.server.controller');
	app.get('/', index.render);
	app.route('/login')
		.post(user.login);
};