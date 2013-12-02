/* global document, window, io */

$(document).ready(initialize);

// var socket;
//Global Variables
var defaultPercentRange = 20;
var defaultDecimalPoints = 2;

function initialize(){
  $(document).foundation();

  // initializeSocketIO();
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
var a = {}; //assessment
var rawQuestions;
var questionsText;
var f;

function input(){
  // initialize
  $('#designAssessment').hide().on('click',clickDesignAssessment);
  $('#file').on('change', handleFileSelect);
  $('#upload').on('click', clickUpload);
}

function handleFileSelect(evt) {
  checkFileReaderFunctionality();
  f = evt.target.files[0]; // FileList object
  // files is a FileList of File objects. List some properties.
  var $output = $('<div><strong>' + f.name + '</strong> (' + (f.type || 'n/a') + ') - ' +
                roundToDecimals(f.size/1024,2) + ' kB, last modified: ' +
                (f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a') +
                '</div>');
  // console.log(f);
  if(!f.name.contains('txt')){
    alert('Only text files are allowed at this time.')
    window.location.reload();
    return;
  }
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
    $('#designAssessment').show().removeClass('hidden');
  });

}


function clickDesignAssessment(){
  var id = $(this).attr('data-id');
  //sendAjaxRequest(url, data, verb, altVerb, event, successFn){
  sendAjaxRequest('/input', id, 'get', null, null, function(data){
    // console.log(data);
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
    // console.log(question);
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
  $('#future').on('click','.operator, .number, .mathConstant', clickOperatorOrNum);
  $('#future #backspace').on('click', clickBackspace);
  // $('#past').on('change keypress paste textInput input', evaluate);
  $('#saveSolution').on('click', clickSaveSolution);
}

var genericExpression = [];
var shownExpression = [];

function clickOperatorOrNum(){
  var isNum = $(this).hasClass('number');
  // var expression = $('#past').text();
  var nextChar = $(this).attr('data-value');
  shownExpression.push(nextChar);
  if(isNum){
    nextChar = '~' + $(this).attr('data-num');
  }
  genericExpression.push(nextChar);
  $('#past').text(shownExpression.join(''));
  evaluate();
}

function clickBackspace(){
  // var expression = $('#past').text();
  // expression = expression.split('');
  // expression.pop();
  // expression = expression.join('');
  shownExpression.pop();
  $('#past').text(shownExpression.join(''));
  genericExpression.pop();
  evaluate();
  // console.log('SHOWN:' + shownExpression);
  // console.log('GENERIC:' + genericExpression);
}

function clickSaveSolution(){
  //HERE WE SHOULD ADD THE HOW TO SOLVE TO EACH OF THE QUESTIONS IN MONGO
  var question = {};
  question.id = $(this).closest('#question').attr('data-id');
  question.howToSolve = genericExpression;
  // console.log(question);
  //sendAjaxRequest(url, data, verb, altVerb, event, successFn){
  sendAjaxRequest('/input', question, 'post', 'put', null, function(data){
    // console.log(data);
    window.location.reload();
    //make that question disapeared and thing say it is saved
  });

}

///////////////////////////////////////////////////////////////////////////////////////////

function evaluate(){
  var expression = shownExpression.join('');
  try{
    expression = eval(expression);
  }catch(e){
    expression = '-----';
  }
  // console.log(expression);
  if(expression !== undefined){
    $('#present').text(expression);
  }else{
    $('#present').text('');
  }
  // console.log(genericExpression);

}


//---use-use-use-use--------------------------------------------------------------/

function use(){
  // initialize
  startCanvas();
  $('#clearCanvas').on('click',clickClearCanvas);
}

function startCanvas(){
  $(function() {
    $('#simple_sketch').sketch({defaultColor: "#FFF"});
    //YOU SHOLDN'T HAVE TO CLICK ON THE CANVAS FOR THIS CODE TO EXECUTE
    $('#simple_sketch').sketch().actions = tryMe(5);
    $('#simple_sketch').sketch().redraw(); //this is key
  });
}

function clickClearCanvas(){
  // console.log($('#simple_sketch').sketch().actions);
  $('#simple_sketch').sketch().actions = [];
  $('#simple_sketch').sketch().redraw();
}

function tryMe(markerWidth){
  return [{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":44,"y":34,"event":"mousedown"},{"x":44,"y":35,"event":"mousemove"},{"x":45,"y":35,"event":"mousemove"},{"x":45,"y":35,"event":"mousemove"},{"x":45,"y":35,"event":"mousemove"},{"x":46,"y":38,"event":"mousemove"},{"x":46,"y":39,"event":"mousemove"},{"x":46,"y":39,"event":"mousemove"},{"x":46,"y":40,"event":"mousemove"},{"x":47,"y":43,"event":"mousemove"},{"x":47,"y":43,"event":"mousemove"},{"x":47,"y":43,"event":"mousemove"},{"x":47,"y":44,"event":"mousemove"},{"x":48,"y":47,"event":"mousemove"},{"x":48,"y":47,"event":"mousemove"},{"x":48,"y":48,"event":"mousemove"},{"x":48,"y":49,"event":"mousemove"},{"x":48,"y":50,"event":"mousemove"},{"x":48,"y":51,"event":"mousemove"},{"x":48,"y":51,"event":"mousemove"},{"x":48,"y":53,"event":"mousemove"},{"x":48,"y":53,"event":"mousemove"},{"x":48,"y":54,"event":"mousemove"},{"x":48,"y":54,"event":"mousemove"},{"x":48,"y":54,"event":"mousemove"},{"x":48,"y":56,"event":"mousemove"},{"x":48,"y":56,"event":"mousemove"},{"x":48,"y":56,"event":"mousemove"},{"x":48,"y":57,"event":"mousemove"},{"x":48,"y":57,"event":"mousemove"},{"x":48,"y":58,"event":"mousemove"},{"x":48,"y":58,"event":"mousemove"},{"x":48,"y":58,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":35,"y":37,"event":"mousedown"},{"x":35,"y":37,"event":"mousemove"},{"x":35,"y":37,"event":"mousemove"},{"x":38,"y":35,"event":"mousemove"},{"x":40,"y":34,"event":"mousemove"},{"x":41,"y":34,"event":"mousemove"},{"x":41,"y":34,"event":"mousemove"},{"x":42,"y":33,"event":"mousemove"},{"x":47,"y":33,"event":"mousemove"},{"x":49,"y":33,"event":"mousemove"},{"x":49,"y":33,"event":"mousemove"},{"x":50,"y":33,"event":"mousemove"},{"x":51,"y":33,"event":"mousemove"},{"x":52,"y":33,"event":"mousemove"},{"x":57,"y":33,"event":"mousemove"},{"x":58,"y":33,"event":"mousemove"},{"x":58,"y":33,"event":"mousemove"},{"x":59,"y":33,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":66,"y":56,"event":"mousedown"},{"x":65,"y":55,"event":"mousemove"},{"x":65,"y":50,"event":"mousemove"},{"x":65,"y":49,"event":"mousemove"},{"x":65,"y":48,"event":"mousemove"},{"x":65,"y":46,"event":"mousemove"},{"x":66,"y":45,"event":"mousemove"},{"x":66,"y":45,"event":"mousemove"},{"x":66,"y":45,"event":"mousemove"},{"x":67,"y":44,"event":"mousemove"},{"x":69,"y":43,"event":"mousemove"},{"x":72,"y":41,"event":"mousemove"},{"x":74,"y":41,"event":"mousemove"},{"x":74,"y":41,"event":"mousemove"},{"x":74,"y":41,"event":"mousemove"},{"x":75,"y":41,"event":"mousemove"},{"x":75,"y":40,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":85,"y":42,"event":"mousedown"},{"x":86,"y":43,"event":"mousemove"},{"x":87,"y":44,"event":"mousemove"},{"x":87,"y":45,"event":"mousemove"},{"x":87,"y":45,"event":"mousemove"},{"x":88,"y":46,"event":"mousemove"},{"x":88,"y":46,"event":"mousemove"},{"x":88,"y":47,"event":"mousemove"},{"x":89,"y":48,"event":"mousemove"},{"x":89,"y":48,"event":"mousemove"},{"x":90,"y":49,"event":"mousemove"},{"x":90,"y":49,"event":"mousemove"},{"x":90,"y":50,"event":"mousemove"},{"x":91,"y":50,"event":"mousemove"},{"x":92,"y":51,"event":"mousemove"},{"x":93,"y":52,"event":"mousemove"},{"x":94,"y":52,"event":"mousemove"},{"x":95,"y":52,"event":"mousemove"},{"x":97,"y":52,"event":"mousemove"},{"x":97,"y":52,"event":"mousemove"},{"x":97,"y":52,"event":"mousemove"},{"x":97,"y":51,"event":"mousemove"},{"x":98,"y":51,"event":"mousemove"},{"x":98,"y":51,"event":"mousemove"},{"x":98,"y":51,"event":"mousemove"},{"x":98,"y":50,"event":"mousemove"},{"x":99,"y":49,"event":"mousemove"},{"x":99,"y":49,"event":"mousemove"},{"x":99,"y":48,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":98,"y":38,"event":"mousedown"},{"x":98,"y":40,"event":"mousemove"},{"x":98,"y":41,"event":"mousemove"},{"x":99,"y":44,"event":"mousemove"},{"x":99,"y":45,"event":"mousemove"},{"x":99,"y":45,"event":"mousemove"},{"x":99,"y":47,"event":"mousemove"},{"x":99,"y":47,"event":"mousemove"},{"x":99,"y":48,"event":"mousemove"},{"x":99,"y":51,"event":"mousemove"},{"x":99,"y":52,"event":"mousemove"},{"x":99,"y":53,"event":"mousemove"},{"x":99,"y":53,"event":"mousemove"},{"x":99,"y":54,"event":"mousemove"},{"x":99,"y":58,"event":"mousemove"},{"x":99,"y":59,"event":"mousemove"},{"x":99,"y":59,"event":"mousemove"},{"x":99,"y":60,"event":"mousemove"},{"x":99,"y":60,"event":"mousemove"},{"x":99,"y":62,"event":"mousemove"},{"x":99,"y":63,"event":"mousemove"},{"x":99,"y":63,"event":"mousemove"},{"x":99,"y":64,"event":"mousemove"},{"x":98,"y":67,"event":"mousemove"},{"x":98,"y":68,"event":"mousemove"},{"x":98,"y":68,"event":"mousemove"},{"x":97,"y":69,"event":"mousemove"},{"x":97,"y":69,"event":"mousemove"},{"x":97,"y":70,"event":"mousemove"},{"x":97,"y":70,"event":"mousemove"},{"x":97,"y":71,"event":"mousemove"},{"x":96,"y":71,"event":"mousemove"},{"x":95,"y":73,"event":"mousemove"},{"x":95,"y":75,"event":"mousemove"},{"x":94,"y":76,"event":"mousemove"},{"x":93,"y":76,"event":"mousemove"},{"x":93,"y":77,"event":"mousemove"},{"x":93,"y":77,"event":"mousemove"},{"x":92,"y":78,"event":"mousemove"},{"x":92,"y":78,"event":"mousemove"},{"x":92,"y":79,"event":"mousemove"},{"x":92,"y":79,"event":"mousemove"},{"x":91,"y":79,"event":"mousemove"},{"x":91,"y":80,"event":"mousemove"},{"x":91,"y":80,"event":"mousemove"},{"x":90,"y":80,"event":"mousemove"},{"x":90,"y":81,"event":"mousemove"},{"x":90,"y":81,"event":"mousemove"},{"x":89,"y":81,"event":"mousemove"},{"x":89,"y":81,"event":"mousemove"},{"x":89,"y":81,"event":"mousemove"},{"x":89,"y":82,"event":"mousemove"},{"x":88,"y":82,"event":"mousemove"},{"x":88,"y":82,"event":"mousemove"},{"x":88,"y":82,"event":"mousemove"},{"x":87,"y":83,"event":"mousemove"},{"x":87,"y":83,"event":"mousemove"},{"x":86,"y":83,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":123,"y":39,"event":"mousedown"},{"x":124,"y":41,"event":"mousemove"},{"x":124,"y":42,"event":"mousemove"},{"x":125,"y":45,"event":"mousemove"},{"x":125,"y":46,"event":"mousemove"},{"x":125,"y":47,"event":"mousemove"},{"x":125,"y":47,"event":"mousemove"},{"x":125,"y":48,"event":"mousemove"},{"x":125,"y":48,"event":"mousemove"},{"x":125,"y":44,"event":"mousemove"},{"x":125,"y":43,"event":"mousemove"},{"x":125,"y":42,"event":"mousemove"},{"x":125,"y":40,"event":"mousemove"},{"x":125,"y":39,"event":"mousemove"},{"x":125,"y":39,"event":"mousemove"},{"x":125,"y":38,"event":"mousemove"},{"x":125,"y":37,"event":"mousemove"},{"x":125,"y":37,"event":"mousemove"},{"x":125,"y":36,"event":"mousemove"},{"x":125,"y":36,"event":"mousemove"},{"x":126,"y":35,"event":"mousemove"},{"x":126,"y":35,"event":"mousemove"},{"x":127,"y":35,"event":"mousemove"},{"x":128,"y":35,"event":"mousemove"},{"x":128,"y":35,"event":"mousemove"},{"x":129,"y":35,"event":"mousemove"},{"x":129,"y":35,"event":"mousemove"},{"x":130,"y":35,"event":"mousemove"},{"x":130,"y":35,"event":"mousemove"},{"x":132,"y":36,"event":"mousemove"},{"x":132,"y":37,"event":"mousemove"},{"x":133,"y":37,"event":"mousemove"},{"x":134,"y":39,"event":"mousemove"},{"x":134,"y":40,"event":"mousemove"},{"x":135,"y":40,"event":"mousemove"},{"x":135,"y":40,"event":"mousemove"},{"x":135,"y":41,"event":"mousemove"},{"x":135,"y":41,"event":"mousemove"},{"x":136,"y":43,"event":"mousemove"},{"x":136,"y":44,"event":"mousemove"},{"x":136,"y":44,"event":"mousemove"},{"x":136,"y":44,"event":"mousemove"},{"x":137,"y":45,"event":"mousemove"},{"x":137,"y":45,"event":"mousemove"},{"x":137,"y":45,"event":"mousemove"},{"x":137,"y":46,"event":"mousemove"},{"x":137,"y":46,"event":"mousemove"},{"x":137,"y":46,"event":"mousemove"},{"x":137,"y":47,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":134,"y":38,"event":"mousedown"},{"x":134,"y":37,"event":"mousemove"},{"x":134,"y":37,"event":"mousemove"},{"x":135,"y":37,"event":"mousemove"},{"x":135,"y":36,"event":"mousemove"},{"x":136,"y":36,"event":"mousemove"},{"x":137,"y":36,"event":"mousemove"},{"x":137,"y":36,"event":"mousemove"},{"x":138,"y":35,"event":"mousemove"},{"x":139,"y":35,"event":"mousemove"},{"x":139,"y":35,"event":"mousemove"},{"x":140,"y":34,"event":"mousemove"},{"x":141,"y":34,"event":"mousemove"},{"x":142,"y":34,"event":"mousemove"},{"x":142,"y":34,"event":"mousemove"},{"x":142,"y":34,"event":"mousemove"},{"x":145,"y":38,"event":"mousemove"},{"x":146,"y":39,"event":"mousemove"},{"x":146,"y":39,"event":"mousemove"},{"x":146,"y":39,"event":"mousemove"},{"x":147,"y":39,"event":"mousemove"},{"x":147,"y":40,"event":"mousemove"},{"x":147,"y":40,"event":"mousemove"},{"x":147,"y":40,"event":"mousemove"},{"x":147,"y":40,"event":"mousemove"},{"x":147,"y":41,"event":"mousemove"},{"x":147,"y":41,"event":"mousemove"},{"x":148,"y":44,"event":"mousemove"},{"x":148,"y":45,"event":"mousemove"},{"x":148,"y":45,"event":"mousemove"},{"x":148,"y":45,"event":"mousemove"},{"x":148,"y":46,"event":"mousemove"},{"x":148,"y":47,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":159,"y":38,"event":"mousedown"},{"x":160,"y":38,"event":"mousemove"},{"x":161,"y":39,"event":"mousemove"},{"x":161,"y":39,"event":"mousemove"},{"x":161,"y":39,"event":"mousemove"},{"x":162,"y":39,"event":"mousemove"},{"x":165,"y":40,"event":"mousemove"},{"x":166,"y":40,"event":"mousemove"},{"x":166,"y":40,"event":"mousemove"},{"x":167,"y":40,"event":"mousemove"},{"x":168,"y":38,"event":"mousemove"},{"x":168,"y":38,"event":"mousemove"},{"x":169,"y":37,"event":"mousemove"},{"x":169,"y":37,"event":"mousemove"},{"x":170,"y":37,"event":"mousemove"},{"x":170,"y":37,"event":"mousemove"},{"x":170,"y":36,"event":"mousemove"},{"x":172,"y":36,"event":"mousemove"},{"x":172,"y":35,"event":"mousemove"},{"x":172,"y":35,"event":"mousemove"},{"x":172,"y":35,"event":"mousemove"},{"x":173,"y":35,"event":"mousemove"},{"x":174,"y":34,"event":"mousemove"},{"x":174,"y":32,"event":"mousemove"},{"x":174,"y":32,"event":"mousemove"},{"x":174,"y":31,"event":"mousemove"},{"x":174,"y":31,"event":"mousemove"},{"x":174,"y":31,"event":"mousemove"},{"x":174,"y":30,"event":"mousemove"},{"x":173,"y":29,"event":"mousemove"},{"x":173,"y":29,"event":"mousemove"},{"x":173,"y":29,"event":"mousemove"},{"x":171,"y":28,"event":"mousemove"},{"x":170,"y":28,"event":"mousemove"},{"x":169,"y":28,"event":"mousemove"},{"x":169,"y":28,"event":"mousemove"},{"x":169,"y":28,"event":"mousemove"},{"x":168,"y":27,"event":"mousemove"},{"x":168,"y":27,"event":"mousemove"},{"x":166,"y":27,"event":"mousemove"},{"x":165,"y":27,"event":"mousemove"},{"x":165,"y":27,"event":"mousemove"},{"x":164,"y":27,"event":"mousemove"},{"x":163,"y":28,"event":"mousemove"},{"x":162,"y":29,"event":"mousemove"},{"x":162,"y":29,"event":"mousemove"},{"x":162,"y":29,"event":"mousemove"},{"x":162,"y":29,"event":"mousemove"},{"x":161,"y":30,"event":"mousemove"},{"x":161,"y":30,"event":"mousemove"},{"x":161,"y":30,"event":"mousemove"},{"x":160,"y":31,"event":"mousemove"},{"x":160,"y":31,"event":"mousemove"},{"x":160,"y":31,"event":"mousemove"},{"x":160,"y":32,"event":"mousemove"},{"x":159,"y":32,"event":"mousemove"},{"x":159,"y":32,"event":"mousemove"},{"x":159,"y":33,"event":"mousemove"},{"x":159,"y":33,"event":"mousemove"},{"x":159,"y":34,"event":"mousemove"},{"x":159,"y":34,"event":"mousemove"},{"x":159,"y":35,"event":"mousemove"},{"x":159,"y":35,"event":"mousemove"},{"x":159,"y":37,"event":"mousemove"},{"x":159,"y":37,"event":"mousemove"},{"x":159,"y":38,"event":"mousemove"},{"x":160,"y":38,"event":"mousemove"},{"x":160,"y":38,"event":"mousemove"},{"x":160,"y":39,"event":"mousemove"},{"x":161,"y":42,"event":"mousemove"},{"x":162,"y":43,"event":"mousemove"},{"x":162,"y":43,"event":"mousemove"},{"x":162,"y":44,"event":"mousemove"},{"x":162,"y":45,"event":"mousemove"},{"x":163,"y":45,"event":"mousemove"},{"x":163,"y":45,"event":"mousemove"},{"x":163,"y":45,"event":"mousemove"},{"x":164,"y":45,"event":"mousemove"},{"x":164,"y":46,"event":"mousemove"},{"x":164,"y":46,"event":"mousemove"},{"x":164,"y":46,"event":"mousemove"},{"x":165,"y":46,"event":"mousemove"},{"x":168,"y":46,"event":"mousemove"},{"x":169,"y":46,"event":"mousemove"},{"x":169,"y":46,"event":"mousemove"},{"x":169,"y":46,"event":"mousemove"},{"x":170,"y":46,"event":"mousemove"},{"x":170,"y":46,"event":"mousemove"},{"x":171,"y":46,"event":"mousemove"},{"x":171,"y":47,"event":"mousemove"},{"x":171,"y":47,"event":"mousemove"},{"x":172,"y":47,"event":"mousemove"},{"x":172,"y":47,"event":"mousemove"},{"x":173,"y":47,"event":"mousemove"},{"x":174,"y":47,"event":"mousemove"},{"x":176,"y":47,"event":"mousemove"},{"x":177,"y":47,"event":"mousemove"},{"x":178,"y":47,"event":"mousemove"},{"x":179,"y":47,"event":"mousemove"},{"x":179,"y":47,"event":"mousemove"},{"x":179,"y":47,"event":"mousemove"},{"x":180,"y":47,"event":"mousemove"},{"x":180,"y":47,"event":"mousemove"},{"x":180,"y":47,"event":"mousemove"},{"x":181,"y":47,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":191,"y":18,"event":"mousedown"},{"x":191,"y":18,"event":"mousemove"},{"x":193,"y":22,"event":"mousemove"},{"x":194,"y":23,"event":"mousemove"},{"x":195,"y":25,"event":"mousemove"},{"x":195,"y":26,"event":"mousemove"},{"x":195,"y":26,"event":"mousemove"},{"x":195,"y":27,"event":"mousemove"},{"x":195,"y":27,"event":"mousemove"},{"x":195,"y":27,"event":"mousemove"},{"x":196,"y":28,"event":"mousemove"},{"x":196,"y":29,"event":"mousemove"},{"x":196,"y":29,"event":"mousemove"},{"x":196,"y":30,"event":"mousemove"},{"x":196,"y":30,"event":"mousemove"},{"x":196,"y":33,"event":"mousemove"},{"x":196,"y":33,"event":"mousemove"},{"x":196,"y":33,"event":"mousemove"},{"x":196,"y":34,"event":"mousemove"},{"x":196,"y":34,"event":"mousemove"},{"x":196,"y":34,"event":"mousemove"},{"x":196,"y":35,"event":"mousemove"},{"x":196,"y":35,"event":"mousemove"},{"x":196,"y":35,"event":"mousemove"},{"x":196,"y":36,"event":"mousemove"},{"x":196,"y":36,"event":"mousemove"},{"x":196,"y":36,"event":"mousemove"},{"x":196,"y":37,"event":"mousemove"},{"x":197,"y":37,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":196,"y":46,"event":"mousedown"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":92,"y":14,"event":"mousedown"},{"x":91,"y":13,"event":"mousemove"},{"x":92,"y":13,"event":"mousemove"},{"x":93,"y":13,"event":"mousemove"},{"x":93,"y":12,"event":"mousemove"},{"x":94,"y":12,"event":"mousemove"},{"x":94,"y":11,"event":"mousemove"},{"x":95,"y":11,"event":"mousemove"},{"x":95,"y":11,"event":"mousemove"},{"x":96,"y":10,"event":"mousemove"},{"x":96,"y":10,"event":"mousemove"},{"x":98,"y":10,"event":"mousemove"},{"x":98,"y":9,"event":"mousemove"},{"x":99,"y":8,"event":"mousemove"},{"x":100,"y":8,"event":"mousemove"},{"x":100,"y":8,"event":"mousemove"},{"x":101,"y":7,"event":"mousemove"},{"x":101,"y":7,"event":"mousemove"},{"x":101,"y":7,"event":"mousemove"},{"x":102,"y":7,"event":"mousemove"},{"x":102,"y":7,"event":"mousemove"},{"x":103,"y":7,"event":"mousemove"},{"x":103,"y":6,"event":"mousemove"},{"x":103,"y":6,"event":"mousemove"},{"x":104,"y":6,"event":"mousemove"},{"x":104,"y":6,"event":"mousemove"},{"x":104,"y":6,"event":"mousemove"},{"x":105,"y":6,"event":"mousemove"},{"x":105,"y":5,"event":"mousemove"},{"x":106,"y":5,"event":"mousemove"},{"x":107,"y":5,"event":"mousemove"},{"x":108,"y":4,"event":"mousemove"},{"x":109,"y":4,"event":"mousemove"},{"x":109,"y":4,"event":"mousemove"},{"x":110,"y":4,"event":"mousemove"},{"x":111,"y":3,"event":"mousemove"},{"x":111,"y":3,"event":"mousemove"},{"x":112,"y":3,"event":"mousemove"},{"x":112,"y":3,"event":"mousemove"},{"x":112,"y":3,"event":"mousemove"},{"x":113,"y":3,"event":"mousemove"},{"x":113,"y":3,"event":"mousemove"},{"x":114,"y":3,"event":"mousemove"},{"x":114,"y":3,"event":"mousemove"},{"x":114,"y":3,"event":"mousemove"},{"x":115,"y":3,"event":"mousemove"},{"x":115,"y":3,"event":"mousemove"},{"x":115,"y":3,"event":"mousemove"},{"x":116,"y":3,"event":"mousemove"},{"x":117,"y":3,"event":"mousemove"},{"x":117,"y":3,"event":"mousemove"},{"x":118,"y":3,"event":"mousemove"},{"x":118,"y":3,"event":"mousemove"},{"x":118,"y":3,"event":"mousemove"},{"x":118,"y":4,"event":"mousemove"},{"x":119,"y":4,"event":"mousemove"},{"x":119,"y":4,"event":"mousemove"},{"x":119,"y":4,"event":"mousemove"},{"x":119,"y":4,"event":"mousemove"},{"x":120,"y":5,"event":"mousemove"},{"x":120,"y":5,"event":"mousemove"},{"x":121,"y":5,"event":"mousemove"},{"x":121,"y":5,"event":"mousemove"},{"x":121,"y":5,"event":"mousemove"},{"x":122,"y":5,"event":"mousemove"},{"x":122,"y":5,"event":"mousemove"},{"x":122,"y":5,"event":"mousemove"},{"x":122,"y":5,"event":"mousemove"},{"x":123,"y":6,"event":"mousemove"},{"x":123,"y":6,"event":"mousemove"},{"x":123,"y":6,"event":"mousemove"},{"x":124,"y":7,"event":"mousemove"},{"x":124,"y":7,"event":"mousemove"},{"x":124,"y":7,"event":"mousemove"},{"x":125,"y":8,"event":"mousemove"},{"x":125,"y":8,"event":"mousemove"},{"x":126,"y":9,"event":"mousemove"},{"x":126,"y":9,"event":"mousemove"},{"x":127,"y":10,"event":"mousemove"},{"x":127,"y":10,"event":"mousemove"},{"x":127,"y":10,"event":"mousemove"},{"x":128,"y":10,"event":"mousemove"},{"x":128,"y":10,"event":"mousemove"},{"x":128,"y":11,"event":"mousemove"},{"x":128,"y":11,"event":"mousemove"},{"x":129,"y":11,"event":"mousemove"},{"x":129,"y":11,"event":"mousemove"},{"x":129,"y":11,"event":"mousemove"},{"x":130,"y":11,"event":"mousemove"},{"x":130,"y":11,"event":"mousemove"},{"x":131,"y":10,"event":"mousemove"},{"x":131,"y":10,"event":"mousemove"},{"x":131,"y":10,"event":"mousemove"},{"x":132,"y":10,"event":"mousemove"},{"x":132,"y":9,"event":"mousemove"},{"x":133,"y":9,"event":"mousemove"},{"x":136,"y":7,"event":"mousemove"},{"x":137,"y":6,"event":"mousemove"},{"x":137,"y":6,"event":"mousemove"},{"x":138,"y":6,"event":"mousemove"},{"x":138,"y":6,"event":"mousemove"},{"x":138,"y":6,"event":"mousemove"},{"x":139,"y":6,"event":"mousemove"},{"x":139,"y":6,"event":"mousemove"},{"x":140,"y":6,"event":"mousemove"},{"x":140,"y":6,"event":"mousemove"},{"x":140,"y":6,"event":"mousemove"},{"x":141,"y":6,"event":"mousemove"},{"x":141,"y":6,"event":"mousemove"},{"x":142,"y":6,"event":"mousemove"},{"x":142,"y":6,"event":"mousemove"},{"x":142,"y":6,"event":"mousemove"},{"x":143,"y":6,"event":"mousemove"},{"x":143,"y":6,"event":"mousemove"},{"x":144,"y":5,"event":"mousemove"},{"x":144,"y":5,"event":"mousemove"},{"x":145,"y":5,"event":"mousemove"},{"x":146,"y":5,"event":"mousemove"},{"x":146,"y":5,"event":"mousemove"},{"x":146,"y":5,"event":"mousemove"},{"x":147,"y":5,"event":"mousemove"},{"x":147,"y":5,"event":"mousemove"},{"x":148,"y":5,"event":"mousemove"},{"x":148,"y":5,"event":"mousemove"},{"x":149,"y":5,"event":"mousemove"},{"x":149,"y":5,"event":"mousemove"},{"x":149,"y":5,"event":"mousemove"},{"x":150,"y":5,"event":"mousemove"},{"x":151,"y":4,"event":"mousemove"},{"x":152,"y":4,"event":"mousemove"},{"x":152,"y":4,"event":"mousemove"},{"x":153,"y":4,"event":"mousemove"},{"x":153,"y":4,"event":"mousemove"},{"x":153,"y":4,"event":"mousemove"},{"x":154,"y":4,"event":"mousemove"},{"x":155,"y":4,"event":"mousemove"},{"x":155,"y":3,"event":"mousemove"},{"x":156,"y":3,"event":"mousemove"},{"x":157,"y":3,"event":"mousemove"},{"x":158,"y":3,"event":"mousemove"},{"x":158,"y":3,"event":"mousemove"},{"x":159,"y":3,"event":"mousemove"},{"x":159,"y":3,"event":"mousemove"},{"x":159,"y":3,"event":"mousemove"},{"x":160,"y":3,"event":"mousemove"},{"x":160,"y":3,"event":"mousemove"},{"x":160,"y":3,"event":"mousemove"},{"x":161,"y":3,"event":"mousemove"},{"x":161,"y":3,"event":"mousemove"},{"x":162,"y":3,"event":"mousemove"},{"x":162,"y":3,"event":"mousemove"},{"x":162,"y":3,"event":"mousemove"},{"x":163,"y":3,"event":"mousemove"},{"x":163,"y":3,"event":"mousemove"},{"x":163,"y":3,"event":"mousemove"},{"x":164,"y":4,"event":"mousemove"},{"x":164,"y":4,"event":"mousemove"},{"x":164,"y":4,"event":"mousemove"},{"x":164,"y":5,"event":"mousemove"},{"x":164,"y":5,"event":"mousemove"},{"x":164,"y":5,"event":"mousemove"},{"x":165,"y":5,"event":"mousemove"},{"x":165,"y":6,"event":"mousemove"},{"x":165,"y":6,"event":"mousemove"},{"x":165,"y":6,"event":"mousemove"},{"x":165,"y":6,"event":"mousemove"},{"x":165,"y":6,"event":"mousemove"},{"x":166,"y":7,"event":"mousemove"},{"x":166,"y":7,"event":"mousemove"},{"x":166,"y":7,"event":"mousemove"},{"x":166,"y":7,"event":"mousemove"},{"x":167,"y":7,"event":"mousemove"},{"x":167,"y":7,"event":"mousemove"},{"x":167,"y":8,"event":"mousemove"},{"x":168,"y":8,"event":"mousemove"},{"x":168,"y":8,"event":"mousemove"},{"x":168,"y":9,"event":"mousemove"},{"x":168,"y":9,"event":"mousemove"},{"x":168,"y":9,"event":"mousemove"},{"x":169,"y":9,"event":"mousemove"},{"x":169,"y":9,"event":"mousemove"},{"x":170,"y":9,"event":"mousemove"},{"x":170,"y":9,"event":"mousemove"},{"x":172,"y":8,"event":"mousemove"},{"x":172,"y":8,"event":"mousemove"},{"x":173,"y":8,"event":"mousemove"},{"x":174,"y":8,"event":"mousemove"},{"x":174,"y":7,"event":"mousemove"},{"x":174,"y":7,"event":"mousemove"},{"x":175,"y":7,"event":"mousemove"},{"x":175,"y":7,"event":"mousemove"},{"x":176,"y":6,"event":"mousemove"},{"x":176,"y":6,"event":"mousemove"},{"x":177,"y":6,"event":"mousemove"},{"x":178,"y":6,"event":"mousemove"},{"x":178,"y":6,"event":"mousemove"},{"x":179,"y":5,"event":"mousemove"},{"x":179,"y":5,"event":"mousemove"},{"x":180,"y":5,"event":"mousemove"},{"x":180,"y":5,"event":"mousemove"},{"x":181,"y":4,"event":"mousemove"},{"x":182,"y":4,"event":"mousemove"},{"x":182,"y":4,"event":"mousemove"},{"x":183,"y":4,"event":"mousemove"},{"x":183,"y":4,"event":"mousemove"},{"x":184,"y":4,"event":"mousemove"},{"x":185,"y":4,"event":"mousemove"},{"x":185,"y":4,"event":"mousemove"},{"x":186,"y":4,"event":"mousemove"},{"x":187,"y":4,"event":"mousemove"},{"x":187,"y":3,"event":"mousemove"},{"x":187,"y":3,"event":"mousemove"},{"x":188,"y":3,"event":"mousemove"},{"x":188,"y":3,"event":"mousemove"},{"x":189,"y":3,"event":"mousemove"},{"x":189,"y":3,"event":"mousemove"},{"x":191,"y":3,"event":"mousemove"},{"x":193,"y":3,"event":"mousemove"},{"x":193,"y":3,"event":"mousemove"},{"x":194,"y":3,"event":"mousemove"},{"x":194,"y":3,"event":"mousemove"},{"x":195,"y":3,"event":"mousemove"},{"x":196,"y":3,"event":"mousemove"},{"x":197,"y":3,"event":"mousemove"},{"x":197,"y":3,"event":"mousemove"},{"x":200,"y":3,"event":"mousemove"},{"x":201,"y":3,"event":"mousemove"},{"x":202,"y":4,"event":"mousemove"},{"x":203,"y":4,"event":"mousemove"},{"x":204,"y":4,"event":"mousemove"},{"x":205,"y":4,"event":"mousemove"},{"x":206,"y":4,"event":"mousemove"},{"x":207,"y":5,"event":"mousemove"},{"x":207,"y":5,"event":"mousemove"},{"x":208,"y":5,"event":"mousemove"},{"x":209,"y":5,"event":"mousemove"},{"x":210,"y":5,"event":"mousemove"},{"x":211,"y":5,"event":"mousemove"},{"x":212,"y":6,"event":"mousemove"},{"x":212,"y":6,"event":"mousemove"},{"x":212,"y":6,"event":"mousemove"},{"x":212,"y":7,"event":"mousemove"},{"x":212,"y":7,"event":"mousemove"},{"x":212,"y":7,"event":"mousemove"},{"x":212,"y":8,"event":"mousemove"},{"x":213,"y":8,"event":"mousemove"},{"x":213,"y":8,"event":"mousemove"},{"x":213,"y":9,"event":"mousemove"},{"x":213,"y":9,"event":"mousemove"},{"x":213,"y":9,"event":"mousemove"},{"x":213,"y":10,"event":"mousemove"},{"x":213,"y":11,"event":"mousemove"},{"x":213,"y":11,"event":"mousemove"},{"x":213,"y":12,"event":"mousemove"},{"x":213,"y":12,"event":"mousemove"},{"x":213,"y":12,"event":"mousemove"},{"x":213,"y":12,"event":"mousemove"},{"x":213,"y":13,"event":"mousemove"},{"x":213,"y":13,"event":"mousemove"},{"x":213,"y":13,"event":"mousemove"},{"x":212,"y":13,"event":"mousemove"},{"x":212,"y":14,"event":"mousemove"},{"x":212,"y":14,"event":"mousemove"},{"x":212,"y":14,"event":"mousemove"},{"x":211,"y":14,"event":"mousemove"},{"x":211,"y":15,"event":"mousemove"},{"x":211,"y":15,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":211,"y":17,"event":"mousedown"},{"x":211,"y":17,"event":"mousemove"},{"x":217,"y":19,"event":"mousemove"},{"x":218,"y":20,"event":"mousemove"},{"x":218,"y":20,"event":"mousemove"},{"x":218,"y":20,"event":"mousemove"},{"x":219,"y":20,"event":"mousemove"},{"x":219,"y":21,"event":"mousemove"},{"x":219,"y":22,"event":"mousemove"},{"x":220,"y":22,"event":"mousemove"},{"x":220,"y":22,"event":"mousemove"},{"x":220,"y":23,"event":"mousemove"},{"x":220,"y":23,"event":"mousemove"},{"x":220,"y":24,"event":"mousemove"},{"x":220,"y":24,"event":"mousemove"},{"x":221,"y":24,"event":"mousemove"},{"x":221,"y":25,"event":"mousemove"},{"x":221,"y":26,"event":"mousemove"},{"x":221,"y":26,"event":"mousemove"},{"x":221,"y":27,"event":"mousemove"},{"x":221,"y":28,"event":"mousemove"},{"x":221,"y":29,"event":"mousemove"},{"x":222,"y":30,"event":"mousemove"},{"x":222,"y":30,"event":"mousemove"},{"x":222,"y":31,"event":"mousemove"},{"x":222,"y":31,"event":"mousemove"},{"x":222,"y":31,"event":"mousemove"},{"x":223,"y":32,"event":"mousemove"},{"x":223,"y":32,"event":"mousemove"},{"x":223,"y":32,"event":"mousemove"},{"x":223,"y":33,"event":"mousemove"},{"x":223,"y":33,"event":"mousemove"},{"x":223,"y":33,"event":"mousemove"},{"x":223,"y":34,"event":"mousemove"},{"x":223,"y":34,"event":"mousemove"},{"x":224,"y":35,"event":"mousemove"},{"x":224,"y":35,"event":"mousemove"},{"x":224,"y":35,"event":"mousemove"},{"x":224,"y":38,"event":"mousemove"},{"x":224,"y":38,"event":"mousemove"},{"x":224,"y":39,"event":"mousemove"},{"x":224,"y":39,"event":"mousemove"},{"x":224,"y":39,"event":"mousemove"},{"x":224,"y":40,"event":"mousemove"},{"x":224,"y":41,"event":"mousemove"},{"x":224,"y":42,"event":"mousemove"},{"x":224,"y":42,"event":"mousemove"},{"x":224,"y":42,"event":"mousemove"},{"x":224,"y":43,"event":"mousemove"},{"x":224,"y":43,"event":"mousemove"},{"x":224,"y":44,"event":"mousemove"},{"x":225,"y":44,"event":"mousemove"},{"x":224,"y":44,"event":"mousemove"},{"x":224,"y":45,"event":"mousemove"},{"x":224,"y":45,"event":"mousemove"},{"x":223,"y":45,"event":"mousemove"},{"x":223,"y":45,"event":"mousemove"},{"x":221,"y":46,"event":"mousemove"},{"x":221,"y":46,"event":"mousemove"},{"x":221,"y":46,"event":"mousemove"},{"x":220,"y":47,"event":"mousemove"},{"x":219,"y":48,"event":"mousemove"},{"x":219,"y":48,"event":"mousemove"},{"x":219,"y":48,"event":"mousemove"},{"x":218,"y":49,"event":"mousemove"},{"x":218,"y":49,"event":"mousemove"},{"x":217,"y":49,"event":"mousemove"},{"x":216,"y":50,"event":"mousemove"},{"x":216,"y":50,"event":"mousemove"},{"x":215,"y":50,"event":"mousemove"},{"x":215,"y":51,"event":"mousemove"},{"x":214,"y":51,"event":"mousemove"},{"x":214,"y":51,"event":"mousemove"},{"x":214,"y":51,"event":"mousemove"},{"x":214,"y":52,"event":"mousemove"},{"x":213,"y":52,"event":"mousemove"},{"x":213,"y":52,"event":"mousemove"},{"x":212,"y":53,"event":"mousemove"},{"x":212,"y":53,"event":"mousemove"},{"x":212,"y":53,"event":"mousemove"},{"x":212,"y":54,"event":"mousemove"},{"x":212,"y":55,"event":"mousemove"},{"x":212,"y":55,"event":"mousemove"},{"x":212,"y":56,"event":"mousemove"},{"x":212,"y":57,"event":"mousemove"},{"x":212,"y":57,"event":"mousemove"},{"x":212,"y":58,"event":"mousemove"},{"x":212,"y":58,"event":"mousemove"},{"x":212,"y":59,"event":"mousemove"},{"x":212,"y":59,"event":"mousemove"},{"x":212,"y":59,"event":"mousemove"},{"x":212,"y":61,"event":"mousemove"},{"x":212,"y":62,"event":"mousemove"},{"x":212,"y":62,"event":"mousemove"},{"x":212,"y":63,"event":"mousemove"},{"x":212,"y":63,"event":"mousemove"},{"x":212,"y":64,"event":"mousemove"},{"x":211,"y":65,"event":"mousemove"},{"x":210,"y":69,"event":"mousemove"},{"x":209,"y":71,"event":"mousemove"},{"x":209,"y":72,"event":"mousemove"},{"x":209,"y":72,"event":"mousemove"},{"x":209,"y":73,"event":"mousemove"},{"x":208,"y":73,"event":"mousemove"},{"x":208,"y":74,"event":"mousemove"},{"x":208,"y":74,"event":"mousemove"},{"x":208,"y":74,"event":"mousemove"},{"x":208,"y":75,"event":"mousemove"},{"x":207,"y":75,"event":"mousemove"},{"x":207,"y":75,"event":"mousemove"},{"x":207,"y":75,"event":"mousemove"},{"x":207,"y":76,"event":"mousemove"},{"x":207,"y":76,"event":"mousemove"},{"x":207,"y":76,"event":"mousemove"},{"x":206,"y":77,"event":"mousemove"},{"x":205,"y":78,"event":"mousemove"},{"x":205,"y":78,"event":"mousemove"},{"x":203,"y":79,"event":"mousemove"},{"x":202,"y":80,"event":"mousemove"},{"x":202,"y":80,"event":"mousemove"},{"x":200,"y":81,"event":"mousemove"},{"x":200,"y":81,"event":"mousemove"},{"x":200,"y":81,"event":"mousemove"},{"x":199,"y":81,"event":"mousemove"},{"x":199,"y":81,"event":"mousemove"},{"x":196,"y":81,"event":"mousemove"},{"x":196,"y":81,"event":"mousemove"},{"x":195,"y":81,"event":"mousemove"},{"x":194,"y":81,"event":"mousemove"},{"x":194,"y":81,"event":"mousemove"},{"x":194,"y":81,"event":"mousemove"},{"x":193,"y":81,"event":"mousemove"},{"x":193,"y":81,"event":"mousemove"},{"x":192,"y":81,"event":"mousemove"},{"x":191,"y":81,"event":"mousemove"},{"x":189,"y":81,"event":"mousemove"},{"x":189,"y":81,"event":"mousemove"},{"x":188,"y":81,"event":"mousemove"},{"x":187,"y":81,"event":"mousemove"},{"x":184,"y":80,"event":"mousemove"},{"x":184,"y":80,"event":"mousemove"},{"x":183,"y":80,"event":"mousemove"},{"x":182,"y":80,"event":"mousemove"},{"x":181,"y":79,"event":"mousemove"},{"x":181,"y":79,"event":"mousemove"},{"x":181,"y":79,"event":"mousemove"},{"x":180,"y":79,"event":"mousemove"},{"x":179,"y":79,"event":"mousemove"},{"x":179,"y":79,"event":"mousemove"},{"x":178,"y":79,"event":"mousemove"},{"x":178,"y":79,"event":"mousemove"},{"x":177,"y":79,"event":"mousemove"},{"x":177,"y":79,"event":"mousemove"},{"x":176,"y":79,"event":"mousemove"},{"x":176,"y":79,"event":"mousemove"},{"x":175,"y":80,"event":"mousemove"},{"x":175,"y":80,"event":"mousemove"},{"x":175,"y":81,"event":"mousemove"},{"x":175,"y":81,"event":"mousemove"},{"x":175,"y":81,"event":"mousemove"},{"x":175,"y":81,"event":"mousemove"},{"x":174,"y":82,"event":"mousemove"},{"x":174,"y":82,"event":"mousemove"},{"x":174,"y":83,"event":"mousemove"},{"x":172,"y":85,"event":"mousemove"},{"x":171,"y":86,"event":"mousemove"},{"x":171,"y":87,"event":"mousemove"},{"x":170,"y":87,"event":"mousemove"},{"x":170,"y":88,"event":"mousemove"},{"x":169,"y":89,"event":"mousemove"},{"x":169,"y":89,"event":"mousemove"},{"x":169,"y":89,"event":"mousemove"},{"x":169,"y":89,"event":"mousemove"},{"x":169,"y":90,"event":"mousemove"},{"x":168,"y":90,"event":"mousemove"},{"x":168,"y":90,"event":"mousemove"},{"x":168,"y":90,"event":"mousemove"},{"x":168,"y":90,"event":"mousemove"},{"x":165,"y":91,"event":"mousemove"},{"x":164,"y":91,"event":"mousemove"},{"x":164,"y":91,"event":"mousemove"},{"x":163,"y":91,"event":"mousemove"},{"x":163,"y":91,"event":"mousemove"},{"x":163,"y":91,"event":"mousemove"},{"x":162,"y":91,"event":"mousemove"},{"x":162,"y":91,"event":"mousemove"},{"x":162,"y":91,"event":"mousemove"},{"x":160,"y":91,"event":"mousemove"},{"x":158,"y":91,"event":"mousemove"},{"x":157,"y":92,"event":"mousemove"},{"x":155,"y":92,"event":"mousemove"},{"x":154,"y":92,"event":"mousemove"},{"x":146,"y":94,"event":"mousemove"},{"x":144,"y":94,"event":"mousemove"},{"x":144,"y":94,"event":"mousemove"},{"x":143,"y":95,"event":"mousemove"},{"x":142,"y":95,"event":"mousemove"},{"x":142,"y":95,"event":"mousemove"},{"x":142,"y":95,"event":"mousemove"},{"x":141,"y":95,"event":"mousemove"},{"x":140,"y":94,"event":"mousemove"},{"x":140,"y":93,"event":"mousemove"},{"x":140,"y":93,"event":"mousemove"},{"x":140,"y":93,"event":"mousemove"},{"x":140,"y":93,"event":"mousemove"},{"x":139,"y":91,"event":"mousemove"},{"x":139,"y":91,"event":"mousemove"},{"x":139,"y":91,"event":"mousemove"},{"x":138,"y":90,"event":"mousemove"},{"x":138,"y":90,"event":"mousemove"},{"x":137,"y":89,"event":"mousemove"},{"x":136,"y":89,"event":"mousemove"},{"x":136,"y":89,"event":"mousemove"},{"x":135,"y":88,"event":"mousemove"},{"x":135,"y":88,"event":"mousemove"},{"x":135,"y":88,"event":"mousemove"},{"x":135,"y":88,"event":"mousemove"},{"x":131,"y":87,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":128,"y":86,"event":"mousedown"},{"x":128,"y":86,"event":"mousemove"},{"x":126,"y":87,"event":"mousemove"},{"x":126,"y":87,"event":"mousemove"},{"x":125,"y":88,"event":"mousemove"},{"x":125,"y":88,"event":"mousemove"},{"x":124,"y":88,"event":"mousemove"},{"x":124,"y":88,"event":"mousemove"},{"x":123,"y":88,"event":"mousemove"},{"x":123,"y":89,"event":"mousemove"},{"x":121,"y":89,"event":"mousemove"},{"x":121,"y":89,"event":"mousemove"},{"x":120,"y":90,"event":"mousemove"},{"x":120,"y":90,"event":"mousemove"},{"x":119,"y":90,"event":"mousemove"},{"x":118,"y":91,"event":"mousemove"},{"x":116,"y":92,"event":"mousemove"},{"x":115,"y":92,"event":"mousemove"},{"x":114,"y":92,"event":"mousemove"},{"x":112,"y":93,"event":"mousemove"},{"x":112,"y":93,"event":"mousemove"},{"x":112,"y":93,"event":"mousemove"},{"x":111,"y":93,"event":"mousemove"},{"x":111,"y":94,"event":"mousemove"},{"x":110,"y":94,"event":"mousemove"},{"x":110,"y":94,"event":"mousemove"},{"x":109,"y":94,"event":"mousemove"},{"x":109,"y":95,"event":"mousemove"},{"x":108,"y":95,"event":"mousemove"},{"x":108,"y":95,"event":"mousemove"},{"x":105,"y":96,"event":"mousemove"},{"x":105,"y":96,"event":"mousemove"},{"x":104,"y":96,"event":"mousemove"},{"x":104,"y":96,"event":"mousemove"},{"x":102,"y":96,"event":"mousemove"},{"x":101,"y":96,"event":"mousemove"},{"x":100,"y":96,"event":"mousemove"},{"x":100,"y":96,"event":"mousemove"},{"x":96,"y":96,"event":"mousemove"},{"x":96,"y":96,"event":"mousemove"},{"x":95,"y":96,"event":"mousemove"},{"x":95,"y":96,"event":"mousemove"},{"x":95,"y":96,"event":"mousemove"},{"x":94,"y":96,"event":"mousemove"},{"x":94,"y":96,"event":"mousemove"},{"x":93,"y":96,"event":"mousemove"},{"x":93,"y":96,"event":"mousemove"},{"x":93,"y":96,"event":"mousemove"},{"x":92,"y":96,"event":"mousemove"},{"x":91,"y":96,"event":"mousemove"},{"x":91,"y":96,"event":"mousemove"},{"x":90,"y":96,"event":"mousemove"},{"x":89,"y":96,"event":"mousemove"},{"x":89,"y":96,"event":"mousemove"},{"x":89,"y":96,"event":"mousemove"},{"x":89,"y":95,"event":"mousemove"},{"x":86,"y":94,"event":"mousemove"},{"x":85,"y":94,"event":"mousemove"},{"x":85,"y":94,"event":"mousemove"},{"x":83,"y":92,"event":"mousemove"},{"x":82,"y":91,"event":"mousemove"},{"x":81,"y":91,"event":"mousemove"},{"x":81,"y":91,"event":"mousemove"},{"x":81,"y":91,"event":"mousemove"},{"x":80,"y":91,"event":"mousemove"},{"x":79,"y":90,"event":"mousemove"},{"x":79,"y":90,"event":"mousemove"},{"x":79,"y":90,"event":"mousemove"},{"x":78,"y":89,"event":"mousemove"},{"x":78,"y":89,"event":"mousemove"},{"x":78,"y":89,"event":"mousemove"},{"x":78,"y":89,"event":"mousemove"},{"x":77,"y":89,"event":"mousemove"},{"x":77,"y":88,"event":"mousemove"},{"x":77,"y":88,"event":"mousemove"},{"x":77,"y":88,"event":"mousemove"},{"x":77,"y":88,"event":"mousemove"},{"x":77,"y":87,"event":"mousemove"},{"x":76,"y":86,"event":"mousemove"},{"x":76,"y":86,"event":"mousemove"},{"x":76,"y":86,"event":"mousemove"},{"x":76,"y":86,"event":"mousemove"},{"x":75,"y":86,"event":"mousemove"},{"x":75,"y":85,"event":"mousemove"},{"x":75,"y":85,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":75,"y":82,"event":"mousedown"},{"x":75,"y":83,"event":"mousemove"},{"x":74,"y":83,"event":"mousemove"},{"x":67,"y":86,"event":"mousemove"},{"x":65,"y":86,"event":"mousemove"},{"x":63,"y":87,"event":"mousemove"},{"x":62,"y":87,"event":"mousemove"},{"x":61,"y":87,"event":"mousemove"},{"x":60,"y":88,"event":"mousemove"},{"x":59,"y":89,"event":"mousemove"},{"x":58,"y":89,"event":"mousemove"},{"x":55,"y":90,"event":"mousemove"},{"x":55,"y":90,"event":"mousemove"},{"x":54,"y":91,"event":"mousemove"},{"x":53,"y":91,"event":"mousemove"},{"x":52,"y":91,"event":"mousemove"},{"x":52,"y":91,"event":"mousemove"},{"x":51,"y":92,"event":"mousemove"},{"x":51,"y":92,"event":"mousemove"},{"x":51,"y":92,"event":"mousemove"},{"x":50,"y":92,"event":"mousemove"},{"x":50,"y":91,"event":"mousemove"},{"x":48,"y":91,"event":"mousemove"},{"x":48,"y":90,"event":"mousemove"},{"x":46,"y":88,"event":"mousemove"},{"x":45,"y":87,"event":"mousemove"},{"x":45,"y":87,"event":"mousemove"},{"x":44,"y":86,"event":"mousemove"},{"x":44,"y":85,"event":"mousemove"},{"x":43,"y":85,"event":"mousemove"},{"x":43,"y":83,"event":"mousemove"},{"x":42,"y":83,"event":"mousemove"},{"x":41,"y":82,"event":"mousemove"},{"x":41,"y":82,"event":"mousemove"},{"x":40,"y":82,"event":"mousemove"},{"x":40,"y":81,"event":"mousemove"},{"x":40,"y":80,"event":"mousemove"},{"x":40,"y":80,"event":"mousemove"},{"x":40,"y":79,"event":"mousemove"},{"x":39,"y":78,"event":"mousemove"},{"x":39,"y":78,"event":"mousemove"},{"x":39,"y":77,"event":"mousemove"},{"x":39,"y":77,"event":"mousemove"},{"x":39,"y":76,"event":"mousemove"},{"x":38,"y":76,"event":"mousemove"},{"x":37,"y":76,"event":"mousemove"},{"x":36,"y":75,"event":"mousemove"},{"x":36,"y":75,"event":"mousemove"},{"x":36,"y":75,"event":"mousemove"},{"x":35,"y":75,"event":"mousemove"},{"x":35,"y":75,"event":"mousemove"},{"x":31,"y":73,"event":"mousemove"},{"x":30,"y":73,"event":"mousemove"},{"x":29,"y":72,"event":"mousemove"},{"x":28,"y":72,"event":"mousemove"},{"x":27,"y":71,"event":"mousemove"},{"x":27,"y":71,"event":"mousemove"},{"x":26,"y":71,"event":"mousemove"},{"x":26,"y":71,"event":"mousemove"},{"x":24,"y":70,"event":"mousemove"},{"x":24,"y":69,"event":"mousemove"},{"x":24,"y":69,"event":"mousemove"},{"x":23,"y":69,"event":"mousemove"},{"x":23,"y":69,"event":"mousemove"},{"x":22,"y":68,"event":"mousemove"},{"x":22,"y":68,"event":"mousemove"},{"x":22,"y":67,"event":"mousemove"},{"x":21,"y":67,"event":"mousemove"},{"x":21,"y":66,"event":"mousemove"},{"x":20,"y":66,"event":"mousemove"},{"x":18,"y":63,"event":"mousemove"},{"x":17,"y":63,"event":"mousemove"},{"x":17,"y":63,"event":"mousemove"},{"x":16,"y":62,"event":"mousemove"},{"x":16,"y":62,"event":"mousemove"},{"x":16,"y":61,"event":"mousemove"},{"x":16,"y":61,"event":"mousemove"},{"x":16,"y":61,"event":"mousemove"},{"x":16,"y":61,"event":"mousemove"},{"x":16,"y":61,"event":"mousemove"},{"x":15,"y":60,"event":"mousemove"},{"x":15,"y":59,"event":"mousemove"},{"x":15,"y":59,"event":"mousemove"},{"x":15,"y":59,"event":"mousemove"},{"x":15,"y":59,"event":"mousemove"},{"x":15,"y":58,"event":"mousemove"},{"x":15,"y":58,"event":"mousemove"},{"x":15,"y":58,"event":"mousemove"},{"x":15,"y":57,"event":"mousemove"},{"x":15,"y":57,"event":"mousemove"},{"x":15,"y":57,"event":"mousemove"},{"x":15,"y":56,"event":"mousemove"},{"x":15,"y":56,"event":"mousemove"},{"x":15,"y":56,"event":"mousemove"},{"x":15,"y":55,"event":"mousemove"},{"x":15,"y":54,"event":"mousemove"},{"x":15,"y":54,"event":"mousemove"},{"x":15,"y":53,"event":"mousemove"},{"x":15,"y":53,"event":"mousemove"},{"x":15,"y":53,"event":"mousemove"},{"x":15,"y":52,"event":"mousemove"},{"x":16,"y":51,"event":"mousemove"},{"x":17,"y":51,"event":"mousemove"},{"x":17,"y":50,"event":"mousemove"},{"x":17,"y":50,"event":"mousemove"},{"x":18,"y":50,"event":"mousemove"},{"x":18,"y":49,"event":"mousemove"},{"x":18,"y":49,"event":"mousemove"},{"x":19,"y":48,"event":"mousemove"},{"x":19,"y":48,"event":"mousemove"},{"x":19,"y":47,"event":"mousemove"},{"x":20,"y":47,"event":"mousemove"},{"x":20,"y":47,"event":"mousemove"},{"x":21,"y":47,"event":"mousemove"},{"x":21,"y":47,"event":"mousemove"},{"x":22,"y":47,"event":"mousemove"},{"x":22,"y":47,"event":"mousemove"},{"x":22,"y":46,"event":"mousemove"},{"x":23,"y":46,"event":"mousemove"},{"x":23,"y":46,"event":"mousemove"},{"x":23,"y":46,"event":"mousemove"}]},{"tool":"marker","color":"#FFF","size":markerWidth,"events":[{"x":24,"y":43,"event":"mousedown"},{"x":24,"y":42,"event":"mousemove"},{"x":24,"y":42,"event":"mousemove"},{"x":24,"y":42,"event":"mousemove"},{"x":23,"y":41,"event":"mousemove"},{"x":23,"y":41,"event":"mousemove"},{"x":23,"y":40,"event":"mousemove"},{"x":23,"y":40,"event":"mousemove"},{"x":23,"y":39,"event":"mousemove"},{"x":22,"y":39,"event":"mousemove"},{"x":22,"y":38,"event":"mousemove"},{"x":22,"y":38,"event":"mousemove"},{"x":22,"y":37,"event":"mousemove"},{"x":22,"y":36,"event":"mousemove"},{"x":22,"y":35,"event":"mousemove"},{"x":22,"y":35,"event":"mousemove"},{"x":22,"y":34,"event":"mousemove"},{"x":22,"y":33,"event":"mousemove"},{"x":22,"y":33,"event":"mousemove"},{"x":22,"y":32,"event":"mousemove"},{"x":22,"y":32,"event":"mousemove"},{"x":22,"y":31,"event":"mousemove"},{"x":22,"y":31,"event":"mousemove"},{"x":22,"y":30,"event":"mousemove"},{"x":22,"y":29,"event":"mousemove"},{"x":22,"y":29,"event":"mousemove"},{"x":22,"y":28,"event":"mousemove"},{"x":22,"y":27,"event":"mousemove"},{"x":22,"y":27,"event":"mousemove"},{"x":22,"y":26,"event":"mousemove"},{"x":22,"y":26,"event":"mousemove"},{"x":22,"y":25,"event":"mousemove"},{"x":23,"y":25,"event":"mousemove"},{"x":23,"y":25,"event":"mousemove"},{"x":23,"y":24,"event":"mousemove"},{"x":23,"y":24,"event":"mousemove"},{"x":23,"y":24,"event":"mousemove"},{"x":23,"y":23,"event":"mousemove"},{"x":23,"y":23,"event":"mousemove"},{"x":24,"y":23,"event":"mousemove"},{"x":24,"y":22,"event":"mousemove"},{"x":24,"y":22,"event":"mousemove"},{"x":24,"y":22,"event":"mousemove"},{"x":24,"y":22,"event":"mousemove"},{"x":25,"y":22,"event":"mousemove"},{"x":25,"y":21,"event":"mousemove"},{"x":25,"y":20,"event":"mousemove"},{"x":25,"y":20,"event":"mousemove"},{"x":26,"y":20,"event":"mousemove"},{"x":26,"y":20,"event":"mousemove"},{"x":26,"y":19,"event":"mousemove"},{"x":26,"y":19,"event":"mousemove"},{"x":26,"y":19,"event":"mousemove"},{"x":26,"y":18,"event":"mousemove"},{"x":27,"y":18,"event":"mousemove"},{"x":27,"y":18,"event":"mousemove"},{"x":27,"y":18,"event":"mousemove"},{"x":27,"y":18,"event":"mousemove"},{"x":27,"y":17,"event":"mousemove"},{"x":28,"y":17,"event":"mousemove"},{"x":28,"y":17,"event":"mousemove"},{"x":28,"y":17,"event":"mousemove"},{"x":28,"y":17,"event":"mousemove"},{"x":29,"y":17,"event":"mousemove"},{"x":29,"y":16,"event":"mousemove"},{"x":29,"y":16,"event":"mousemove"},{"x":30,"y":16,"event":"mousemove"},{"x":30,"y":16,"event":"mousemove"},{"x":30,"y":16,"event":"mousemove"},{"x":31,"y":16,"event":"mousemove"},{"x":31,"y":16,"event":"mousemove"},{"x":32,"y":16,"event":"mousemove"},{"x":33,"y":16,"event":"mousemove"},{"x":33,"y":16,"event":"mousemove"},{"x":33,"y":17,"event":"mousemove"},{"x":34,"y":17,"event":"mousemove"},{"x":34,"y":17,"event":"mousemove"},{"x":34,"y":17,"event":"mousemove"},{"x":35,"y":17,"event":"mousemove"},{"x":36,"y":17,"event":"mousemove"},{"x":37,"y":18,"event":"mousemove"},{"x":37,"y":18,"event":"mousemove"},{"x":38,"y":18,"event":"mousemove"},{"x":38,"y":19,"event":"mousemove"},{"x":38,"y":19,"event":"mousemove"},{"x":39,"y":19,"event":"mousemove"},{"x":39,"y":19,"event":"mousemove"},{"x":39,"y":20,"event":"mousemove"},{"x":39,"y":20,"event":"mousemove"},{"x":40,"y":20,"event":"mousemove"},{"x":40,"y":20,"event":"mousemove"},{"x":40,"y":20,"event":"mousemove"},{"x":40,"y":21,"event":"mousemove"},{"x":41,"y":21,"event":"mousemove"},{"x":41,"y":21,"event":"mousemove"},{"x":41,"y":20,"event":"mousemove"},{"x":41,"y":20,"event":"mousemove"},{"x":41,"y":19,"event":"mousemove"},{"x":41,"y":19,"event":"mousemove"},{"x":41,"y":19,"event":"mousemove"},{"x":41,"y":18,"event":"mousemove"},{"x":41,"y":18,"event":"mousemove"},{"x":41,"y":18,"event":"mousemove"},{"x":41,"y":17,"event":"mousemove"},{"x":41,"y":17,"event":"mousemove"},{"x":41,"y":17,"event":"mousemove"},{"x":41,"y":16,"event":"mousemove"},{"x":41,"y":16,"event":"mousemove"},{"x":41,"y":15,"event":"mousemove"},{"x":41,"y":15,"event":"mousemove"},{"x":41,"y":15,"event":"mousemove"},{"x":41,"y":14,"event":"mousemove"},{"x":42,"y":14,"event":"mousemove"},{"x":42,"y":14,"event":"mousemove"},{"x":43,"y":13,"event":"mousemove"},{"x":44,"y":12,"event":"mousemove"},{"x":44,"y":12,"event":"mousemove"},{"x":44,"y":11,"event":"mousemove"},{"x":45,"y":11,"event":"mousemove"},{"x":45,"y":11,"event":"mousemove"},{"x":45,"y":10,"event":"mousemove"},{"x":45,"y":10,"event":"mousemove"},{"x":45,"y":10,"event":"mousemove"},{"x":46,"y":10,"event":"mousemove"},{"x":46,"y":10,"event":"mousemove"},{"x":46,"y":9,"event":"mousemove"},{"x":47,"y":9,"event":"mousemove"},{"x":47,"y":9,"event":"mousemove"},{"x":47,"y":9,"event":"mousemove"},{"x":48,"y":9,"event":"mousemove"},{"x":48,"y":8,"event":"mousemove"},{"x":48,"y":8,"event":"mousemove"},{"x":49,"y":8,"event":"mousemove"},{"x":49,"y":8,"event":"mousemove"},{"x":49,"y":8,"event":"mousemove"},{"x":50,"y":7,"event":"mousemove"},{"x":50,"y":7,"event":"mousemove"},{"x":50,"y":7,"event":"mousemove"},{"x":51,"y":7,"event":"mousemove"},{"x":51,"y":7,"event":"mousemove"},{"x":51,"y":7,"event":"mousemove"},{"x":52,"y":7,"event":"mousemove"},{"x":52,"y":6,"event":"mousemove"},{"x":53,"y":6,"event":"mousemove"},{"x":53,"y":6,"event":"mousemove"},{"x":53,"y":6,"event":"mousemove"},{"x":53,"y":6,"event":"mousemove"},{"x":54,"y":6,"event":"mousemove"},{"x":54,"y":6,"event":"mousemove"},{"x":55,"y":6,"event":"mousemove"},{"x":55,"y":5,"event":"mousemove"},{"x":57,"y":5,"event":"mousemove"},{"x":57,"y":5,"event":"mousemove"},{"x":58,"y":5,"event":"mousemove"},{"x":58,"y":5,"event":"mousemove"},{"x":59,"y":5,"event":"mousemove"},{"x":59,"y":5,"event":"mousemove"},{"x":60,"y":5,"event":"mousemove"},{"x":60,"y":5,"event":"mousemove"},{"x":60,"y":5,"event":"mousemove"},{"x":61,"y":5,"event":"mousemove"},{"x":61,"y":5,"event":"mousemove"},{"x":62,"y":5,"event":"mousemove"},{"x":62,"y":5,"event":"mousemove"},{"x":63,"y":5,"event":"mousemove"},{"x":63,"y":5,"event":"mousemove"},{"x":64,"y":5,"event":"mousemove"},{"x":64,"y":5,"event":"mousemove"},{"x":65,"y":5,"event":"mousemove"},{"x":65,"y":5,"event":"mousemove"},{"x":66,"y":5,"event":"mousemove"},{"x":66,"y":5,"event":"mousemove"},{"x":67,"y":5,"event":"mousemove"},{"x":67,"y":5,"event":"mousemove"},{"x":67,"y":5,"event":"mousemove"},{"x":68,"y":5,"event":"mousemove"},{"x":68,"y":5,"event":"mousemove"},{"x":68,"y":5,"event":"mousemove"},{"x":69,"y":5,"event":"mousemove"},{"x":69,"y":6,"event":"mousemove"},{"x":69,"y":6,"event":"mousemove"},{"x":70,"y":6,"event":"mousemove"},{"x":70,"y":6,"event":"mousemove"},{"x":70,"y":6,"event":"mousemove"},{"x":71,"y":6,"event":"mousemove"},{"x":71,"y":6,"event":"mousemove"},{"x":71,"y":6,"event":"mousemove"},{"x":72,"y":7,"event":"mousemove"},{"x":72,"y":7,"event":"mousemove"},{"x":73,"y":7,"event":"mousemove"},{"x":73,"y":8,"event":"mousemove"},{"x":73,"y":8,"event":"mousemove"},{"x":74,"y":8,"event":"mousemove"},{"x":74,"y":8,"event":"mousemove"},{"x":75,"y":9,"event":"mousemove"},{"x":75,"y":10,"event":"mousemove"},{"x":76,"y":10,"event":"mousemove"},{"x":76,"y":10,"event":"mousemove"},{"x":76,"y":10,"event":"mousemove"},{"x":77,"y":10,"event":"mousemove"},{"x":77,"y":10,"event":"mousemove"},{"x":78,"y":10,"event":"mousemove"},{"x":78,"y":10,"event":"mousemove"},{"x":79,"y":11,"event":"mousemove"},{"x":80,"y":11,"event":"mousemove"},{"x":80,"y":11,"event":"mousemove"},{"x":81,"y":11,"event":"mousemove"},{"x":81,"y":11,"event":"mousemove"},{"x":81,"y":11,"event":"mousemove"},{"x":82,"y":11,"event":"mousemove"},{"x":82,"y":11,"event":"mousemove"},{"x":82,"y":11,"event":"mousemove"},{"x":82,"y":12,"event":"mousemove"},{"x":82,"y":12,"event":"mousemove"},{"x":83,"y":12,"event":"mousemove"},{"x":83,"y":12,"event":"mousemove"},{"x":84,"y":12,"event":"mousemove"},{"x":84,"y":12,"event":"mousemove"},{"x":84,"y":13,"event":"mousemove"},{"x":85,"y":13,"event":"mousemove"},{"x":85,"y":13,"event":"mousemove"},{"x":85,"y":14,"event":"mousemove"},{"x":86,"y":14,"event":"mousemove"},{"x":86,"y":14,"event":"mousemove"},{"x":86,"y":14,"event":"mousemove"},{"x":87,"y":14,"event":"mousemove"},{"x":87,"y":14,"event":"mousemove"},{"x":87,"y":14,"event":"mousemove"},{"x":88,"y":14,"event":"mousemove"}]}]
}





///////////////////////////////////////////////////////////////////////////////////////////



//------login-login-login--------------------------------------------------------/
function login(){
// initialize
  $('#whoAreYou').foundation('reveal', 'open');
  $('.authentication').hide().addClass('hidden');
  $('#authentication-button').on('click', clickLoginSignUp);
  $('.register').on('click', clickRegisterOnly);
  $('.signUp').on('click', clickSignUp);
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

function clickRegisterOnly(e){
  $('#whoAreYou').foundation('reveal', 'close');
  $('#content').removeClass('hidden');
  $('#registration-form').removeClass('hidden');
  $('#registration-form input[name="username"]').val($('.authentication input[name="username"]').val());
  $('#registration-form input[name="password"]').val($('.authentication input[name="password"]').val());
  $('#registration-form input[name="email"]').focus();
  $('.authentication input[name="username"]').val('');
  $('.authentication input[name="password"]').val('');
  e.preventDefault();
}

function clickSignUp(e){
  $('.register').hide();
  var url = '/users';
  var data = $('form#registration-form').serialize();
  // console.log(data);
  sendAjaxRequest(url, data, 'post', null, e, function(status){
    htmlCompletedRegistrationAttempt(status, 'registration');
    url = '/login';
    // data = $('form#registration-form').serialize();
    // console.log(data);
    sendAjaxRequest(url, data, 'post', 'put', e, function(data){
      // console.log(data);
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
  });
}

function clickLogin(e){
  $('#whoAreYou').hide();
  var url = '/login';
  var data = $('form.authentication').serialize();
  // console.log(data);
  sendAjaxRequest(url, data, 'post', 'put', e, function(data){
    // console.log(data);
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
  // console.log(url);
  sendAjaxRequest(url, {}, 'post', 'put', null, function(data){
    //$('table#adminList input[data-id='+id+']').attr('checked', data.isAdmin);
  });

}

///////////////////////////////////////////////////////////////////////////////////////////

function htmlCompletedRegistrationAttempt(data, logOrReg){
  // console.log(data);
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
    window.location.href = '/';
    window.location.reload();

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
  var response = parseFloat($('#response').val());
  if(isNaN(response)){
    alert('That is not a valid response.');
    $('#response').val('').focus();
    return;
  }
  $('#response').attr('disabled','disabled');
  $('#submitResponse').off('click').addClass('disabled').fadeOut(500);
  // console.log(response);
  var question = $('#submitResponse').attr('data-question-id');
  // sendAjaxRequest(url, data, verb, altVerb, event, successFn)
  // console.log('question #:'+question);
  sendAjaxRequest('/response', {response:response, question:question}, 'post', null, null, function(data){
    // console.log(data);
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
    var numberDone = $('a.correct, a.wrong').length;
    // console.log(numberDone);
    if(data.numberOfQuestions === numberDone){
      window.location.href = '/results/'+data.response.assessment+'/'+data.user;
    }
  });

}

///////////////////////////////////////////////////////////////////////////////////////////
//--------------------------------------------------------------------------------/
///////////////////////////////////////////////////////////////////////////////////

function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';

  socket = io.connect(url);
  socket.on('connected', socketConnected);
}

function socketConnected(data){
  // console.log(data);
}

function checkFileReaderFunctionality(){
    // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}