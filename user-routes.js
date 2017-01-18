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
  host: config.mailServer,
  auth: {
    user: config.mailUser,
    pass: config.mailPassword
  },
  tls: {
    rejectUnauthorized: false
  }
});


function addUser(req, res) {

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
  return jwt.sign({
    username: username
  }, config.secret, {
    expiresIn: 60 * 60 * 24
  });
}

function mailPasswordReset(email, token) {  
  var mailOptions = {
    from: 'SeekerDNA',
    to: email,
    subject: 'Password Reset',
    html: '<b> To reset your password for SeekerDNASecure.co.za, please click <a href="http://seekerdnasecure.co.za/resetpassword/' + token + '">here</a>. ✔ <br> This link will expire in 24 hours.</b>'
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
  });
}

function mailToken(email, token) {  
  var mailOptions = {
    from: 'SeekerDNA',
    to: email,
    subject: 'Please confirm your registration',
    html: '<b>Thank you for signing up for SeekerDNA Asset Register. verify your email' +
        ', please click <a href="http://seekerdnasecure.co.za/confirm/' + token + '">here</a>. ✔ <br> This will expire in 24 hours.</b>'
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
  });
}

function getUserScheme(req) {
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
app.get('/users', function (req, res) {
  var user = User
    .find()
    .then(function (users) {
      if (!users) {
        res
          .status(400)
          .send({errorMessage: "Users not found"});
      } else {
        res
          .status(200)
          .send({assets: users});
      }
    }, function (err) {
      return res
        .status(400)
        .send({errorMessage: err.message});
    })
});
app
  .post('/users', function (req, res) {

    var user = addUser(req, res).then(function (user) {
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
app.post('/mailpasswordreset', function(req, res) {
  var user = User.findOne(
    {email: req.body.email},
    'username email'
  )
  .then(
    function(user) {
      var id_token = createToken(user.username);
      mailPasswordReset(req.body.email, id_token);
      return res
        .status(200)
        .send();
    },
    function(err) {
      console.log(err);
      return res
        .status(401)
        .send( {errorMessage: "Invalid email"} );
    }
  );
});
    }
  )
}
app.post('/updateuser', function(req, res) {
  
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
            username: user.username, 
            accessLevel: user.accessLevel
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
