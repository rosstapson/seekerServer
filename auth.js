import jwt from 'jsonwebtoken';
import config from './config';

export function checkToken(req) {
  var token = req.body.id_token || req.query.id_token || req.headers['x-access-token'];
  if (!token) {
    return false;
  }
  try {
    jwt.verify(token, config.secret);
    return true;
  }
  catch (err) {
    return false;
  }
}