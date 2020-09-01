/**
 * Egw1Node - represents a node on the EGW1 network
 */

'use strict';

//const assert = require('assert');
//const cloneDeep = require('clone-deep');

const {
  DEBUG_flow,
} = require('./egw1-debug');

const egw1Classifier = require('./egw1-classifier');
const Egw1Property = require('./egw1-property');

const {Device, Event, Utils} = require('gateway-addon');

class Egw1Node extends Device {

  constructor(adapter, id) {
    const deviceId = `egw1-${id}`;
    super(adapter, deviceId);
    this.addr = id;

    this.defaultName = `${deviceId}-Node`;
    this.configured = false;
  }

  classify() {
    DEBUG_flow && console.log('classify called for node:', this.id);
    egw1Classifier.classify(this);

    // Call this.onValue to have the initial value propogated to the properties
    this.onValue(this.value);
  }

  onConfig(config) {
    this.hwType = config.hwType;
    this.hwVersion = config.hwVersion;
    this.fwVersion = config.fwVersion;
    this.serial = config.serial;
    this.configured = true;

    this.adapter.handleDeviceAdded(this);
  }

  onValue(value) {
    DEBUG_flow && console.log(`Node ${this.id}:  onValue: ${value}`);
    value = Number(value);
    if (isNaN(value)) {
      value = 0;
    }

    const levelProperty = this.findProperty('level');
    if (levelProperty) {
      levelProperty.onValue(value);
    }
    const onOffProperty = this.findProperty('on');
    if (onOffProperty) {
      onOffProperty.onValue(value);
    }
  }

  requestCurrentOutputValue(id) {
    this.send(`[${this.addr},256]`);
  }

  requestEEPROMConfig() { // Config:A
    this.send(`[${this.addr},258]`);
  }

  send(str) {
    this.adapter.send(str);
  }

  setValue(val) {
    if (val < 0) {
      val = 0;
    }
    if (val > 255) {
      val = 255;
    }
    this.value = val;
    this.send(`[${this.addr},${val}]`);
  }
}

module.exports = Egw1Node;
