
import express from 'express';
import _ from 'lodash';
import config from './config';
import jwt from 'jsonwebtoken';
import User from './models/User';
import sanitizeHtml from 'sanitize-html';
import nodemailer from 'nodemailer';
import cuid from 'cuid';
import slug from 'limax';
import util from 'util';
import bcrypt from 'bcrypt';
import { checkToken } from './auth';
import fs from 'fs';

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

// these vars for transferAsset
// var loadInputs = '<script>function loadInputs() {  document.getElementById("myForm").action = "ht' +
//         'tps://seekerdnasecure.co.za:3002/api/transferAsset';
// var endLoadInputs = '";   }</script>';
var htmlBodyTagAndLogo = '<body><div style=" margin: auto;"><img src="https://seekerdnasecure.co.za:3002/l' +
        'ogo.png" style="height: 200px; display: block; margin: auto;" alt="logo"/></div>';
var htmlHeader = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"\"vi" +
        "ewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"icon\" href=" +
        "\"https://seekerdnasecure.co.za:3002/favicon.ico\"><title>Seeker DNA Asset Regis" +
        "ter</title></head>";

function addUser(req, res) {

    var user = new User(req.body);
    user.username = sanitizeHtml(user.username);
    user.email = sanitizeHtml(user.email);
    user.isVerified = false;
    var plainTextPassword = sanitizeHtml(user.password);
    var hash = bcrypt.hashSync(plainTextPassword, 10);
    user.password = hash;
    user.accessLevel = 1; // default to 'client' for now.
    user.slug = slug(user.username.toLowerCase(), { lowercase: true });
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
        from: '"SeekerDNA" <dnanoreply@seekerdna.co.za>',
        to: email,
        subject: 'Password Reset',
        html: '<b>To reset your password for SeekerDNASecure.co.za, please click <a href="https:' +
            '//seekerdnasecure.co.za:3002/api/resetuserpassword/' + token + '">here</a>. ✔ <br> This link will expire in 24 hours.</b>'
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            return console.log(error);
        }
    });
}

function mailToken(email, token) {
    var mailOptions = {
        from: '"SeekerDNA" <dnanoreply@seekerdna.co.za>',
        to: email,
        subject: 'Please confirm your registration',
        html: '<b>Thank you for signing up for SeekerDNA Asset Register. verify your email, ple' +
            'ase click <a href="https://seekerdnasecure.co.za:3002/api/confirm/' + token + '">here</a>. ✔ <br> This will expire in 24 hours.</b>'
    };
    transporter.sendMail(mailOptions, function(error, info) {
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

    return { username: username, type: type, userSearch: userSearch }
}


app
    .get('/users', function(req, res) {
        if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
        }
        var user = User
            .find()
            .then(function(users) {
                if (!users) {
                    res
                        .status(400)
                        .send({ errorMessage: "Users not found" });
                } else {
                    res
                        .status(200)
                        .send({ assets: users });
                }
            }, function(err) {
                return res
                    .status(400)
                    .send({ errorMessage: err.message });
            })
    });
app.post('/users', function(req, res) {

    var user = addUser(req, res).then(function(user) {
            var id_token = createToken(user.username);
            console.log("user added: " + user.username);
            mailToken(user.email, id_token);
            return res
                .status(201)
                .send({ username: user.username, id_token: id_token });
        })
        .catch(function(err) {
            if (err.message == "User validation failed") {
                return res
                    .status(400)
                    .send({ errorMessage: "Username is not available" })
            } else {
                console.log("hmm: " + err.message);
                return res
                    .status(400)
                    .send({ errorMessage: err.message });
            }
        });

});

// this to retrieve userdetails, minus assets and cases, for purposes of
// updating them
app.post('/userdetails', function(req, res) {
    if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }
    var user = User.findOne({
                username: req.body.username
            }, 'username email password accessLevel companyName telephone contactPerson mobile a' +
            'ddress fax slug cuid dateAdded dateUpdated', )
        .then(function(user) {
            res
                .status(201)
                .send(user);
        }, function(err) {
            console.log(err);
            return res
                .status(401)
                .send({ errorMessage: "Invalid username" });
        });
});
app.post('/mailpasswordreset', function(req, res) {
    var username = req.body.username;
    if (!username || username === '') {
        return res
            .status(401)
            .send({ errorMessage: 'Invalid Username' });
    }
    var user = User.findOne({
            username: req.body.username
        }, 'username email')
        .then(function(user) {
            var id_token = createToken(user.username);
            
            mailPasswordReset(user.email, id_token);

            return res
                .status(200)
                .send({ message: "Sending mail" });

        }, function(err) {
            console.log(err);
            return res
                .status(401)
                .send({ errorMessage: "Invalid username" });
        });
});

app.post('/resetuserpassword', function(req, res) {

    var decoded = jwt.verify(req.body.id_token, config.secret);
    var plainPassword = req.body.password;
    var password = bcrypt.hashSync(plainPassword, 10);

    var user = User
        .findOne({ username: decoded.username })
        .then(function(user) {
            user.password = password;
            user.save();
            return res
                .status(200)
                .send({ message: "Password reset" });
        }, function(err) {
            return res
                .status(404)
                .send({ errorMessage: err.message });
        });
});

app.post('/updateuser', function(req, res) {
    if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }
    var user = User.findOne({
                username: req.body.username
            }, 'username email password accessLevel companyName telephone contactPerson mobile a' +
            'ddress fax slug cuid dateAdded dateUpdated', )
        .then(function(user) {          
            if (req.body.password !== user.password) {
                req.body.password = bcrypt.hashSync(req.body.password, 10);
            }
            
            user
                .update(req.body)
                .then(function() {
                    res
                        .status(201)
                        .send({ message: "Update successful", user: user });
                });

        }, function(err) {
            console.log(err);
            return res
                .status(401)
                .send({ errorMessage: "Invalid username" });
        });
});
app.post('/sessions/create', function(req, res) {

    var user = User
        .findOne({ username: req.body.username })
        .then(function(user) {
            if (!bcrypt.compareSync(req.body.password, user.password)) {
            
                return res
                    .status(401)
                    .send({ errorMessage: "Invalid password" });
            } else {
                if (!user.isVerified) {
                    return res
                        .status(401)
                        .send({ errorMessage: "Email not verified." });
                } else {
                    res
                        .status(201)
                        .send({
                            id_token: createToken(user.username),
                            username: user.username,
                            accessLevel: user.accessLevel
                        });
                }
                // set id_token on response set last_logged_in on user and update

            }
        }, function(err) {
            return res
                .status(401)
                .send({ errorMessage: "Invalid username" });
        })
});

app.post('/token', function(req, res) {
    var decoded = false;
    
    if (!req.body) {
        console.log("verify: no token");
        return res
            .status(400)
            .send({ errorMessage: "No token" });
    }
    try {
        decoded = jwt.verify(req.body.id_token, config.secret);
    } catch (err) {
        console.log("zomg: " + err.message);
        return res
            .status(400)
            .send({ errorMessage: "Invalid token" });
    }

    res
        .status(201)
        .send({ decoded: true });
});

// send email with link and token

app.post('/initiateTransferAsset', function (req, res) {  
 
  if (!checkToken(req)) {
            return res.status(401).send({errorMessage: "Invalid token"})
    }
    console.log("initiating transfer");
    var tempAsset = null;
    var buyerEmail = '';
    var sellerEmail = '';
    var buyerUser = null;
    var user = User
    .findOne({username: req.body.username})
    .then(function (user) {
      if (!user) {
        res
          .status(400)
          .send({errorMessage: "User not found"});
      } else {
        var found = false;
        sellerEmail = user.email;
        console.log("found seller " + user.email);
        buyerUser = User.findOne({username: req.body.asset.pendingTransferToUser})
            .then(function (buyerUser) {
                if (!buyerUser) {
                    return res
                    .status(400)
                    .send({errorMessage: "Buyer not found"});
                }
                console.log("found buyer " + buyerUser.email);
                buyerEmail = buyerUser.email;
                for (var i = 0; i < user.assets.length; i++) {
                    if (user.assets[i].dnaCode === req.body.asset.dnaCode) {
                        //if (user.assets[i]._id === req.body.asset._id) {
                        //user.assets[i].pendingTransferToUser = req.body.asset.pendingTransferToUser;
                        user.assets[i].pendingTransferToUser = buyerEmail;
                        user.assets[i].pendingTransfer = true;
                        user.assets[i].status = "Pending Transfer";
                        user.assets[i].dateUpdated = new Date();
                        tempAsset = user.assets[i];
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
                        console.log("user saved");
                        sendTransferEmail(user, buyerUser, tempAsset);
                        res.status(200).send({assets: user.assets});
                    }
                });
                    
            }).catch(function(err){
                throw err;
            })
        
      }
    }, function (err) {
      return res
        .status(400)
        .send({errorMessage: err.message});
    })
});

//display confirm transfer asset page
app.get('/api/transferAsset', function (req, res) {
    var id_token = req.query.id_token;
        
    if (!checkToken(req)) {
        return res.status(401).send({errorMessage: "Invalid token"})
    }

    var user = User
        .findOne({username: req.query.buyerName})
        .then(function (user) {
            res
                .status(200)
                .send(htmlHeader + htmlBodyTagAndLogo + // righty. this is a form with a post, so, hidden inputs, not url params.
                    '<div style="text-align: center; font-family: roboto"><form id="myForm" method="post"'
                    +'action = "https://seekerdnasecure.co.za:3002/api/transferAsset">' +
                    '<input type="hidden" name="id_token" value="' + id_token + '">' +
                    '<input type="hidden" name="sellerName" value="' + req.query.sellerName + '">' +
                    '<input type="hidden" name="buyerName" value="' + user.username + '">' + 
                    '<input type="hidden" name="dnaCode" value="' + req.query.dnaCode + '">' +
                    '<div ><label style="font-size: 20px; font-weight: 700; margin-bottom: 2px; ' +
                    'color: #757575;" >Click "Accept" to confirm transfer of asset <b>' +
                    req.query.dnaCode +       

                    '</b> from user <b>' +
                    req.query.sellerName +       

                    '</b> to user <b>' +
                    user.username +

                    '</b>.</label></div><input type="submit" style="display: inline-block; padding: 8px 16px; font-size: 18px; col' +
                    'or: #FFF; background: #03A9F4; text-decoration: none; border-radius:4px; margin-right: 5px; margin-left: 5px;">Accept</input>' +
                    '</form></div></body></html>');
        })
        .catch(function (err) {
            res
                .status(404)
                .send(err.message);
        });
});

// complete transfer and send some confirmatory
// htmlz.

app.post('/api/transferAsset', function (req, res) {
    console.log("post transferAsset");
    var id_token = req.body.id_token; // req.param????
    if (!id_token) {        
        return res
            .status(404)
            .send("Invalid token");
    }
    var decoded = null;
    try {
        decoded = jwt.verify(id_token, config.secret);
        // decoded = jwt.verify(id_token, config.secret, { ignoreExpiration: true });
        // //just for debuggery
    } catch (err) {
        console.log(err.message);
        return res
            .status(404)
            .send(err.message);
    }

    var user = User
        .findOne({username: req.body.buyerName})
        .then(function (user) {
            console.log("sellerName: " + req.body.sellerName);
            var seller = User.findOne({username: req.body.sellerName}).then(function (seller, user){
                console.log("seller found: " + seller.username);
                var dir = './user_images/' + user.username;
                if (!fs.existsSync(dir)){
                    fs.mkdirSync(dir);
                }
                var asset = seller.assets.find(function(tempAsset) {                    
                    return tempAsset.dnaCode === req.body.dnaCode;                    
                });
                
                if (!asset) {
                    return res.status(404).send("Asset not found!");
                }
                var newAsset = asset.Assign({}, asset);
                newAsset.status = "Active";
                asset.status = "Transferred";
                asset.set("dateTransferred", Date.now());
                newAsset.set("dateTransferred", Date.now());
                asset.pendingTransfer = false;
                newAsset.pendingTransfer = false;
                asset.set("transferredToUser", user.username);
                newAsset.pendingTransferToUser = '';
                
                asset.imageUrls.forEach(function(url) {
                    //simply replace seller foldername with buyer
                    url = url.replace(seller.username, user.username);
                    //copy the physical file
                    var fileName = __dirname + '/user_images/' + url;
                    fs.renameSync(oldPath, newPath);
                })
                user.assets.push(asset);
                user.save();
                seller.save();
                return res.status(201).send({message: "Asset transferred"});
                
            })           

        })
        .catch(function (err) {
            res
                .status(404)
                .send(err.message);
        });
});


function sendTransferEmail(seller, buyer, asset) { // usernames - need to find emails
    console.log("send transfer mail");
    
    var id_token = createBuyerToken(buyer);
    var sellerMessage = "<b>You have received this message because you have initiated the transfer " +
        " of asset with DNA code <i>" + asset.dnaCode + "</i> to user <i>" +
        buyer.username + "</i>. If you did not do this, or think that this may be an error please contact us at DNA@seekerdna.co.za</b>";
    var buyerMessage = "<b>You have received this message because user <i> " + seller.username + " </i> has initiated the transfer to you of " + 
        "an asset with DNA code <i>" + asset.dnaCode + "</i>. " + 
        "Please click <a href='" +
        "https://seekerdnasecure.co.za:3002/api/transferAsset?id_token=" +
        id_token +
        "&dnaCode=" +
        asset.dnaCode +
        "&sellerName=" +        
        seller.username +
        "&buyerName=" +
        buyer.username +
        "'> this link to confirm the transfer</a>." +
        "<br>If you think that this may be an error, please contact DNA@seekerdna.co.za<b>";
        //console.log(buyermessage);
    sendMailMessage(seller.email, "Asset Transfer", sellerMessage);
    sendMailMessage(buyer.email, "Asset Transfer", buyerMessage);
    // send mail to seekerDNA - what's the address?? :)
    
}
function sendMailMessage(email, subject, message) {
    console.log("sendMailMessage email: " + email);
    var mailOptions = {
        from: '"SeekerDNA" <dnanoreply@seekerdna.co.za>',
        to: email,
        subject: subject,
        html: message
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            return console.log(error);
        }
    });
}
function createBuyerToken(username) {    
    return jwt.sign({
        username: username
    }, config.secret);
}

