export function checkToken(req) {
  var token = req.body.token || req.query.token;
  console.log(token);
  return true;
}