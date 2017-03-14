import express from 'express';
import User from './models/User';
import fs from 'fs';
import busboy from 'connect-busboy';
import cuid from 'cuid';
import {checkToken} from './auth';
import cors from 'cors';


var app = module.exports = express.Router();
app.use(busboy());

app.post('/deleteimage', function(req, res) {
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }
  // console.log("deleting image " + req.body.url 
  // + " for asset " 
  // + req.body.dnaCode 
  // + " for user "
  // + req.body.username);  
  try {
   fs.unlinkSync(__dirname + '/user_images/' + req.body.url);
  }
  catch(err) {
    console.log(err);
    
  }
  var assetInQuestion = null;
  var tempUrls = null;
  //establish db ref to file url
  var user = User.findOne({username: req.body.username})
  .then(function(user) {
    assetInQuestion = user.assets.find((value) => {
      //console.log("asset:" + value.dnaCode);
      return value.dnaCode === req.body.dnaCode;
    });
    tempUrls = assetInQuestion.imageUrls.filter((value) => {
      // console.log("here: " + value + " - compare: " + req.body.url);
      // console.log( value !== req.body.url);
      return value !== req.body.url;
    });
    assetInQuestion.imageUrls = tempUrls;
    assetInQuestion.set("dateUpdated", Date.now());    
    //console.log(user.assets.imageUrls);
    user.save();
    res.status(201).send({message: "Image deleted"});
   
    
  })
  .catch((err) => {
    console.log(err.message);
     return res
        .status(500)
        .send({errorMessage: err.message});
  });
  
  
  
});

app.options('/file-upload', cors());
app.post('/file-upload', function (req, res) {
  console.dir(req.body);
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }
  var fstream;
  req.pipe(req.busboy);
  var tempName = '';
  var username = '';
  var dnaCode = '';
  req
    .busboy
    .on('file', function (fieldname, file, filename) {
      
      fstream = fs.createWriteStream(__dirname + '/user_images/' + filename);
      file.pipe(fstream);
      tempName = filename;      
    });
  req.busboy.on('field', function(fieldName, value) {    
    if(fieldName === 'username') {username = value;}
    if(fieldName === 'dnaCode') {dnaCode = value;}
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
    var newName = renameFile(tempName);
    var oldPath = __dirname + '/user_images/' + tempName;
    var newPath = __dirname + '/user_images/' + username + '/' + newName;
    console.log('newPath: ' + newPath);
    fs.renameSync(oldPath, newPath);
    console.log('dnaCode: ' + dnaCode);
    updateAssetImageUrl(username, dnaCode, newName);
    res.status(201).send({imageUrl: username + '/' + newName})
  }); 

  function updateAssetImageUrl(username, dnaCode, newName) {
    var _this = this;
    var user = User
    .findOne({username: username})
    .then(function(user) {
      for (var i = 0; i < user.assets.length; i++) {
        if (user.assets[i].dnaCode === dnaCode) {
          user.assets[i].imageUrls.push(username + '/' + newName);
          user.save();
          break;
        }
        
      }
    });
      
    
  }

});
function renameFile(fileName) {
  var arr = fileName.split(".");
  return cuid() + '.' + arr[arr.length - 1]; //last array element presumably '.gif' or whatnot.
}
//function AddImageUrlToAsset(){};

app.post('/assets', function (req, res) {
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
  }

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
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }

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
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }

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
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }

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