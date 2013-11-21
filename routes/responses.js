var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var Assessment = mongoose.model('Assessment');
var Response = mongoose.model('Response');

/*
 * POST /response
 */

exports.create = function(req, res){
  console.log(req.body);
  res.send({status:'ok'});
};