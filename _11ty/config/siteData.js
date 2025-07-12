const fs = require('fs');
const yaml = require('js-yaml');

const config = yaml.load(fs.readFileSync('./_11ty/_data/config.yml', 'utf8'));
module.exports = config;