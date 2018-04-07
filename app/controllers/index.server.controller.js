
exports.render = function(req, res) {
	//render the index.ejs template
	res.render('index', {
		title: 'Hello World!!!'
	});
};