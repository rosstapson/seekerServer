require("babel-register");

var User = require('./models/User'), 
 bcrypt = require('bcrypt'),
 mongoose = require('mongoose'),
 serverConfig = require('./config.js');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/seekerDNA', function(error) {
        if (error) {
            client.captureException(error);
            console.error('Please make sure Mongodb is installed and running!'); // eslint-disable-line no-console
            throw error;
        }
    });
    var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  User.find(function (err, users) {
  if (err) return console.error(err);
  console.log(users);
})
});


// var user = User
//   .find()
//   .then(function (users) {
//     if (!users) {
//       console.log("no users found");
//       return;
//     } else {

//       users.forEach(function(user) {
//         plaintextPassword = user.password;
//         bcrypt
//         .hash(plaintextPassword, 10)
//         .then(function (hash) {
//           user.save();
//         });
//       }, this);
//     }
//   }, function (err) {
//     console.log("ZOMG!" + err)
//   });