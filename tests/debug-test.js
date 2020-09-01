/**
 * debug-test.js - Test code for debug module.
 */

'use strict';

process.env.NODE_ENV = 'test';

const DEBUG_FLAGS = require('../egw1-debug');

function resetFlags() {
  DEBUG_FLAGS.DEBUG_serial = false;
  DEBUG_FLAGS.DEBUG_packet = false;
}

describe('debug', () => {
  it('debug', () => {
    resetFlags();
    DEBUG_FLAGS.set('');
    expect(DEBUG_FLAGS.DEBUG_serial).toEqual(false);
    expect(DEBUG_FLAGS.DEBUG_packet).toEqual(false);

    resetFlags();
    DEBUG_FLAGS.set('serial');
    expect(DEBUG_FLAGS.DEBUG_serial).toEqual(true);
    expect(DEBUG_FLAGS.DEBUG_packet).toEqual(false);

    resetFlags();
    DEBUG_FLAGS.set('serial,packet');
    expect(DEBUG_FLAGS.DEBUG_serial).toEqual(true);
    expect(DEBUG_FLAGS.DEBUG_packet).toEqual(true);

    resetFlags();
    DEBUG_FLAGS.set('invalid');
    expect(DEBUG_FLAGS.DEBUG_serial).toEqual(false);
    expect(DEBUG_FLAGS.DEBUG_packet).toEqual(false);
  });
});
