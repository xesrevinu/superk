require('babel/register')({
  optional: ['asyncToGenerator'],
});
module.exports = require('./lib/application');