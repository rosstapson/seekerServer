export function checkToken(req) {
  var token = req.body.id_token || req.query.id_token;
  console.log(token);
  return true;
}