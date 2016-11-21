import express from 'express';
import User from './models/User';

var app = module.exports = express.Router();

app.post('/assets', function (req, res) {
  console.log("asset-routes.js: /assets for:" + req.body);  

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