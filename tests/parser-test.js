/**
 * parser-test.js - Test code for testing the serial parser.
 */

'use strict';

process.env.NODE_ENV = 'test';

// require('../egw1-debug').set('serial,packet');

const AddonManager = require('./mock-addonManager');
const Egw1Adapter = require('../egw1-adapter');

/* eslint max-len: ["error", { "code": 200 }] */
const TESTS = [
  ['{', '{1,2,3,180702.01,505136394231690C0A32}', ['1', '2', '3', '180702.01', '505136394231690C0A32']], // Config A
  ['{', '{1,5,1,2,35,220,255,0,1,0}', ['1', '5', '1', '2', '35', '220', '255', '0', '1', '0']], // Config B
  ['{', '{1,505136394231690C0A32}', ['1', '505136394231690C0A32']], // Config C
  ['{', '{1,3,4,603,604,605,606,251,252}', ['1', '3', '4', '603', '604', '605', '606', '251', '252']], // Config D
  ['(', '(1,0)', ['1', '0']], // Value
];

describe('parser', () => {
  it('parser', () => {
    const addonManager = new AddonManager();
    const adapter = new Egw1Adapter(addonManager, 'test');
    let onPacketCount = 0;

    adapter.onPacket = (packetType, parsedData) => {
      // console.log('test.onPacket: packetType =', packetType, 'parsedData =', parsedData, 'testPacketType =', adapter.testPacketType);
      expect(packetType).toEqual(adapter.testPacketType);
      expect(JSON.stringify(parsedData)).toEqual(JSON.stringify(adapter.testParsedData));
      onPacketCount += 1;
    };

    for (const test of TESTS) {
      adapter.testPacketType = test[0].charCodeAt(0);
      const testPacketData = Buffer.from(test[1]);
      adapter.testParsedData = test[2];
      onPacketCount = 0;
      adapter.onData(testPacketData);
      expect(onPacketCount).toEqual(1);
    }
  });
});
