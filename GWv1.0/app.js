var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

//Local routes
var gwuser = require('./routes/gwuser');
var pg = require('./routes/pg');
var pg_reviews = require('./routes/pg_reviews');
var pg_room = require('./routes/pg_room');
var pg_info = require('./routes/pg_info');
var pg_room_details = require('./routes/pg_room_details');
var pg_room_rent = require('./routes/pg_room_rent');
var user_reviews = require('./routes/user_reviews');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json({limit: "50mb"}));
//app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

//Set local routes
app.use('/gwuser',gwuser);
app.use('/pg',pg);
app.use('/pg_info',pg_info);
app.use('/pg_reviews',pg_reviews);
app.use('/pg_room',pg_room);
app.use('/pg_room_details',pg_room_details);
app.use('/pg_room_rent',pg_room_rent);
app.use('/user_reviews',user_reviews);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
