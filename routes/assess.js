var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var Assessment = mongoose.model('Assessment');

var defaultDecimalPoints = 2;

//GET /use

exports.index = function(req, res){
  console.log('blue');
  res.render('use/index', {title: 'Express'});
};

//GET /use/assessment

exports.openAssessment = function(req, res){
  console.log(req.query);
  Assessment.findById(req.query.assessmentKey, function(err, assessment){
    // console.log(assessment);
    res.render('use/index', {title: 'Express', assessment: assessment});
  });
};

//GET /use/assessment/:id

exports.showInstructions = function(req, res){
  console.log(req.params);
  Assessment.findById(req.params.id, function(err, assessment){
    Question.find().where({assessment:req.params.id}).exec(function(err, questions){
      // console.log(questions);
      res.render('use/index', {title: 'Express', assessment: assessment, questions: questions});
    })
  });
};

//GET /use/assessment/:id/:question

exports.showQuestion = function(req, res){
  console.log(req.params);
  Assessment.findById(req.params.id, function(err, assessment){
    Question.find().where({assessment:req.params.id}).exec(function(err, questions){
      // console.log(question);
      console.log(req.params.question);
      //make questions[req.params.question].text fixed!!!!
      var question = questions[req.params.question];
      // for(var i = 0 ; i<question.numbersActual.length; i++){
      //   question.text = question.text.replace(question.numbersActual[i],'~'+i);
      // }
      for(var i = 0 ; i<question.numbersActual.length; i++){
        question.text = question.text.replace('~' + i + '~', generateNumberForStudent(question.numbersRange[i],defaultDecimalPoints));
      }
      res.render('use/index', {title: 'Express', assessment: assessment, questions: questions, question: question});
    });
  });
};


///////////////////////////////////////////////////////////////////////////////

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