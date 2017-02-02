// routes for reset password, confirm email pages. i.e., for the react web app,
// but not handled in the app.

import express from 'express';
import config from './config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from './models/User';

var app = module.exports = express.Router();
var htmlHeader = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"\"vi" +
        "ewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"icon\" href=" +
        "\"https://seekerdnasecure.co.za:3002/favicon.ico\"><title>Seeker DNA Asset Regis" +
        "ter</title></head>";
var htmlHeaderWithPasswordValidation = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"\"vi" +
        "ewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"icon\" href=" +
        "\"https://seekerdnasecure.co.za:3002/favicon.ico\"><title>Seeker DNA Asset Regis" +
        "ter</title><script>function submitForm() { var password = document.getElementByI" +
        "d(\"password\"), passwordConfirm = document.getElementById(\"passwordConfirm\");func" +
        "tion validatePassword(){   if(password.value != passwordConfirm.value) {     pas" +
        "swordConfirm.setCustomValidity(\"Passwords Don\'t Match\");   } else {     passwor" +
        "dConfirm.setCustomValidity(\'\');   } } password.onchange = validatePassword; pa" +
        "sswordConfirm.onkeyup = validatePassword; }</script></head>";

var htmlBodyTagAndLogo = '<body><div style=" margin: auto;"><img src="https://seekerdnasecure.co.za:3002/l' +
        'ogo.png" style="height: 200px; display: block; margin: auto;" alt="logo"/></div>';
var htmlBodyTagWithOnload = '<body onload="loadInputs()"><div style=" margin: auto;"><img src="https://seeker' +
        'dnasecure.co.za:3002/logo.png" style="height: 200px; display: block; margin: aut' +
        'o;" alt="logo"/></div>';

var htmlForm = '<div style="text-align: center; font-family: roboto"><form id="myForm" method="p' +
        'ost"><div ><label style="font-size: 20px; font-weight: 700; margin-bottom: 2px; ' +
        'color: #757575;" htmlFor="password">Enter new Password:</label></div><div><input' +
        ' style="font-size: 20px; font-weight: 700; margin-bottom: 2px; color: #757575;" ' +
        'type="password" placeholder="8 digits, 1 uppercase letter, 1 special character."' +
        ' ref="password" id="password" name="password" required invalid { color: red; } /' +
        '></div><div><input style="font-size: 20px; font-weight: 700; margin-bottom: 2px;' +
        ' color: #757575;" type="password" placeholder="Confirm password" ref="passwordCo' +
        'nfirm" id="passwordConfirm" required	 invalid { color: red; } /></div><input typ' +
        'e="submit" style="display: inline-block; padding: 8px 16px; font-size: 18px; col' +
        'or: #FFF; background: #03A9F4; text-decoration: none; border-radius:4px; margin-' +
        'right: 5px; margin-left: 5px;" /></form></div>';

var loadInputs = '<script >function loadInputs() {  document.getElementById("myForm").action = "ht' +
        'tps://seekerdnasecure.co.za:3002/api/resetuserpassword/';
var endLoadInputs = '";   }</script>';

// url format:
// https://seekerdnasecure.co.za:3002/api/resetuserpassword/eyJhbGciOiJIUzI1NiIsI
// nR5cCetcetcetc... example for dev:
// https://localhost:3002/api/resetuserpassword/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV
// CJ9.eyJ1c2VybmFtZSI6InRlc3QzIiwiaWF0IjoxNDg0OTAzNzUwLCJleHAiOjE0ODQ5OTAxNTB9.v
// xtKinh4bHCaRaA8xYi_lKars10ac7sOVVkup1bxbzE

app.get('/api/resetuserpassword/:id_token', function (req, res) {
    var id_token = req.params.id_token;
    if (!id_token) {
        console.log("invalid token");
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
        .findOne({username: decoded.username})
        .then(function (user) {
            res
                .status(200)
                .send(htmlHeaderWithPasswordValidation + htmlBodyTagWithOnload + htmlForm + loadInputs + id_token + endLoadInputs + "</body></html>");
        })
        .catch(function (err) {
            res
                .status(404)
                .send("user not found");
        });
});

app.post('/api/resetuserpassword/:id_token', function (req, res) {
    var id_token = req.params.id_token;
    if (!id_token) {
        console.log("invalid token");
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
        .findOne({username: decoded.username})
        .then(function (user) {
            // hash the new password then save it.
            let plainPassword = req.body.password;
            bcrypt
                .hash(plainPassword, 10)
                .then(function (hash) {
                    
                    user.password = req.body.password;
                    user.save();
                    res
                        .status(200)
                        .send(htmlHeader + htmlBodyTagAndLogo + ' <div style="font-size: 20px; text-align: center; font-weight: 700; margin-botto' +
                                'm: 2px; color: #757575;">Your password has been successfully reset. Please login' +
                                ' at <a href="https://seekerdnasecure.co.za">SeekerDnaSecure</a>.</div> </body></' +
                                'html>');
                });

        })
        .catch(function (err) {
            res
                .status(404)
                .send("user not found");
        });
});

app.get('/api/confirm/:id_token', function (req, res) {
    var id_token = req.params.id_token;
    if (!id_token) {
        console.log("invalid token");
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
        .findOne({username: decoded.username})
        .then(function (user) {
            user.isVerified = true;
            user.save();
            res
                .status(200)
                .send(htmlHeader + htmlBodyTagAndLogo + ' <div style="font-size: 20px; text-align: center; font-weight: 700; margin-botto' +
                        'm: 2px; color: #757575;">Your email has been verified. Please login at <a href="' +
                        'https://seekerdnasecure.co.za">SeekerDnaSecure</a>.</div> </body></html>');
        })
        .catch(function (err) {
            res
                .status(404)
                .send("user not found");
        });
});