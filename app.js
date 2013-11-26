var express = require('express');
var mongoose = require('mongoose');

// model definitions
require('require-dir')('./models');

//define middleware
var middleware = require('./lib/middleware');

// route definitions
var home = require('./routes/home');
var build = require('./routes/build');
var assess = require('./routes/assess');
var users = require('./routes/users');
var responses = require('./routes/responses');

var app = express();
var RedisStore = require('connect-redis')(express);
mongoose.connect('mongodb://localhost/assessment');

// configure express
require('./config').initialize(app, RedisStore);

// routes
app.get('/', home.index);
//input routes (ADMIN ONLY)
app.get('/input', middleware.isAdmin, build.index);
app.post('/input', middleware.isAdmin, build.create);
app.get('/input/:id', middleware.isAdmin, build.displayTeacherDesign);
app.put('/input', middleware.isAdmin, build.addHowToScore);
//use routes (STUDENTS)
app.get('/use', middleware.isUser, assess.index);
app.get('/use/assessment', middleware.isUser, assess.openAssessment);
app.get('/use/assessment/:id', middleware.isUser, assess.showInstructions);
app.get('/use/assessment/:id/:question', middleware.isUser, assess.showQuestion)

//login routes
app.post('/users', users.create);
app.put('/login', users.login);
app.delete('/logout', users.logout);
app.get('/make-me-an-admin', users.makeMeAnAdmin);
app.get('/admin', middleware.isAdmin, users.admin);
app.delete('/admin/:id', users.delete);
app.put('/admin/:id', users.toggleAdmin);
//response routes
app.post('/response', responses.grade);

// start server & socket.io
var common = require('./sockets/common');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {log: true, 'log level': 2});
server.listen(app.get('port'));
io.of('/app').on('connection', common.connection);
