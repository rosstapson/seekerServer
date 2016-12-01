import express from 'express';
import User from './models/User';
import fs from 'fs';
import busboy from 'connect-busboy';

var app = module.exports = express.Router();
app.use(busboy()); 
app.post('/file-upload', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    var username = '';
    req.busboy.on('field', function(fieldname, value) {
      console.log( fieldname + ' : ' + value);
      if (fieldname === 'username') {
        console.log('here');
        username = value;
      }
    });
    console.log('username: ' + username)
    if (!username) {
      return res.status(400).send({errorMessage: "Username invalid"});
    }
    var dir = './user_images/'+ username;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    } 
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename); 
        console.log("for user: " + req.body.username);
        fstream = fs.createWriteStream(__dirname + dir + '/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            res.redirect('back');
        });
    });
});
app.post('/assets', function (req, res) {
  console.log("asset-routes.js: /assets for:" + req.body.username);  

  var user = User.findOne({username: req.body.username}).then(
    function(user) {
      if(!user) {
        res.status(400).send({errorMessage: "User not found"});
      } 
      else {     
        res.status(200).send({ assets:user.assets });
      }   
    },
    function(err) {
       return res
          .status(400)
          .send({errorMessage: err.message});
    }
  ) 
});
app.post('/addasset', function (req, res) {
  console.log("asset-routes.js: /addasset for:" + req.body.username);  

  var user = User.findOne({username: req.body.username}).then(
    function(user) {
      if(!user) {
        res.status(400).send({errorMessage: "User not found"});
      } 
      else {
        //var tempAsset = req.body.asset;

        user.assets.push(req.body.asset);
        //user.dateUpdated = Date.now;
        user.save();
        res.status(200).send({ assets:user.assets });
      }   
    },
    function(err) {
       return res
          .status(400)
          .send({errorMessage: err.message});
    }
  ) 
});
app.post('/updateasset', function (req, res) {
  console.log("asset-routes.js: /update asset for:" + req.body.username);  

  var user = User.findOne({username: req.body.username}).then(
   
    function(user) {
      if(!user) {
        res.status(400).send({errorMessage: "User not found"});
      } 
      else {
        var found = false;
        for (var i = 0; i < user.assets.length; i++) {
          if (user.assets[i].dnaCode === req.body.asset.dnaCode) {
          //if (user.assets[i]._id === req.body.asset._id) {
            user.assets[i] = req.body.asset;
            user.assets[i].dateUpdated = new Date();
            
            found = true;
            break;
          }
        }
        if (!found) {
           return res.status(400).send({errorMessage: "Asset not found"});
        }
        user.set("dateUpdated", Date.now());
        user.save();
        res.status(200).send({ assets:user.assets });
      }   
    },
    function(err) {
       return res
          .status(400)
          .send({errorMessage: err.message});
    }
  ) 
});
app.post('/deleteasset', function (req, res) {
  console.log("asset-routes.js: /deleteasset for:" + req.body.username);  

  var user = User.findOne({username: req.body.username}).then(
    function(user) {
      if(!user) {
        res.status(400).send({errorMessage: "User not found"});
      } 
      else {//var tempAsset = req.body.asset;

        //user.assets.push(req.body.asset);
        user.assets = user.assets.filter(function(asset) {
          return asset.dnaCode != req.body.dnaCode;
        });
        user.save();
        res.status(200).send({ assets:user.assets });
      }   
    },
    function(err) {
       return res
          .status(400)
          .send({errorMessage: err.message});
    }
  ) 
});