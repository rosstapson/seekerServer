export function checkToken(req) {
  var token = req.body.id_token || req.query.id_token || req.headers['x-access-token'];
  console.log(token);
  return true;
}