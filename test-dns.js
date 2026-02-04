const dns = require('dns').promises;

dns.resolveSrv('_mongodb._tcp.admeasy.akinwn4.mongodb.net')
  .then(console.log)
  .catch(console.error);