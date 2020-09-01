/**
 * index.js - Loads the LumenCache EGW1 adapter
 */

'use strict';

const {Database} = require('gateway-addon');
const {id} = require('./manifest.json');

// Try opening the serial port and loading the adapter.
async function loadEgw1Adapter(addonManager, _, _errorCallback) {
  let config = {};
  const db = new Database(id);
  await db.open().then(() => {
    return db.loadConfig();
  }).then((cfg) => {
    config = cfg;

    if (config.hasOwnProperty('debug')) {
      console.log(`DEBUG config = '${config.debug}'`);
      require('./egw1-debug').set(config.debug);
    }

    return db.saveConfig(config);
  }).then(() => {
    console.log('Closing database');
    db.close();
  });

  // We put the egw1-adapter require here rather then at the top of the
  // file so that the debug config gets initialized before we import
  // the adapter class.
  const Egw1Adapter = require('./egw1-adapter');
  new Egw1Adapter(addonManager, config.port);
}

module.exports = loadEgw1Adapter;
