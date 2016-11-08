var express = require('express'),
    quoter  = require('./quoter');

var app = module.exports = express.Router();

app.get('/api/random-quote', function(req, res) {
  //temporary just to see how it handles error messages
  res.status(200).send(quoter.getRandomOne());
   //return res.status(400).send("just a test errror message.");
});
