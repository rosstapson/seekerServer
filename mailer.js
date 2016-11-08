var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'ross.tapson.test@gmail.com',
    pass: 'mrstapson1'
  },
  tls: {
    rejectUnauthorized: false
  }
});
export function mailToken(email, token) {
  // var html = '<b>Hello world ✔</b>';
  var mailOptions = {
    from: 'ross.test.tapson@gmail.com',
    to: email,
    subject: 'Please confirm your registration',
    html: '<b>Thank you for signing up for SeekerDNA Asset Register. To confirm your regist' +
        'ration, please click <a href="http://localhost:3000/confirm/' + 
        token + 
        '">here</a>. ✔ <br> This will expire in 24 hours.</b>'
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}
