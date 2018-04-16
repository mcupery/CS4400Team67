
exports.render = function(req, res) {
	if (req.session.lastVisit) {
		console.log(req.session.lastVisit);
	}
	req.session.lastVisit = new Date();
	req.session.user = "";
	//render the landing page template
	res.render('landing', {});
};