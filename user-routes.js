var express = require('express'),
  _ = require('lodash'),
  config = require('./configify'),
  jwt = require('jsonwebtoken'),
  mailer = require('./mailer');

var app = module.exports = express.Router();


// XXX: This should be a database of users :).
var users = [
  {
    id: 1,
    email: 'ross@gonto',
    username: 'gonto',
    password: 'gonto'
  }
];

function createToken(user) {
  return jwt.sign({ username: user.username }, config.secret, { expiresIn: 60 * 60 * 24 });
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

    var profile = _.pick(req.body, userScheme.type, 'email', 'password', 'extra');
    profile.id = _
      .max(users, 'id')
      .id + 1;

    users.push(profile); // mongo call here.
    var id_token = createToken(profile);
    mailer.mailToken(profile.email, id_token);
    res
      .status(201)
      .send({username: userScheme.userName, id_token});
  });

app.post('/sessions/create', function (req, res) {
  console.log(" user-routes.js: /sessions/create");
  var userScheme = getUserScheme(req);

  if (!userScheme.username || !req.body.password) {
    return res
      .status(400)
      .send("You must send the username and the password");
  }

  var user = _.find(users, userScheme.userSearch);

  if (!user) {
    return res
      .status(401)
      .send("The username or password don't match");
  }

  if (user.password !== req.body.password) {
    return res
      .status(401)
      .send("The username or password don't match");
  }

  res
    .status(201)
    .send({id_token: createToken(user)});
});
