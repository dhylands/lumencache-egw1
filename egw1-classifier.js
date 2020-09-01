/**
 * Egw1Classifier - Determines properties for the EGW1 devices.
 *
 */

'use strict';

const {DEBUG_classifier} = require('./egw1-debug');
const { HW_TYPE } = require('./egw1-constants');
const Egw1Property = require('./egw1-property');

const DEBUG = DEBUG_classifier;

class Egw1Classifier {

  constructor() {

  }

  addIdProperty(node) {
    this.addProperty(
      node,
      'id',
      {
        label: 'ID',
        type: 'string',
        readOnly: true,
      },
    ).value = node.addr;
  }

  addHwVersionProperty(node) {
    this.addProperty(
      node,
      'hwVersion',
      {
        label: 'HW Version',
        type: 'string',
        readOnly: true,
      },
    ).value = node.hwVersion;
  }

  addFwVersionProperty(node) {
    this.addProperty(
      node,
      'fwVersion',
      {
        label: 'FW Version',
        type: 'string',
        readOnly: true,
      },
    ).value = node.fwVersion;
  }

  addSerialProperty(node) {
    this.addProperty(
      node,
      'serial',
      {
        label: 'Serial',
        type: 'string',
        readOnly: true,
      },
    ).value = node.serial;
  }


  addOnProperty(node) {
    this.addProperty(
      node,                           // device
      'on',                           // name
      {// property description
        '@type': 'OnOffProperty',
        label: 'On/Off',
        type: 'boolean',
      },
      'setOnOffValue',
      'parseOnOffHwValue'
    );
  }

  addLevelProperty(node) {
    this.addProperty(
      node,                             // device
      'level',                          // name
      {// property description
        '@type': 'LevelProperty',
        label: 'Level',
        type: 'number',
        unit: 'percent',
        minimum: 0,
        maximum: 100,
      },
      'setLevelValue',
      'parseHwLevel'
    );
  }

  addProperty(node, name, descr, setHwFromValue, parseValueFromHw) {
    const property = new Egw1Property(node, name, descr, setHwFromValue, parseValueFromHw);

    node.properties.set(name, property);

    DEBUG && console.log('addProperty:', node.addr, name);

    return property;
  }

  classify(node) {
    DEBUG && console.log('classify called for node:', node.addr);

    if (!node.hasOwnProperty('@type')) {
      node['@type'] = [];
    }

    this.classifyInternal(node);

    // Now that we know the type, set the default name.
    node.defaultName = `${node.id}-${node.type}`;
    if (!node.name) {
      node.name = node.defaultName;
    }
    DEBUG && console.log('classify: Initialized as type:', node.type,
                         'name:', node.name,
                         'defaultName:', node.defaultName);
  }

  // internal function allows us to use early returns.
  classifyInternal(node) {
    if (DEBUG) {
      console.log('---- EGW1 classifier -----');
      console.log(`  node id: ${node.id}`)
      console.log(`   hwType: ${node.hwType} (${HW_TYPE[node.hwType]})`);
    }

    switch (node.hwType) {
      case HW_TYPE.WP: {
        this.initWp(node);
        break;
      }
      default: {
        console.error('Unrecognized hwType:', node.hwType);
        break;
      }
    }

    this.addIdProperty(node);
    this.addHwVersionProperty(node);
    this.addFwVersionProperty(node);
    this.addSerialProperty(node);
  }

  initWp(node) {
    node['@type'] = ['OnOffSwitch', 'MultiLevelSwitch'];
    node.type = 'wp';

    this.addOnProperty(node);
    this.addLevelProperty(node);
  }
}

module.exports = new Egw1Classifier();
