import express from 'express';
import User from './models/User';
import fs from 'fs';

var app = module.exports = express.Router();

app.post('/file-upload', function(req, res) {
    // get the temporary location of the file

    console.log(req.body.username);
    var tmp_path = req.file.image.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    var target_path = './users/images/' + req.files.image.name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
            res.send('File uploaded to: ' + target_path + ' - ' + req.files.image.size + ' bytes');
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