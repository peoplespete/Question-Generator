var __ = require('lodash');
var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var Assessment = mongoose.model('Assessment');
var Response = mongoose.model('Response');

var defaultPercentRange = 1;
/*
 * POST /response
 */

exports.grade = function(req, res){
  //req.body.response <== their anwer
  Question.findById(req.body.question, function(err,quest){
    var assessment = quest.assessment;
    Question.find().where({assessment:quest.assessment}).exec(function(err, questions){
      Response.findOne({question:quest.id, user:res.locals.user}).exec(function(err, response){
        var isCorrect;
        // console.log(response);
        //it doesn't understand .correct answer!!!! why not?
        if(withinPercent(req.body.response, response.correctAnswer, defaultPercentRange)){
          // console.log('You got it!');
          isCorrect = 1;
        }else{
          // console.log('You  DONT got it!');
          isCorrect = 0;
        }
        response.isCorrect = isCorrect;
        response.userAnswer = req.body.response;
        response.save(function(err, response){
          // console.log(response);
          res.send({response:response, numberOfQuestions:questions.length, user: res.locals.user.id});
        });
      });
    });
  });
};

function withinPercent(num1, num2, percent){
  percent/= 100;
  num1 = parseFloat(num1);
  num2 = parseFloat(num2);
  var bounds = [num2 * (1-percent), num2*(1+percent)];
  if(num2 < 0){
    bounds.reverse();
  }
  if(num1 > bounds[0] && num1 < bounds[1]){
    return true;
  }
  return false;
}
