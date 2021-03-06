// var express = require('express'),     jwt     = require('express-jwt'),
// config  = require('./config'),     quoter  = require('./quoter');

import express from 'express';
import jwt from 'express-jwt';
import config from './config';
import quoter from './quoter';

var app = module.exports = express.Router();

var jwtCheck = () => {
  console.log("ZOMG very secret: " + config.secret);
  jwt({secret: config.secret});
}

app.use('/api/protected', jwtCheck);

app.get('/api/protected/random-quote', function (req, res) {
  res
    .status(200)
    .send(quoter.getRandomOne());
});
