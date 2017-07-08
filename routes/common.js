var Common = {
	
	// Node Module dependencies	
	express : require('express'),
	
	bodyParser : require('body-parser'),
	
	autoIncrement : require('mongoose-auto-increment'),
	
	mongoose : require('mongoose'),
	
	Schema:require('mongoose').Schema,
	
	conn:require('mongoose').createConnection(process.env.MONGOLAB_URI),//mongodb://127.0.0.1/GWv1_DB
	
	// check if the user is authenticated and can access resources 
	ensureAuthenticated : function ensureAuthenticated(req, res, next) {
		/*if (req.isAuthenticated()) {
			return next();
		}
		res.redirect('/');*/
	}

};

module.exports = Common;
