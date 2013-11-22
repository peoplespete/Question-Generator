var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var Assessment = mongoose.model('Assessment');
var Response = mongoose.model('Response');

var defaultPercentRange = 3;
/*
 * POST /response
 */

exports.create = function(req, res){
  // console.log(req.body.response);
  // console.log(req.body.question);
  // console.log(res.locals.user);
  Response.find().where({question:req.body.question}).exec(function(err, response){
    console.log(response);
    console.log(response[0].correctAnswer);//PROBLEM IS HERE THIS IS NOT DEFINED!!! WHY NOT???
    if(withinPercent(req.body.response, response[0].correctAnswer, defaultPercentRange)){
      console.log('You got it!');
      res.send({status:'+'});
    }else{
      console.log('You  DONT got it!');
      res.send({status:'-'});

    }
    //SAVE RESPONSE HERE
  });
};

function withinPercent(num1, num2, percent){
  percent/= 100;
  num1 = parseFloat(num1);
  num2 = parseFloat(num2);
  var bounds = [num2 * (1-percent), num2*(1+percent)];
  if(num1 > bounds[0] && num1 < bounds[1]){
    return true;
  }
  return false;
}
