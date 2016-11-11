const config = {
  mongoURL: process.env.MONGO_URL || 'mongodb://localhost:27017/seekerDNA',
  port: process.env.PORT || 3001,
  secret: "I drink and code things."
  
};
module.exports = config;
