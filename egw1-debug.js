/**
 *
 * egw1-debug - manage debug configuration.
 */

'use strict';

const DEBUG_FLAG = {
  // Use DEBUG_classifier for debugging the behaviour of the classifier.
  DEBUG_classifier: false,

  // Use DEBUG_flow if you need to debug the flow of the program. This causes
  // prints at the beginning of many functions to print some info.
  DEBUG_flow: true,

  // Use DEBUG_serial to show data being sent/received.
  DEBUG_serial: true,

  // Use DEBUG_packet to show packets that are sent/received
  DEBUG_packet: true,

  set: function(names) {
    for (const name of names.split(/[, ]+/)) {
      if (name === '') {
        // If names is empty then split returns ['']
        continue;
      }
      const debugName = `DEBUG_${name}`;
      if (DEBUG_FLAG.hasOwnProperty(debugName)) {
        console.log(`Enabling ${debugName}`);
        DEBUG_FLAG[debugName] = true;
      } else {
        console.log(`DEBUG: Unrecognized flag: '${debugName}' (ignored)`);
      }
    }
  },
};

module.exports = DEBUG_FLAG;
