/**
 * egw1-const.js - LumenCache EGW1 Adapter
 */

'use strict';

const MAX_ID = 9;

// CMD_TIMEOUT_MSEC is how long we should wait for a response
// before we consider the device to be "missing".
//
// CMD_TIMEOUT_MSEC should be fairly small (25-50 msec)
// when talking to a direct serial port. The larger value is
// needed when using ser2net.
const CMD_TIMEOUT_MSEC = 100;

// Once we start to receive data, we need to go for this long
// without receiving data before we can send data, otherwise
// our sent data won't be seen by the devices. This is due
// to the half-duplex nature of the RS-485 comms.
const RX_TIMEOUT_MSEC = 300;

const HW_TYPE = {
  '2':  'wp',

  WP: '2',
}

const PACKET_TYPE = {
  CONFIG: 0x7b,  // {
  VALUE: 0x28,   // (
};

const PACKET_TERMINATOR = {
  CONFIG: 0x7d,  // }
  VALUE: 0x29,   // )
};

module.exports = {
  CMD_TIMEOUT_MSEC,
  HW_TYPE,
  MAX_ID,
  PACKET_TERMINATOR,
  PACKET_TYPE,
  RX_TIMEOUT_MSEC,
};
