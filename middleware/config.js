const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));

exports.config = config;