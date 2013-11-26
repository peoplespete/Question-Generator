var mongoose = require('mongoose');

var Response = mongoose.Schema({
  numbers: [Number],
  isCorrect: {type:Number, default:2},//2 means unassigned (0 wrong, 1 correct)
  index: Number,
  correctAnswer: Number,
  userAnswer: Number,
  question: {type: mongoose.Schema.Types.ObjectId, ref:'Question'},
  assessment: {type: mongoose.Schema.Types.ObjectId, ref:'Assessment'},
  user: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
  createdAt: {type:Date, default: Date.now}
});

mongoose.model('Response', Response);

  // questions: [{type: mongoose.Schema.Types.ObjectId, ref:'Response'}],
