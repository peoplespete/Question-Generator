var __ = require('lodash');
var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var Response = mongoose.model('Response');
var Assessment = mongoose.model('Assessment');


//GET /use

exports.index = function(req, res){
  // //console.log('blue');
  res.render('use/index', {title: 'Express'});
};

//GET /use/assessment

exports.openAssessment = function(req, res){
  // //console.log(req.query);
  Assessment.findById(req.query.assessmentKey, function(err, assessment){
    // //console.log(assessment);
    res.render('use/index', {title: 'Express', assessment: assessment});
  });
};

//GET /use/assessment/:id

exports.showInstructions = function(req, res){
  // //console.log(req.params);
  Assessment.findById(req.params.id, function(err, assessment){
    Question.find().where({assessment:req.params.id}).exec(function(err, questions){
      // //console.log(questions);
      res.render('use/index', {title: 'Express', assessment: assessment, questions: questions});
    })
  });
};

//GET /use/assessment/:id/:question

exports.showQuestion = function(req, res){
  // //console.log(req.params);
          // console.log('found your question');
  Assessment.findById(req.params.id, function(err, assessment){
    Question.find().where({assessment:assessment.id}).exec(function(err, questions){
      questions = __.sortBy(questions, function(q){
            return q.index;
      });
      // console.log(questions);
      var question;//something is wrong here.  question is not being found here
      for(var i = 0; i < questions.length; i++) {
        //console.log('questions[i]...'+ questions[i].index + '    req.params...'+req.params.question);
        if (parseInt(questions[i].index) === parseInt(req.params.question)) {
          question = questions[i];
          console.log('found your question');
          break;
        }
      }
      console.log('question...'+ question);
      Response.find().where({user:res.locals.user.id}).exec(function(err, responses){
        console.log('your responses....'+ responses);
        var response;
        for(var i = 0; i < responses.length; i++){
          // console.log('response[i].question....'+responses[i].question);
          // console.log('question.id....'+question.id);
          if(responses[i].question = question.id){
            response = responses[i];
          }
        }
        console.log('found response.....' + response);
        Response.find().where({assessment:assessment.id, user:res.locals.user}).exec(function(err, allResponses){
          console.log('allResponses....' + allResponses);
          allResponses = __.sortBy(allResponses, function(r){
            return r.index;
          });
          for(var i = 0; i<questions.length; i++){
            if(!allResponses[i] || (questions[i].index !== allResponses[i].index)){
              var dummy = allResponses.splice(i, 0, {});
            }
          }
          if(response){
            // //console.log('already got some');
            if(response.length>1){
              console.log('oh crap...too many responses for this one');
            }
            for(var i = 0 ; i<response.numbers.length; i++){
              question.text = question.text.replace('~' + i + '~', response.numbers[i]);
            }

            //PUT IN THEIR ANSWER UPON REFRESH(IN HERE)
            //it also needs to make sure that the responses it finds are for the current user!!!
            //IT SEEMS TO STILL CREATE MORE RESPONSES than are needed (try switching users and you get more responses i think)
            res.render('use/index', {title: 'Express', assessment: assessment, questions: questions, question: question, responses:allResponses, response:response});
          }else{
            // //console.log('dont have any');
            var userNums = [];
            for(var i = 0 ; i<question.numbersActual.length; i++){
              var num = generateNumberForStudent(question.numbersRange[i], howManyDecimals(question.numbersActual[i]));
              userNums.push(num);
              question.text = question.text.replace('~' + i + '~', num);
            }
            var solver = question.howToSolve;
            for(var i  = 0; i < userNums.length; i++){
              var index = solver.indexOf('~' + i );
              solver[index] = userNums[i];
            }
            var evaluateMe = solver.join('');
            // //console.log(evaluateMe);
            var correctAnswer = eval(evaluateMe);
            // console.log('INDEX OF QUESTION SOON TO BE RESPONSE:' + question.index);
            var r = {
              question: questions[req.params.question],
              assessment: assessment,
              user: res.locals.user,
              numbers: userNums,
              correctAnswer: correctAnswer,
              index: question.index
              }
            new Response(r).save(function(err, response){
              console.log('made a new one .............' + response);
              res.render('use/index', {title: 'Express', assessment: assessment, questions: questions, question: question, responses:allResponses, response:response});
            });
          }
        });
      });
    });
  });
};


///////////////////////////////////////////////////////////////////////////////

function howManyDecimals(num){
  var c = 0;
  while(num * Math.pow(10, c) !== parseInt(num * Math.pow(10, c))){
    c++;
  }
  return c;
}


function generateNumberForStudent(bounds, decimalPoints){
  if(decimalPoints === undefined) {
        decimalPoints = defaultDecimalPoints;
  }
  var spread = bounds[1] - bounds[0];
  var num = Math.random() * spread;
  num+= bounds[0];
  num = roundToDecimals(num, decimalPoints);
  return num;
}

//DUPLICATED!!!!
function roundToDecimals(num, decimalPoints){
  num*= Math.pow(10, decimalPoints);
  num = Math.round(num);
  num/= Math.pow(10, decimalPoints);
  return num;
}