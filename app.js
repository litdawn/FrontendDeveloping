var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ejs = require('ejs')
var bodyParser = require('body-parser');
const {expressjwt: jwt } = require("express-jwt")
// const {secret_key} = require('/util/jwt.js')
const secret_key = 'nodejs is too difficult QAQ';

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.html',ejs.__express);
app.set('view engine', 'html');

app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({limit:'50mb', extended:true}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(jwt({secret: secret_key,algorithms:['HS256']}).unless({
  path:[
      '/api/login',
      '/api/captcha',
      '/api/register',
      '/api/load_model',
      '/',
      '/register.html',
      '/mainpage.html',
      /^\/detail_picture_page\//,
      '/style_transfer.html'
  ]
}))

app.use('/', indexRouter);
app.use('/api', usersRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  if(err.name === 'UnauthorizedError'){
    return res.send({
      error_code:'C02',
      msg:'token无效'
    })
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;