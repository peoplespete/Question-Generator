var mongoose = require('mongoose');

var Question = mongoose.Schema({
  text: String,
  numbersActual: [Number],
  numbersRange: {},
  howToSolve: [],
  assessment: {type: mongoose.Schema.Types.ObjectId, ref:'Assessment'},
  createdAt: {type:Date, default: Date.now}
});

mongoose.model('Question', Question);

  // questions: [{type: mongoose.Schema.Types.ObjectId, ref:'Question'}],
