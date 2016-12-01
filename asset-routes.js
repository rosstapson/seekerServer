import express from 'express';
import User from './models/User';
import fs from 'fs';
import busboy from 'connect-busboy';

var app = module.exports = express.Router();
app.use(busboy());

app.post('/file-upload', function (req, res) {
  var fstream;
  req.pipe(req.busboy);
  var tempName = '';
  var username = '';
  req
    .busboy
    .on('file', function (fieldname, file, filename) {
      
      fstream = fs.createWriteStream(__dirname + '/user_images/' + filename);
      file.pipe(fstream);
      tempName = filename;
      // fstream.on('close', function () {        
      //   res
      //     .status(201)
      //     .send({filename: filename});
      // });
    });
  req.busboy.on('field', function(fieldName, value) {    
    if(fieldName === 'username') {username = value;}
    
  });
  req.busboy.on('finish', function() {
    console.log(tempName + ',' + username);
    if (tempName == '' || username == '') {
      return res.status(500).send({errorMessage: 'Unable to extract user information for upload'});      
    }
    var dir = './user_images/' + username;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    var oldPath = __dirname + '/user_images/' + tempName;
    var newPath = __dirname + '/user_images/' + username + '/' + tempName;
    fs.renameSync(oldPath, newPath);
    res.status(201).send({imageUrl: newPath})
  });

});
app.post('/assets', function (req, res) {
  console.log("asset-routes.js: /assets for:" + req.body.username);

  var user = User
    .findOne({username: req.body.username})
    .then(function (user) {
      if (!user) {
        res
          .status(400)
          .send({errorMessage: "User not found"});
      } else {
        res
          .status(200)
          .send({assets: user.assets});
      }
    }, function (err) {
      return res
        .status(400)
        .send({errorMessage: err.message});
    })
});
app.post('/addasset', function (req, res) {
  console.log("asset-routes.js: /addasset for:" + req.body.username);

  var user = User
    .findOne({username: req.body.username})
    .then(function (user) {
      if (!user) {
        res
          .status(400)
          .send({errorMessage: "User not found"});
      } else {
        //var tempAsset = req.body.asset;

        user
          .assets
          .push(req.body.asset);
        //user.dateUpdated = Date.now;
        user.save();
        res
          .status(200)
          .send({assets: user.assets});
      }
    }, function (err) {
      return res
        .status(400)
        .send({errorMessage: err.message});
    })
});
app.post('/updateasset', function (req, res) {
  console.log("asset-routes.js: /update asset for:" + req.body.username);

  var user = User
    .findOne({username: req.body.username})
    .then(function (user) {
      if (!user) {
        res
          .status(400)
          .send({errorMessage: "User not found"});
      } else {
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
          return res
            .status(400)
            .send({errorMessage: "Asset not found"});
        }
        user.set("dateUpdated", Date.now());
        user.save();
        res
          .status(200)
          .send({assets: user.assets});
      }
    }, function (err) {
      return res
        .status(400)
        .send({errorMessage: err.message});
    })
});
app.post('/deleteasset', function (req, res) {
  console.log("asset-routes.js: /deleteasset for:" + req.body.username);

  var user = User
    .findOne({username: req.body.username})
    .then(function (user) {
      if (!user) {
        res
          .status(400)
          .send({errorMessage: "User not found"});
      } else { //var tempAsset = req.body.asset;

        //user.assets.push(req.body.asset);
        user.assets = user
          .assets
          .filter(function (asset) {
            return asset.dnaCode != req.body.dnaCode;
          });
        user.save();
        res
          .status(200)
          .send({assets: user.assets});
      }
    }, function (err) {
      return res
        .status(400)
        .send({errorMessage: err.message});
    })
});