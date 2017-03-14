const config = {
  mongoURL: process.env.MONGO_URL || 'mongodb://localhost:27017/seekerDNA',
  httpPort: process.env.PORT || 3001,
  port: process.env.PORT || 3002,
  secret: 'I drink and code things.',
  dbUser: 'seeker',
  dbPassword: 'yoda100',
  mailUser: 'dnanoreply@seekerdna.co.za',
  mailPassword: 'yodadna100!',
  mailServer: 'mail.seekerdna.co.za'

};
module.exports = config;
