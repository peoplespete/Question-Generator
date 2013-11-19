/* global document, window, io */

$(document).ready(initialize);

var socket;
//Global Variables
var a = {}; //assessment
var rawQuestions;
var questionsText;
var f;
var defaultPercentRange = 20;
var defaultDecimalPoints = 2;

function initialize(){
  $(document).foundation();
  initializeSocketIO();
  //input
  input();
  //teacherDesign
  teacherDesign();
  //use
  use();
}


//---INPUT INPUT INPUT----------------------------------------------------------/

function input(){
  // initialize
  $('#designAssessment').hide().on('click',clickDesignAssessment);
  checkFileReaderFunctionality();
  $('#file').on('change', handleFileSelect);
  $('#upload').on('click', clickUpload);
}

function handleFileSelect(evt) {
  f = evt.target.files[0]; // FileList object
  // files is a FileList of File objects. List some properties.
  var $output = $('<ol><li><strong>' + f.name + '</strong> (' + (f.type || 'n/a') + ') - ' +
                f.size + ' bytes, last modified: ' +
                (f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a') +
                '</li></ol>');
  console.log(f);
  $('#fileList').append($output);
  var reader = new FileReader();
  reader.readAsText(f);
  reader.onload = (function(theFile) {
    rawQuestions = theFile.target.result; //questions
  });
}

function clickUpload(){
  $('#upload').addClass('disabled').off('click');
  questionsText = rawQuestions.split(/\n\d+./);
  questionsText = _.map(questionsText, function(q){return q.trim();});
  questionsText = removeInstructionsFromQuestionArray(questionsText);
  a.questions = buildQuestionObjects(questionsText);
  console.log(a.questions);
  //sendAjaxRequest(url, data, verb, altVerb, event, successFn){
  sendAjaxRequest('/input', a, 'post', null, null, function(data){
    console.log(data);
    // $('#upload').removeClass('disabled').on('click', clickUpload);
    $('#designAssessment').attr('href','/input/'+ data._id);
    $('#designAssessment').show();
  });

}


function clickDesignAssessment(){
  var id = $(this).attr('data-id');
  //sendAjaxRequest(url, data, verb, altVerb, event, successFn){
  sendAjaxRequest('/input', id, 'get', null, null, function(data){
    console.log(data);
  });
}


///////////////////////////////////////////////////////////////////////////////////////////

function removeInstructionsFromQuestionArray(questions){
  a.instructions = questions[0];
  questions.shift();
  return questions;
}

function parseNumsOutOfQuestion(question){
  var nums = question.match(/\d+/g);
  nums = _.map(nums, function(n){
    return parseFloat(n);
  });
  return nums;
}
function buildQuestionObjects(questionsText){
  questions = [];
  for(var i = 0; i < questionsText.length ; i++){
    var question = {};
    question.text = questionsText[i];
    ///these should be flaots not strings
    question.numbersActual = parseNumsOutOfQuestion(questionsText[i]);
    question.numbersRange = [];
    for(var j = 0; j<question.numbersActual.length; j++){
      var bounds = generateBounds(question.numbersActual[j]);
      question.numbersRange.push(bounds);
    }
    question.howToSolve = []; //REVISIT
    questions.push(question);
  }
  return questions;
}


function generateBounds(num, percentRange, decimalPoints){
  if(percentRange === undefined) {
        percentRange = defaultPercentRange;
  }
  if(decimalPoints === undefined) {
        decimalPoints = defaultDecimalPoints;
  }
  percentRange /= 100;
  var bottomNum = num * (1 - percentRange);
  var topNum = num * (1 + percentRange);
  bottomNum = roundToDecimals(bottomNum, decimalPoints);
  topNum = roundToDecimals(topNum, decimalPoints);
  var bounds = [bottomNum, topNum];
  return bounds;
}

//---teacherDesign-teacherDesign-teacherDesign----------------------------------/

function teacherDesign(){
  // initialize
  $('#future').on('click','.operator, .number', clickOperatorOrNum);
  $('#future #backspace').on('click', clickBackspace);
  // $('#past').on('change keypress paste textInput input', evaluate);
  $('#saveSolution').on('click', clickSaveSolution);
}

var genericExpression = [];

function clickOperatorOrNum(){
  var isNum = $(this).hasClass('number');
  // console.log(isNum);
  var expression = $('#past').text();
  var nextChar = $(this).text();
  $('#past').text(expression + nextChar);
  if(isNum){
    nextChar = '~' + $(this).attr('data-num');
  }
  genericExpression.push(nextChar);
  evaluate();
}

function clickBackspace(){
  var expression = $('#past').text();
  expression = expression.split('');
  expression.pop();
  expression = expression.join('');
  $('#past').text(expression);
  genericExpression.pop();
  evaluate();
}

function clickSaveSolution(){
  //HERE WE SHOULD ADD THE HOW TO SOLVE TO EACH OF THE QUESTIONS IN MONGO
  var question = {};
  question.id = $(this).closest('#question').attr('data-id');
  question.howToSolve = genericExpression;
  console.log(question);
  //sendAjaxRequest(url, data, verb, altVerb, event, successFn){
  sendAjaxRequest('/input', question, 'post', 'put', null, function(data){
    console.log(data);
    //make that question disapeared and thing say it is saved
  });

}

///////////////////////////////////////////////////////////////////////////////////////////

function evaluate(){
  var expression = $('#past').text();
  try{
    expression = eval(expression);
  }catch(e){
    expression = '-----';
  }
  $('#present').text(expression);
  // console.log(genericExpression);

}


//---use-use-use-use--------------------------------------------------------------/

function use(){
  // initialize

}





///////////////////////////////////////////////////////////////////////////////////////////

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



//--------------------------------------------------------------------------------/




//--------------------------------------------------------------------------------/



///////////////////////////////////////////////////////////////////////////////////////////



//--------------------------------------------------------------------------------/




















































/////////////////////////////////////////////////////////////////////////////////
function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';

  socket = io.connect(url);
  socket.on('connected', socketConnected);
}

function socketConnected(data){
  console.log(data);
}

function checkFileReaderFunctionality(){
    // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}