require("babel-register");

// no es6 in this file, only in what's 'required' (feck.)

var logger = require('morgan'),
    mongoose = require('mongoose'),
    serverConfig = require('./config.js'),
    cors = require('cors'),
    http = require('http'),
    https = require('https'),
    express = require('express'),
    errorhandler = require('errorhandler'),
    dotenv = require('dotenv'),
    raven = require('raven'),
    fs = require('fs'),
    bodyParser = require('body-parser');

var client = new raven.Client('https://b69c7d4103c144b9924158a57b3dc3b1:b148565ff1084c749008dddc0c9bbe76@sentry.io/101038');
client.patchGlobal();

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://' + serverConfig.dbUser + ':' +
    serverConfig.dbPassword + '@localhost:27017/seekerDNA', (error) => {
        if (error) {
            client.captureException(error);
            console.error('Please make sure Mongodb is installed and running!'); // eslint-disable-line no-console
            throw error;
        }
    });
var app = express();
var httpApp = express();


httpApp.set(serverConfig.httpPort);

app.set(serverConfig.port);

httpApp.get("*", function (req, res, next) {
    res.redirect("https://" + req.headers.host + req.path);
});

var httpsOptions = {
    key: fs.readFileSync("/home/seeker/seekerdnasecure.co.za.key"),
    cert: fs.readFileSync("/home/seeker/seekerdnasecure.co.za.chained.crt")
};
dotenv.load();

// Parsers old version of line app.use(bodyParser.urlencoded()); new version of
// line
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
// folder for static images
app.use(express.static('img'));
app.use(function(err, req, res, next) {
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
app.use(require('./external-routes'));


console.log("port: " + serverConfig.port);

http.createServer(httpApp).listen(serverConfig.httpPort, function() {
    console.log("ZOMG!");
    console.log('Express HTTP server listening on port ' + serverConfig.httpPort);
});

https.createServer(httpsOptions, app).listen(serverConfig.port, function() {
    console.log('Express HTTPS server listening on port ' + serverConfig.port);
    console.log("HTTPS branch");
});

// http
//     .createServer(app)
//     .listen(port, function(err) {
//         console.log('ZOMG! listening in http://localhost:' + port);
//         console.log('Admin branch.');
//     });