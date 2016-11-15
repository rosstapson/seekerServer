import express from 'express';
import User from './models/User';

var app = module.exports = express.Router();

app.post('/assets', function (req, res) {
  console.log(" asset-routes.js: /assets");
  

  var user = User.findOne({username: req.body.username}).then(
    function(user) {
      
        res.status(201).send({ assets:user.assets });
      
    },
    function(err) {
       return res
          .status(400)
          .send({errorMessage: err.message});
    }
  ) 
});