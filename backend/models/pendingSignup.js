const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pendingSignupSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('pendingSignup', pendingSignupSchema); 