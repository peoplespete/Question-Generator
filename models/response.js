var mongoose = require('mongoose');

var Response = mongoose.Schema({
  text: String,
  numbers: [Number],
  correctAnswer: Number,
  userAnswer: Number,
  assessment: {type: mongoose.Schema.Types.ObjectId, ref:'Assessment'},
  createdAt: {type:Date, default: Date.now}
});

mongoose.model('Response', Response);

  // questions: [{type: mongoose.Schema.Types.ObjectId, ref:'Response'}],
