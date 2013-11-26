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
  $('#whoAreYou').foundation('reveal', 'open', '/');

  initializeSocketIO();
  //input
  input();
  //teacherDesign
  teacherDesign();
  //use
  use();
  //login;
  login();
  //response;
  response();
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
    question.numbersActual = parseNumsOutOfQuestion(questionsText[i]);
    console.log(question);
    for(var j = 0; j<question.numbersActual.length; j++){
      question.text = question.text.replace(/\d+/,'@@@');
    }
    for(var j = 0; j<question.numbersActual.length; j++){
      question.text = question.text.replace('@@@','~'+j+'~');
    }
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
    window.location.reload();
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

function clickFindAssessment(e){

}





///////////////////////////////////////////////////////////////////////////////////////////



//------login-login-login--------------------------------------------------------/
//you should clean it up so that you never use hidden class!
function login(){
// initialize
  $('.authentication').hide().addClass('hidden');
  $('#authentication-button').on('click', clickLoginSignUp);
  $('.register').on('click', clickSignUp);
  $('.login').on('click', clickLogin);
  $('table#adminList').on('click','input[type="checkbox"]', toggleAdminStatus);
  $('#teacher, #student').on('click', clickTeacherOrStudent);
}

var isTeacher = false;
function clickLoginSignUp(e){
  //toggles signin signup menu
  if($('#authentication-button').attr('data-email') !== 'anonymous'){
    sendAjaxRequest('/logout', {}, 'post', 'delete', e, function(data){
      htmlRestoreLoginLook();
      window.location.href = '/';
    });
  }else{
    if($('.authentication').hasClass('hidden')){
      $('.authentication').hide();
      $('.authentication').removeClass('hidden');
      $('.authentication').fadeIn(1000);
    }else{
      $('.authentication').show();
      $('.authentication').hide();
      $('.authentication').addClass('hidden');

    }
    $('input[name="username"]').focus();
    window.location.href = '/';
  }

}

function clickSignUp(e){
  $('.register').hide()
  var url = '/users';
  var data = $('form.authentication').serialize();
  console.log(data);
  sendAjaxRequest(url, data, 'post', null, e, function(status){
    htmlCompletedRegistrationAttempt(status, 'registration');
  });
}

function clickLogin(e){
  $('#whoAreYou').hide();
  //CHECK THE THIS TO SEE IF IT IS TEACH OR STUDENT...IF TEACH GO TO INPUT...IF STU GO TO USE
  var url = '/login';
  var data = $('form.authentication').serialize();
  console.log(data);
  sendAjaxRequest(url, data, 'post', 'put', e, function(data){
    console.log(data);
    if(data.status==='ok'){
      htmlCompletedRegistrationAttempt(data);
      htmlChangeButtonText(data.username, false);
      if(isTeacher){
        window.location.href = '/input';
      }else{
        window.location.href = '/use';
      }
    }else{
      htmlCompletedRegistrationAttempt(data, 'login');
    }
  });
}

function clickTeacherOrStudent(e){
  if($(this).attr('id')==='teacher'){
    isTeacher = true;
  }
  if($('#authentication-button').attr('data-email') !== 'anonymous'){
    sendAjaxRequest('/logout', {}, 'post', 'delete', e, function(data){
      htmlRestoreLoginLook();
      window.location.href = '/';
    });
  }else{
    if($('#whoAreYou .authentication').hasClass('hidden')){
      $('#whoAreYou .authentication').hide();
      $('#whoAreYou .authentication').removeClass('hidden');
      $('#whoAreYou .authentication').fadeIn(1000);
    }else{
      $('#whoAreYou .authentication').show();
      $('#whoAreYou .authentication').hide();
      $('#whoAreYou .authentication').addClass('hidden');

    }
    $('#whoAreYou input[name="username"]').focus();
  }
}

function toggleAdminStatus(){
  var url = '/admin/' + $(this).attr('data-id');
  // var id = $(this).attr('data-id');
  console.log(url);
  sendAjaxRequest(url, {}, 'post', 'put', null, function(data){
    //$('table#adminList input[data-id='+id+']').attr('checked', data.isAdmin);
  });

}

///////////////////////////////////////////////////////////////////////////////////////////

function htmlCompletedRegistrationAttempt(data, logOrReg){
  console.log(status);
  $('input[name="username"]').val('').focus();
  $('input[name="email"]').val('');
  $('input[name="password"]').val('');
  if(data.status === 'ok'){
    if(logOrReg === 'login'){
      $('.authentication').show();
      $('.authentication').hide();
      $('.authentication').addClass('hidden');
    }
  }else{
    alert('There was a problem with your ' + logOrReg + ', please try again.');
  }
}


function htmlChangeButtonText(newText, isReset){
  if(isReset){
    $('#authentication-button').attr('data-email', 'anonymous');
  }else{
    $('#authentication-button').attr('data-email', newText);
  }
  $('#authentication-button').text(newText).toggleClass('alert');
}

function htmlRestoreLoginLook(){
  htmlChangeButtonText('Login | Sign Up', true);
}


//----response-response-response--------------------------------------------------/

function response(){
  // initialize
  $('#submitResponse').on('click', clickSubmitResponse);
}

function clickSubmitResponse(){
  $('#response').attr('disabled','disabled');
  $('#submitResponse').off('click').addClass('disabled').fadeOut(500);
  var response = parseFloat($('#response').val());
  console.log(response);
  var question = $('#submitResponse').attr('data-question-id');
  // sendAjaxRequest(url, data, verb, altVerb, event, successFn)
  // console.log('question #:'+question);
  sendAjaxRequest('/response', {response:response, question:question}, 'post', null, null, function(data){
    console.log(data);
    if(data.response.isCorrect===1){
      $('#response').addClass('correct');
      $('#'+data.response.index).addClass('correct');
    }else{
      $('#response').addClass('wrong');
      $('#'+data.response.index).addClass('wrong');
    }
    if(data.numberOfQuestions > data.response.index+1){
      window.location.href = '/use/assessment/'+data.response.assessment+'/'+(data.response.index+1);
    }
    //here in a seperate if look at length of .correct/.wrong added and compare to numofquestions and send to results page
  });

}



///////////////////////////////////////////////////////////////////////////////////////////



//--------------------------------------------------------------------------------/

//--------------------------------------------------------------------------------/



///////////////////////////////////////////////////////////////////////////////////////////



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