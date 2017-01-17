require("babel-register");  

// no es6 in this file, only in what's 'required' (feck.)

 var logger = require('morgan'),
   mongoose = require('mongoose'),
   serverConfig = require('./config.js'),
   cors = require('cors'),
   http = require('http'),
   express = require('express'),
   errorhandler = require('errorhandler'),
   dotenv = require('dotenv'),
   raven = require('raven'),
   bodyParser = require('body-parser');

var client = new raven.Client('https://b69c7d4103c144b9924158a57b3dc3b1:b148565ff1084c749008dddc0c9bbe76@sentry.io/101038');
client.patchGlobal();

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://' + serverConfig.dbUser + ':'
    + serverConfig.dbPassword + '@localhost:27017/seekerDNA', (error) => {
  if (error) {
    client.captureException(error);
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
app.use(require('./user-routes'));
app.use(require('./asset-routes'));
app.use('/image', express.static('./user_images/'));

var port = process.env.PORT || 3001;
console.log("port: " + serverConfig.port);

http
  .createServer(app)
  .listen(port, function (err) {
    console.log('ZOMG! listening in http://localhost:' + port);
    console.log('Admin branch.');
  });
