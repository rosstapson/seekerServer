
import express from 'express';
import _ from 'lodash';
import config from './config';
import jwt from 'jsonwebtoken';
import User from './models/User';
import sanitizeHtml from 'sanitize-html';
import nodemailer from 'nodemailer';
import cuid from 'cuid';

var app = module.exports = express.Router();
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'ross.tapson.test@gmail.com',
    pass: 'mrstapson1'
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
  try {
    console.log("User: " + req.body);
    var user = new User(req.body);
    user.userName = sanitizeHtml(user.userName);
    user.email = sanitizeHtml(user.email);
    
    user.cuid = cuid();
  } catch (err) {
    console.log(err.message);
    res
      .status(500)
      .send({errorMessage: err.message});
  }
  user.save((err, saved) => {
    if (err) {
      console.log("bugger: " + err.message);
      res
        .status(500)
        .send({errorMessage: err.message});
    }
    //res.json({ user: saved });
    return user;
  });
}

function createToken(user) {
  console.log("createToken: " + config.secret);
  return jwt.sign({
    username: user.userName
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
        'ration, please click <a href="http://localhost:3000/confirm/?id_token=' + token + '">here</a>. ✔ <br> This will expire in 24 hours.</b>'
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
    var userScheme = getUserScheme(req);
    if (!userScheme.username || !req.body.password) {
      return res
        .status(400)
        .send({errorMessage: "You must send the username and the password"});
    }

    if (_.find(users, userScheme.userSearch)) {
      return res
        .status(400)
        .send({errorMessage: "A user with that username already exists"});
    }

    // var profile = _.pick(   req.body,  userScheme.type,  'username',  'email',
    // 'password', 'extra'); profile.id = _   .max(users, 'id')   .id + 1;
    // users.push(profile); // mongo call here.
    var user = addUser(req, res);
    var id_token = createToken(user);
    mailToken(user.email, id_token);
    res
      .status(201)
      .send({username: user.userName, id_token: id_token});
  });

app.post('/sessions/create', function (req, res) {
  console.log(" user-routes.js: /sessions/create");
  var userScheme = getUserScheme(req);

  if (!userScheme.username || !req.body.password) {
    return res
      .status(400)
      .send({errorMessage: "You must send the username and the password"});
  }

  var user = _.find(users, userScheme.userSearch);

  if (!user) {
    return res
      .status(401)
      .send({errorMessage: "Unknown username"});
  }

  if (user.password !== req.body.password) {
    return res
      .status(401)
      .send({errorMessage: "Invalid password"});
  }

  res
    .status(201)
    .send({id_token: createToken(user)});
});

app.post('/token', function (req, res) {
  var decoded = false;
  console.log("token");
  if (!req.body.id_token) {
    return res
      .status(400)
      .send({errorMessage: "No token"});
  }
  try {
    console.log("here");
    decoded = jwt.verify(token, config.secret);
  } catch (err) {
    return res
      .status(400)
      .send({errorMessage: "Invalid token"});
  }

  res
    .status(201)
    .send({decoded: decoded});
});
