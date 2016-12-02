require("babel-register");  

// no es6 in this file, only in what's 'required' (feck.)

//import 'babel-register';
// import logger from 'morgan';
// import mongoose from 'mongoose';
// import serverConfig from './config.js';
// import cors from 'cors';
// import http from 'http';
// import express from 'express';
// import errorhandler from 'errorhandler';
// import dotenv from 'dotenv';
// import bodyParser from 'body-parser';

 var logger = require('morgan'),
   mongoose = require('mongoose'),
   serverConfig = require('./config.js'),
   cors = require('cors'),
   http = require('http'),
   express = require('express'),
   errorhandler = require('errorhandler'),
   dotenv = require('dotenv'),
   bodyParser = require('body-parser');


// Set native promises as mongoose promise
mongoose.Promise = global.Promise;

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/seekerDNA', (error) => {
  if (error) {
    console.error('Please make sure Mongodb is installed and running!'); // eslint-disable-line no-console
    throw error;
  }
});
var app = express();

dotenv.load();

// Parsers old version of line app.use(bodyParser.urlencoded()); new version of
// line
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

app.use(function (err, req, res, next) {
  if (err.name === 'StatusError') {
    res.send(err.status, err.message);
  } else {
    next(err);
  }
});

if (process.env.NODE_ENV === 'development') {

  app.use(logger('dev'));
  app.use(errorhandler())
}

console.log('node is running in NODE_ENV: ' + process.env.NODE_ENV);
app.use(require('./anonymous-routes'));
app.use(require('./protected-routes'));
app.use(require('./user-routes'));
app.use(require('./asset-routes'));
app.use('/image', express.static('./user_images/'));

var port = process.env.PORT || 3001;
console.log("port: " + serverConfig.port);

http
  .createServer(app)
  .listen(port, function (err) {
    console.log('ZOMG! listening in http://localhost:' + port);
    console.log('Let the saliva flow.');
  });
