// NB! assetTransfer is located in user-routes, so as to
// utilise nodemailer and transporter instantiated there.

import express from 'express';
import User from './models/User';
import Product from './models/Product';
import fs from 'fs';
import busboy from 'connect-busboy';
import cuid from 'cuid';
import {checkToken} from './auth';
import cors from 'cors';
//import clam from 'clamscan';
//import XLSX from 'xlsx';
var XLSX = require('xlsx');

var app = module.exports = express.Router();
app.use(busboy());
var clamEngine = null;
var clam = require('clam-engine');
    
    
console.log("bootstrap attempt at creating clam engine - please allow several minutes before attempting any image uploads!");
clam.createEngine(function (err, engine) {
  if (err) {
    console.log("unable to bootstrap virus engine, recommend dummy image upload ASAP");
    return console.log('Error', err);    
  }
  clamEngine = engine;
  console.log("virus engine bootstrap successful");
});    
      
app.post('/deleteimage', function(req, res) {
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }
  
  try {
   fs.unlinkSync(__dirname + '/user_images/' + req.body.url);
  }
  catch(err) {
    console.log("Unable to delete image" + req.body.url + ", possibly invalid url");
    
  }
  var assetInQuestion = null;
  var tempUrls = null;
  //establish db ref to file url
  var user = User.findOne({username: req.body.username})
  .then(function(user) {
    assetInQuestion = user.assets.find((value) => {      
      return value.dnaCode === req.body.dnaCode;
    });
    tempUrls = assetInQuestion.imageUrls.filter((value) => {      
      return value !== req.body.url;
    });
    assetInQuestion.imageUrls = tempUrls;
    assetInQuestion.set("dateUpdated", Date.now());   
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
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }
  var fstream;
  req.pipe(req.busboy);
  var tempName = '';
  var username = '';
  var dnaCode = 'default';
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
    if (tempName == '' || username == '') {
      console.log('Error: filename,username = ' + tempName + ',' + username);
      return res.status(500).send({errorMessage: 'Unable to extract user information for upload'});      
    }
    var dir = './user_images/' + username + '/' + dnaCode;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    var newName = renameFile(tempName);
    var oldPath = __dirname + '/user_images/' + tempName;
    var newPath = __dirname + '/user_images/' + username + '/' + dnaCode + '/' + newName;
    if (!fs.existsSync(oldPath)) {
	    console.log("feck. inexplicable error, possibly non-fatal");
    }
    // virus scan 
    
    
    if (!clamEngine || clamEngine == null) {
      console.log("outside engine is null; creating clam engine");
      clam.createEngine(function (err, engine) {
        if (err) {
          return console.log('Error', err);
        }
        clamEngine = engine;
      });    
    }    
    
    clamEngine.scanFile(oldPath, function (err, virus) {
      if (err) {
        console.log('Virus scan error: ', err);
        return res.status(500).send({errorMessage: err});
      }
      if (virus) {
        console.log('Virus found! Deleting file ' + oldPath, virus);
        fs.unlinkSync(oldPath);
        return res.status(500).send({errorMessage: "Virus found in file"});
      }
      else {
        // scan successful, file clean
        fs.renameSync(oldPath, newPath);        
        updateAssetImageUrl(username, dnaCode, newName);
        res.status(201).send({imageUrl: username + '/' + dnaCode + '/' + newName});
      }
      
  });
});
    
  }); 
  // view pins
  app.get('/pins', function(req, res) {
    if (!checkToken(req)) {
      return res.status(401).send({errorMessage: "Invalid token"})
    }
    Product.find().then(function(products) {
      if (!products) {
        res.status(400).send({ errorMessage: "Pins not found" });
      } else {
          res.status(200).send({ products: products });
      }
    }, function(err) {
        return re.status(400).send({ errorMessage: err.message });
    });
    
  });
  // upload pins from xls file
  app.options('/upload-pins', cors());
  app.post('/upload-pins', function (req, res) {
    if (!checkToken(req)) {
              return res.status(401).send({errorMessage: "Invalid token"})
      }
    var fstream;
    req.pipe(req.busboy);
    var tempName = '';
    var username = '';
    
    req
      .busboy
      .on('file', function (fieldname, file, filename) {        
        fstream = fs.createWriteStream(__dirname + '/pin_files/' + filename);
        file.pipe(fstream);
        tempName = filename;      
      });
    req.busboy.on('field', function(fieldName, value) {    
      if(fieldName === 'username') {username = value;}      
    });
    req.busboy.on('finish', function() {    
      if (tempName == '' || username == '') {
        console.log('Error: filename,username = ' + tempName + ',' + username);
        return res.status(500).send({errorMessage: 'Unable to extract pins for upload'});      
      }
      // var dir = './user_images/' + username + '/' + dnaCode;
      
      var filePath = __dirname + '/pin_files/' + tempName;
      
      if (!fs.existsSync(filePath)) {
        console.log("pins. zomg. inexplicable error, possibly non-fatal");
      }
      // virus scan 
      
      
      if (!clamEngine || clamEngine == null) {
        console.log("outside engine is null; creating clam engine");
        clam.createEngine(function (err, engine) {
          if (err) {
            return console.log('Error', err);
          }
          clamEngine = engine;
        });    
      }    
      
      clamEngine.scanFile(filePath, function (err, virus) {
        if (err) {
          console.log('Virus scan error: ', err);
          return res.status(500).send({errorMessage: err});
        }
        if (virus) {
          console.log('Virus found! Deleting file ' + filePath, virus);
          fs.unlinkSync(filePath);
          return res.status(500).send({errorMessage: "Virus found in file"});
        }
        else {
          console.log("File scanned, no threat found");
          var newName = __dirname + '/pin_files/' + renameFile(filePath);
          fs.renameSync(filePath, newName);
          if (!fs.existsSync(newName)) {
            console.log("zomg. inexplicable error");
          }
          var pins = '';
          try {   
            pins = parseXL(username, newName); //returns an array of strings, those pins that were rejected..
          }
          catch(err) {
            console.log(err);
          }
          try {
            fs.unlinkSync(newName);
            }
            catch(err) {
              console.log("Unable to delete file " + url + ", possibly invalid url");
              
            }
          res.status(201).send({rejected: pins});
        }
        
    });
  });
      
    });

    function parseXL(username, filePath) {
      console.log("parseXL filePath:" + filePath);
      var rejected = [];
      var workbook = XLSX.readFile(filePath);
      var data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header:1});
      
      data.forEach(function(pin) {
          var dnaCode = pin[0];
          var status = pin[1];
          if (!status) {
              status = "Unallocated";
          }
          
             if (!isNaN(parseFloat(dnaCode)) && isFinite(dnaCode)) {
               var returnValue = saveProduct(dnaCode, status, username);
               if (returnValue) {
                 rejected.push(returnValue);
               }
             }      
        })
      
       return rejected;
    }
    function saveProduct(pin, status, username) {
      var product = new Product();
      product.dnaCode = pin;
      product.addedBy = username;
      product.status = status;
      product.save().then(function(pin) {
        return;
      }        
      ).catch(function(err) {
        return pin;
      });
    }


  function updateAssetImageUrl(username, dnaCode, newName) {
    var _this = this;
    var user = User
    .findOne({username: username})
    .then(function(user) {
      for (var i = 0; i < user.assets.length; i++) {
        if (user.assets[i].dnaCode === dnaCode) {
          user.assets[i].imageUrls.push(username + '/' + dnaCode + '/'+ newName);
          user.save();
          break;
        }
        
      }
    });
      
    
  }


function renameFile(fileName) {
  var arr = fileName.split(".");
  return cuid() + '.' + arr[arr.length - 1]; //last array element presumably '.gif' or whatnot.
}

// add one product pin

app.post('/add-pin', function(req, res) {
  // console.log("dnaCode: " + req.body.dnaCode);
  // console.log("req.body: " + JSON.stringify(req.body));
  if (!checkToken(req)) {
    return res.status(401).send({errorMessage: "Invalid token"})
  }
  try {
    var product = new Product(req.body);
    //product.status = "Unallocated";
    product.save().then(function() {
      return res.status(201).send({message: "Success"});
    }).catch(function (err) {
      return res.status(422).send({errorMessage: err.message});
    });
  }
  catch(err) {
    return res.status(500).send({errorMessage: err.message});
  }
});
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
function checkPinIsUnallocated(dnaCode) {
  console.log(dnaCode);
  var prod = Product.findOne({dnaCode: dnaCode})
    .then(function(product) {
      console.log("product found: " + prod);
      if (!prod) {
        console.log("except it's null.");
        return false;
      }
      if (product.status === "Unallocated") {
        console.log("unallocated it is.");
        return product.status;
      }
      else {
        console.log("but it isn't unallocated");
        return false;
      }
    }).catch(function(err) {
      console.log("caught an err: " + err.message);
      return false;
    });
}
function allocatePin(dnaCode, username) {
  var prod = Product.findOne({dnaCode: dnaCode})
    .then(function(prod){
      console.log("prod found, about to set status and save");
      prod.status = "Allocated";
      prod.allocatedTo = username;
      prod.save()
        .then(function() {
          console.log("successfully saved");
          return true;
        })
        .catch(function(err) {
          console.log("couldn't save: " + err.message);
          return false;
        });
    })
    .catch(function(err) {
      console.log("some error during allocation: " + err.message);
      return false;
    });
}
app.post('/addasset', function (req, res) {
  if (!checkToken(req)) {
    return res.status(401).send({errorMessage: "Invalid token"})
  }
  try {
    if (!checkPinIsUnallocated(req.body.asset.dnaCode)) {
      return res.status(400).send({errorMessage: "DNA Pin not found"});
    }
  }
  catch(err) {
    return res.status(500).send({errorMessage: err.message});
  }

  var user = User.findOne({username: req.body.username})
    .then(function (user) {
      if (!user) {
        return res.status(400).send({errorMessage: "User not found"});
      }
      user.assets.push(req.body.asset);       
      user.save(function (err, product, numAffected) {
        if (err){
          return res.status(418).send({message: err.message})
        }
        if (!allocatePin(req.body.asset.dnaCode, user.username)) {
          return res.status(500).send({errorMessage: "Unable to allocate pin"});
        }
      });       
    }, function (err) {
      return res.status(400).send({errorMessage: err.message});
    });

    
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
        user.save(function (err, product, numAffected) {
          if (err){
            console.log(err.message);
            res.status(418).send({message: err.message})
          }
          else {
            res.status(200).send({assets: user.assets});
          }
        });
        
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
        var asset = user.assets.find(function(asset) {
          return asset.dnaCode === req.body.dnaCode;
        });
        asset.imageUrls.forEach(function(url) {
          try {
            fs.unlinkSync(__dirname + '/user_images/' + url);
            }
            catch(err) {
              console.log("Unable to delete image" + url + ", possibly invalid url");
              
            }
        });
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
