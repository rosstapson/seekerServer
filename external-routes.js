// routes for reset password, confirm email pages.
// i.e., for the react web app, but not handled in the app.


import express from 'express';
import config from './config';
import jwt from 'jsonwebtoken';
import User from './models/User';
//import form from './html/password_reset_form';

var app = module.exports = express.Router();
var htmlHeader = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"" +
    "\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"icon\" href" +
    "=\"http://seekerdnasecure.co.za:3001/favicon.ico\"><title>Seeker DNA Asset Register</title>" +
    "</head>";
var htmlHeaderWithPasswordValidation = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"" +
    "\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"icon\" href" +
    "=\"http://seekerdnasecure.co.za:3001/favicon.ico\"><title>Seeker DNA Asset Register</title>" +
    '<script>function submitForm() { var password = document.getElementById("password"), passwordConfirm = document.getElementById("passwordConfirm");function validatePassword(){   if(password.value != passwordConfirm.value) {     passwordConfirm.setCustomValidity("Passwords Don\'t Match");   } else {     passwordConfirm.setCustomValidity(\'\');   } } password.onchange = validatePassword; passwordConfirm.onkeyup = validatePassword; }</script></head>';

var htmlBodyTagAndLogo = '<body><div style=" margin: auto;"><img src="http://seekerdnasecure.co.za:3001/logo.png" style="height: 200px; display: block; margin: auto;" alt="logo"/></div>';
var htmlBodyTagWithOnload = '<body onload="loadInputs()"><div style=" margin: auto;"><img src="http://seekerdnasecure.co.za:3001/logo.png" style="height: 200px; display: block; margin: auto;" alt="logo"/></div>';

var htmlForm = '<div style="text-align: center; font-family: roboto"><form id="myForm" method="post"><div ><label style="font-size: 20px; font-weight: 700; margin-bottom: 2px; color: #757575;" htmlFor="password">Enter new Password:</label></div><div><input style="font-size: 20px; font-weight: 700; margin-bottom: 2px; color: #757575;" type="password" placeholder="8 digits, 1 uppercase letter, 1 special character." ref="password" id="password" name="password" required invalid { color: red; } /></div><div><input style="font-size: 20px; font-weight: 700; margin-bottom: 2px; color: #757575;" type="password" placeholder="Confirm password" ref="passwordConfirm" id="passwordConfirm" required	 invalid { color: red; } /></div><input type="submit"style="display: inline-block; padding: 8px 16px; font-size: 18px; color: #FFF; background: #03A9F4; text-decoration: none; border-radius:4px; margin-right: 5px; margin-left: 5px;" ">Submit</input><input id="myHidden" type="hidden" value="" /></form></div>';

var loadInputs = '<script >function loadInputs() { ' +
    ' document.getElementById("myForm").action = "http://seekerdnasecure.co.za:3001/api/resetuserpassword/';
var endLoadInputs = '";  ' +
    ' }</script>';

//url format:
//http://seekerdnasecure.co.za/api/resetuserpassword/eyJhbGciOiJIUzI1NiIsInR5cCetcetcetc...
//example for dev: http://localhost:3001/api/resetuserpassword/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QzIiwiaWF0IjoxNDg0OTAzNzUwLCJleHAiOjE0ODQ5OTAxNTB9.vxtKinh4bHCaRaA8xYi_lKars10ac7sOVVkup1bxbzE
app.get('/api/resetuserpassword/:id_token', function(req, res) {
    var id_token = req.params.id_token;
    if (!id_token) {
        console.log("invalid token");
        return res.status(404).send("Invalid token");
    }
    var decoded = null;
    try {
        //decoded = jwt.verify(id_token, config.secret);
        decoded = jwt.verify(id_token, config.secret, { ignoreExpiration: true }); //just for debuggery
    } catch (err) {
        console.log(err.message);
        return res.status(404).send(err.message);
    }

    var user = User
        .findOne({ username: decoded.username })
        .then(function(user) {
            res.status(200).send(htmlHeaderWithPasswordValidation + htmlBodyTagWithOnload +
                htmlForm + loadInputs + id_token + endLoadInputs + "</body></html>");
        })
        .catch(function(err) {
            res.status(404).send("user not found");
        });
});

app.post('/api/resetuserpassword/:id_token', function(req, res) {
    var id_token = req.params.id_token;
    if (!id_token) {
        console.log("invalid token");
        return res.status(404).send("Invalid token");
    }
    var decoded = null;
    try {
        //decoded = jwt.verify(id_token, config.secret);
        decoded = jwt.verify(id_token, config.secret, { ignoreExpiration: true }); //just for debuggery
    } catch (err) {
        console.log(err.message);
        return res.status(404).send(err.message);
    }

    var user = User
        .findOne({ username: decoded.username })
        .then(function(user) {
            user.password = req.body.password;
            user.save();
            res.status(200).send(htmlHeader + htmlBodyTagAndLogo +
                ' <div style="font-size: 20px; text-align: center; font-weight: 700; margin-bottom: 2px; color: #757575;">Your password has been success' +
                'fully reset. Please login at <a href="http://seekerdnasecure.co.za">SeekerDnaSecure</a>.</div> ' +
                '</body></html>');
        })
        .catch(function(err) {
            res.status(404).send("user not found");
        });
});

app.get('/api/confirm/:id_token', function(req, res) {
    var id_token = req.params.id_token;
    if (!id_token) {
        console.log("invalid token");
        return res.status(404).send("Invalid token");
    }
    var decoded = null;
    try {
        //decoded = jwt.verify(id_token, config.secret);
        decoded = jwt.verify(id_token, config.secret, { ignoreExpiration: true }); //just for debuggery
    } catch (err) {
        console.log(err.message);
        return res.status(404).send(err.message);
    }

    var user = User
        .findOne({ username: decoded.username })
        .then(function(user) {
            user.isVerified = true;
            user.save();
            res.status(200).send(htmlHeader + htmlBodyTagAndLogo +
                ' <div style="font-size: 20px; text-align: center; font-weight: 700; margin-bottom: 2px; color: #757575;">Your email' +
                ' has been verified. Please login at <a href="http://seekerdnasecure.co.za">SeekerDnaSecure</a>.</div> ' +
                '</body></html>');
        })
        .catch(function(err) {
            res.status(404).send("user not found");
        });
});