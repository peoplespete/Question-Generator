var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var Assessment = mongoose.model('Assessment');

//GET /use

exports.index = function(req, res){
  res.render('use/index', {title: 'Express'});
};