import express from 'express';
import _ from 'lodash';
import config from './config';
import jwt from 'jsonwebtoken';
import User from './models/User';
import sanitizeHtml from 'sanitize-html';
import nodemailer from 'nodemailer';
import cuid from 'cuid';
import slug from 'limax';

var app = module.exports = express.Router();
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'ross.tapson.test@gmail.com',
    pass: 'xxxx'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// XXX: This should be a database of users :).
var users = [
  {
    id: 1,
    email: 'ross@gonto',
    username: 'gonto',
    password: 'gonto'
  }
];

function addUser(req, res) {

  //console.log("User: " + req.body.username);
  var user = new User(req.body);
  user.username = sanitizeHtml(user.username);
  user.email = sanitizeHtml(user.email);
  user.password = sanitizeHtml(user.password);
  user.accessLevel = 1; // default to 'client' for now.
  user.slug = slug(user.username.toLowerCase(), {lowercase: true});
  user.cuid = cuid();
  
  return user.save();
}

function createToken(username) {
  console.log("createToken: " + config.secret);
  return jwt.sign({
    username: username
  }, config.secret, {
    expiresIn: 60 * 60 * 24
  });
}

function mailToken(email, token) {
  // var html = '<b>Hello world ✔</b>';
  var mailOptions = {
    from: 'ross.test.tapson@gmail.com',
    to: email,
    subject: 'Please confirm your registration',
    html: '<b>Thank you for signing up for SeekerDNA Asset Register. To confirm your regist' +
        'ration, please click <a href="http://localhost:3000/confirm/' + token + '">here</a>. ✔ <br> This will expire in 24 hours.</b>'
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}

function getUserScheme(req) {
  console.log("user-routes.js getUserScheme");
  var username;
  var type;
  var userSearch = {};

  // The POST contains a username and not an email
  if (req.body.username) {
    username = req.body.username;
    console.log(username);
    type = 'username';
    userSearch = {
      username: username // The POST contains an email and not an username
    };
  } else if (req.body.email) {
    username = req.body.email;
    type = 'email';
    userSearch = {
      email: username
    };
  }

  return {username: username, type: type, userSearch: userSearch}
}

app
  .post('/users', function (req, res) {

    var user = addUser(req, res).then(function (user) {
      console.log("about to create token for user " + user.username);
      var id_token = createToken(user.username);
      mailToken(user.email, id_token);
      return res
        .status(201)
        .send({username: user.userName, id_token: id_token});
    })
      .catch(function (err) {
        if (err.message == "User validation failed") {
          return res
            .status(400)
            .send({errorMessage: "Username is not available"})
        } else {
          console.log("hmm: " + err.message);
          return res
            .status(400)
            .send({errorMessage: err.message});
        }
      });

  });

//this to retrieve userdetails, minus assets and cases, for purposes of updating them
app.post('/userdetails', function(req, res) {
  console.log('user-routes.js /userdetails');
  console.log(req.body);
  var user = User.findOne(
    {username: req.body.username}, 
    'username email password accessLevel companyName telephone contactPerson mobile address fax slug cuid dateAdded dateUpdated',
  )
  .then(
    function(user){
       res
          .status(201)
          .send(user);
    },
    function(err){
      console.log(err);
      return res
        .status(401)
        .send({errorMessage: "Invalid username"});}
  );
});
app.post('/updateuser', function(req, res) {
  console.log('user-routes.js /updateuser');
  console.log(req.body.address.country);
  var user = User.findOne(
    {username: req.body.username}, 
    'username email password accessLevel companyName telephone contactPerson mobile' + 
    ' address fax slug cuid dateAdded dateUpdated',
  )
  .then(
    function(user){
      user.update(req.body).then(
        function() {
           res
          .status(201)
          .send({message: "Update successful"});
        }
      );
      
    },
    function(err){
      console.log(err);
      return res
        .status(401)
        .send({errorMessage: "Invalid username"});}
  );
});
app.post('/sessions/create', function (req, res) {
  console.log(" user-routes.js: /sessions/create");

  var user = User
    .findOne({username: req.body.username})
    .then(function (user) {
      if (user.password != req.body.password) { //hash this!
        console.log(user.password + " vs " + req.body.password);
        return res
          .status(401)
          .send({errorMessage: "Invalid password"});
      } else {
        // set id_token on response set last_logged_in on user and update
        res
          .status(201)
          .send({
            id_token: createToken(user.username),
            username: user.username
          });
      }
    }, function (err) {
      return res
        .status(401)
        .send({errorMessage: "Invalid username"});
    })
});

app.post('/token', function (req, res) {
  var decoded = false;
  console.log("here");
  console.log("token secret: " + config.secret);
  console.log("req.body: " + req.body.id_token);
  if (!req.body) {
    console.log("no token");
    return res
      .status(400)
      .send({errorMessage: "No token"});
  }
  try {
    console.log("here. ");
    decoded = jwt.verify(req.body.id_token, config.secret);
  } catch (err) {
    console.log("Error: " + err.message);
    return res
      .status(400)
      .send({errorMessage: "Invalid token"});
  }

  res
    .status(201)
    .send({decoded: decoded});
});
