var express = require('express');
var mongoose = require('mongoose');

// model definitions
require('require-dir')('./models');

// route definitions
var home = require('./routes/home');
var build = require('./routes/build');
var assess = require('./routes/assess');

var app = express();
var RedisStore = require('connect-redis')(express);
mongoose.connect('mongodb://localhost/assessment');

// configure express
require('./config').initialize(app, RedisStore);

// routes
app.get('/', home.index);
//input routes (ADMIN ONLY)
app.get('/input', build.index);
app.post('/input', build.create);
app.get('/input/:id', build.displayTeacherDesign);
app.put('/input', build.addHowToScore);
//use routes (STUDENTS)
app.get('/use', assess.index);


// start server & socket.io
var common = require('./sockets/common');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {log: true, 'log level': 2});
server.listen(app.get('port'));
io.of('/app').on('connection', common.connection);
