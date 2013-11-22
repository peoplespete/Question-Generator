var mongoose = require('mongoose');

var Response = mongoose.Schema({
  numbers: [Number],
  correctAnswer: Number,
  userAnswer: Number,
  question: {type: mongoose.Schema.Types.ObjectId, ref:'Question'},
  user: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
  createdAt: {type:Date, default: Date.now}
});

mongoose.model('Response', Response);

  // questions: [{type: mongoose.Schema.Types.ObjectId, ref:'Response'}],
