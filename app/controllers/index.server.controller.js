
exports.render = function(req, res) {
	if (req.session.lastVisit) {
		console.log(req.session.lastVisit);
	}
	req.session.lastVisit = new Date();
	//render the index.ejs template
	res.render('index', {
		title: 'Hello World!!!'
	});
};