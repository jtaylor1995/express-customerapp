var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var expressValidator = require('express-validator');
var mongojs = require('mongojs');
var db = mongojs('customerapp', ['users']);
var ObjectId = mongojs.ObjectId;

var app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
	res.locals.errors = null;
	next();
});


app.use(expressValidator({
	errorFormatter: function(param, msg, value) {
			var namespace = param.split('.')
			, root = namespace.shift()
			, formParam = root;

		while(namespace.length) {
			formParam += '[' + namespace.shift() + '[';
		}
		return {
			param : formParam,
			msg : msg,
			value : value
		};
	}
}));

var fixtureData = require('./fixture_data.json');
app.locals.barChartHelper = require('./bar_chart_helper');

app.get('/', function(req, res) {

	db.users.find(function(err, docs) {
		res.render('index', {
			title: 'Customers',
			users: docs,
			fixtureData: fixtureData
		});
	});
});

app.post('/users/add', function(req, res) {
	req.checkBody('first_name', 'First Name is required').notEmpty();
	req.checkBody('last_name', 'Last Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();

	var errors = req.validationErrors();

	if(errors) {
		db.users.find(function(err, docs) {
			res.render('index', {
				title: 'Customers',
				users: docs,
				errors: errors,
				fixtureData: fixtureData
			});
		});
	} else {
		var newUser = {
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			email: req.body.email
		}

		db.users.insert(newUser, function(err, res) {
			if(err) {
				console.log(err);
				res.redirect('/');
			}
		});

		res.redirect('/')
	}
});

app.delete('/users/delete/:id', function(req, res) {
	db.users.remove({_id: ObjectId(req.params.id)}, function(err, result) {
		if (err) {
			console.log(err);
		}
		res.redirect('/')
	})
})

app.get('/users/update/:id', function(req, res) {

	db.users.findOne({_id: ObjectId(req.params.id)}, function(err, result) {
		res.render('update', {
			title: 'Update',
			user: result
		});
	});
});

app.post('/update/:id', function(req, res) {

	req.checkBody('first_name', 'First Name is required').notEmpty();
	req.checkBody('last_name', 'Last Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();

	var errors = req.validationErrors();

	if(errors) {
		// Add error handling here
		db.users.findOne({_id: ObjectId(req.params.id)}, function(err, result) {
			res.render('update', {
				title: 'Update',
				user: result,
				errors: errors
			});
		});
	} else {
		var updateData = {
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			email: req.body.email
		}

		// RIGHT THE UPDATE STATEMENT HERE
		db.users.update({_id: ObjectId(req.params.id)}, updateData, function(err, raw) {
    if (err) {
      console.log(err);
    }
    console.log(raw);
  	});
		res.redirect('/')
	}


});

app.listen(3000, function() {
	console.log('Server started on 3000');
});
