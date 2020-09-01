/**
 * egw1-adapter.js - LumenCache EGW1 Adapter
 */

'use strict';

const {
  CMD_TIMEOUT_MSEC,
  MAX_ID,
  PACKET_TERMINATOR,
  PACKET_TYPE,
  RX_TIMEOUT_MSEC,
} = require('./egw1-constants');

const {
  DEBUG_flow,
  DEBUG_packet,
  DEBUG_serial,
} = require('./egw1-debug');

const {id} = require('./manifest.json');
const {Adapter} = require('gateway-addon');
const net = require('net');
const SerialPort = require('serialport');
const Egw1Node = require('./egw1-node');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

class Egw1Adapter extends Adapter {

  constructor(addonManager, portName) {
    // We don't yet know the name of the adapter, so we set it to
    // unknown for now, and replace it later once we get the information
    // from the device.
    super(addonManager, 'lumencache-egw1', id);

    this.portName = portName;

    if (this.portName.startsWith('/dev')) {
      // Looks like a serial port
      this.port = new SerialPort(portName, {
        baudRate: 38400,
      }, (err) => {
        if (err) {
          console.error('Unable to open serial port', portName);
          console.error(err);
          return;
        }
        console.log('Opened serial port', portName);
        this.port.setNoDelay();
        this.onOpen();
      });
    } else if (this.portName == 'test') {
      // Used for testing
    } else {
      // Assume its a hostname:port

      const namePieces = portName.split(':');
      if (namePieces.length != 2) {
        console.error(`Expecting hostname:port; found '${this.portName}'`);
        return;
      }
      const options = {
        host: namePieces[0],
        port: parseInt(namePieces[1], 10),
      };
      this.port = net.createConnection(options, () => {
        console.log('Opened TCP connection to', portName);
        this.port.setNoDelay(true);
        this.onOpen();
      });
      this.port.on('error', (err) => {
        console.error('Unable to connect to', portName);
        console.error(err.message);
      });
      this.port.on('end', () => {
        // The server shutdown
        console.log('Server', portName, 'shutdown');
      });
    }

    this.packetType = null;
    this.packetData = '';
    this.scanId = null;
    this.cmdTimeout = null;
    this.rxTimeout = null;
    this.txQueue = [];

    this.nodes = {};

    if (this.port) {
      this.port.on('data', (data) => {
        this.onData(data);
      });
    }

    this.manager.addAdapter(this);
  }

  /*
  onThing(msgData) {
    console.log('Thing:', msgData.id,
                'name:', msgData.name,
                'type:', msgData.type,
                'description:', msgData.description,
                'propertyCount:', msgData.propertyCount);
    this.newThing = new SerialThing(this, msgData);
    this.propertyCount = msgData.propertyCount;
    this.propertyIdx = 0;
    this.send('getPropertyByIdx', {
      thingIdx: this.thingIdx,
      propertyIdx: 0,
    });
  }

  onThingDone() {
    this.handleDeviceAdded(this.newThing);
    this.newThing = null;

    this.thingIdx += 1;
    if (this.thingIdx < this.thingCount) {
      this.send('getThingByIdx', {
        thingIdx: this.thingIdx,
      });
    }
  }

  onProperty(msgData) {
    console.log('Property:', msgData.name,
                'type:', msgData.type,
                'value:', msgData.value);
    if (this.newThing) {
      this.newThing.addProperty(msgData);
    }

    this.propertyIdx += 1;
    if (this.propertyIdx < this.propertyCount) {
      this.send('getPropertyByIdx', {
        thingIdx: this.thingIdx,
        propertyIdx: this.propertyIdx,
      });
    } else {
      this.onThingDone();
    }
  }

  onPropertyChanged(msgData) {
    console.log('PropertyChanged: id:', msgData.id,
                'name:', msgData.name,
                'value:', msgData.value);

    const thing = this.getDevice(msgData.id);
    if (thing) {
      const property = thing.findProperty(msgData.name);
      if (property) {
        property.setCachedValue(msgData.value);
        thing.notifyPropertyChanged(property);
      } else {
        console.log('propertyChanged for unknown property:', msgData.name,
                    '- ignoring');
      }
    } else {
      console.log('propertyChanged for unknown thing:', msgData.id,
                  '- ignoring');
    }
  }
  */

  createNodeIfRequired(id) {
    let node = this.nodes[id];
    if (!node) {
      node = this.nodes[id] = new Egw1Node(this, id);
    }
    return node;
  }

  handleDeviceAdded(node) {
    node.classify();
    super.handleDeviceAdded(node);
  }

  parseByte(byte) {
    if (this.packetType) {
      // We're in the middle of parsing a response
      if (byte == this.packetTerminator) {
        // We've received the end of the packet
        DEBUG_packet &&
          console.log('Got pkt:',
                      String.fromCharCode(this.packetType) +
                      this.packetData +
                      String.fromCharCode(this.packetTerminator));
        this.onPacket(this.packetType, this.packetData.split(','));
        this.packetType = null;
        this.packetData = '';
      } else {
        this.packetData += String.fromCharCode(byte);
      }
    } else if (byte == PACKET_TYPE.CONFIG) {
      this.packetType = byte;
      this.packetTerminator = PACKET_TERMINATOR.CONFIG;
      this.packetData = '';
    } else if (byte == PACKET_TYPE.VALUE) {
      this.packetType = byte;
      this.packetTerminator = PACKET_TERMINATOR.VALUE;
      this.packetData = '';
    } else {
      const hexBytes = `00${byte.toString(16)}`;
      console.log(`Unexpected Character received: 0x${hexBytes[-2]}`);
    }
  }

  onData(data) {
    DEBUG_serial && console.log(`Got data:${data} '${data.toString()}'`);

    if (this.rxTimeout) {
      clearTimeout(this.rxTimeout);
      this.rxTimeout = null;
    }

    // We've just received some data. Start a timer so that we defer
    // sending until the timeout has passed.
    this.rxTimeout = setTimeout(() => {
      this.rxTimeout = null;
      this.sendQueuedDataIfRequired();
    }, RX_TIMEOUT_MSEC);

    for (const byte of data) {
      // console.log('byte =', byte);
      this.parseByte(byte);
    }

  }

  onOpen() {
    // this.send('getAdapter');
    console.log('onOpen called');

    /*
    const msg = '[253,0]';
    console.log(`Writing ${msg}`);
    this.port.write(msg);
    */

    this.scanning = true;
    this.scanId = 1;
    this.scan(this.scanId);
  }

  onPacket(packetType, parsedData) {
    console.log('onPacket: this.scanId =', this.scanId);

    if (this.cmdTimeout) {
      console.log('Clearing timeout');
      clearTimeout(this.cmdTimeout);
      this.cmdTimeout = null;
    }

    const id = parsedData[0];
    const node = this.createNodeIfRequired(id);

    switch (packetType) {
      case PACKET_TYPE.VALUE:
        const value = parsedData[1];
        node.onValue(value);
        break;

      case PACKET_TYPE.CONFIG:
        node.onConfig({
          hwType: parsedData[1],
          hwVersion: parsedData[2],
          fwVersion: parsedData[3],
          serial: parsedData[4],
        });
        node.configured = true;
        break;
    }

    if (this.scanId) {
      // We're scanning.
      if (node.configured) {
        // We know everything about this node, continue to the next one
        this.scanNext();
      } else {
        // We only know the ID, get the rest of the configuration information.
        node.requestEEPROMConfig();
      }
    }
  }

  scan(scanId) {
    this.requestCurrentOutputValue(scanId);
  }

  scanNext() {
    if (this.scanId < MAX_ID) {
      this.scanId += 1;

      this.scan(this.scanId);
    } else {
      // We're done the initial scan.
      this.scanId = null;
      this.scanning = false;

      console.log('Initial Scan done');
    }
  }

  cmdTimeoutExpired() {
    DEBUG_serial && console.log(`Cmd timeout (${CMD_TIMEOUT_MSEC}) expired for ID: ${this.scanId}`);
    this.scanNext();
  }

  requestCurrentOutputValue(id) {
    this.send(`[${id},256]`);
  }

  send(str) {
    if (this.rxTimeout) {
      // We can't send right now, queue it up instead.
      DEBUG_serial && console.log(`adapter send: Queuing: '${str}'`);
      this.txQueue.push(str);
    } else {
      DEBUG_serial && console.log(`adapter send: Writing: '${str}'`);
      this.port.write(str);
      console.log('send: Setting timeout');
      this.cmdTimeout = setTimeout(this.cmdTimeoutExpired.bind(this),
                                   CMD_TIMEOUT_MSEC);
    }
  }

  sendQueuedDataIfRequired() {
    DEBUG_flow && console.log('sendQueuedDataIfRequired');
    const str = this.txQueue.shift();
    if (str) {
      this.send(str);
    }
  }
}

module.exports = Egw1Adapter;
