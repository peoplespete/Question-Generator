var mongoose = require('mongoose');

var Assessment = mongoose.Schema({
  instructions: String,
  createdAt: {type:Date, default: Date.now}
});

mongoose.model('Assessment', Assessment);
