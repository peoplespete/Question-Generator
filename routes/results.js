var __ = require('lodash');
var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var Assessment = mongoose.model('Assessment');
var Response = mongoose.model('Response');
var User = mongoose.model('User');

//GET /results/:assessmentid
exports.showResults = function(req, res){
  //ADAPT SO THAT WE CAN SEE ALL OF THE USERS AND THEIR RESULTS
  // console.log(res.locals.user);
  Assessment.findById(req.params.assessment, function(err, assessment){
    // console.log(assessment);
    Question.find({assessment:assessment.id}, function(err, questions){
      // console.log(questions);
        // console.log(user);
        //PUT IN THE RANGES!!!
      for(var i = 0; i<questions.length; i++){
        for(var j = 0; j<questions[i].numbersActual.length; j++){
          questions[i].text = questions[i].text.replace('~' + j + '~', '('+questions[i].numbersRange[j][0]+'-'+questions[i].numbersRange[j][1]+')');
        }
      }
      // console.log(assessment.id);
      Response.find({assessment:assessment.id}).populate('user').exec(function(err, responses){
        console.log(responses);
        // sort by their users then index
        responses = __.sortBy(responses, function(r){
          return [r.user.username, r.index];
        });
        var users = [];
        for(var i = 0; i<responses.length; i++){
          // console.log('responses user:' +responses[i].user.username + '    index:'+responses[i].index);
          users.push(responses[i].user);
        }
        users = __.uniq(users);
        var numCorrect = 0;
        for(var i = 0; i < users.length; i++){
          for(var j = 0; j< responses.length; j++){
            console.log('response.user' + responses[j].user.id + '   user.id:' + users[i].id);
            if(responses[j].user.id == users[i].id){
              if(responses[j].isCorrect === 1){
                numCorrect++;
              }
            }
          }
        console.log(users[i].username + ' numCorrect:'+numCorrect);
        users[i].score = numCorrect;
        numCorrect = 0;
        }
        res.render('results/index', {title:'Results', assessment:assessment, questions: questions, userMany: users, responses: responses, numCorrect: numCorrect});
      });
    });
  });
};


//GET /results/:assessment/:user
exports.showResultsForUser = function(req, res){
  console.log(req.params);
  Assessment.findOne(req.params.assessment, function(err, assessment){
    console.log(assessment);
    Question.find({assessment:assessment.id}, function(err, questions){
      // console.log(questions);
      questions = __.sortBy(questions, function(q){
          return [q.index];
          });
      User.findById(req.params.user, function(err, user){
        // console.log(user);
        Response.find({user:user.id}, function(err, responses){
          // console.log(responses);
          responses = __.sortBy(responses, function(r){
          return [r.index];
          });
          var numCorrect = 0;
          for(var i = 0; i< responses.length; i++){
            if(responses[i].isCorrect === 1){
              numCorrect++;
            }
            for(var j = 0 ; j<responses[i].numbers.length; j++){
              questions[i].text = questions[i].text.replace('~' + j + '~', responses[i].numbers[j]);
            }
            // console.log(questions[i].text);
          }
          // console.log('numCorrect:'+numCorrect);
          console.log(responses);
          console.log(questions);

          res.render('results/index', {title:'Results', assessment:assessment, questions: questions, user1: user, responses: responses, numCorrect: numCorrect});
        });
      });
    });

  });

};

  // res.render('home/index', {title: 'Express'});
