/**
 * EGW1 Property.
 *
 * Object which decscribes a property, and its value.
 */

'use strict';

const {Deferred, Property, Utils} = require('gateway-addon');

/**
 * @function levelToPercent
 *
 * Converts a light level in the range 0-255 into a percentage using
 * linear interpolation.
 */
function levelToPercent(level) {
  if (level < 1) {
    return 0;
  }
  return Math.min(level * 100 / 255, 100);
}

/**
 * @function percentToLevel
 *
 * Inverse of the levelToPercent function. Takes a percentage in the range
 * 0-100 and converts it into a level in the range 0-255.
 */
function percentToLevel(percent) {
  if (percent < 0.1) {
    return 0;
  }
  return Math.min(Math.round(percent * 255 / 100), 255);
}

class Egw1Property extends Property {

  constructor(device, name, propertyDescr, setHwFromValue, parseValueFromHw) {
    super(device, name, propertyDescr);

    if (setHwFromValue) {
      this.setHwFromValue = Object.getPrototypeOf(this)[setHwFromValue];
      if (!this.setHwFromValue) {
        const err = `Unknown function: ${setHwFromValue}`;
        console.error(err);
        throw err;
      }
    }
    if (parseValueFromHw) {
      this.parseValueFromHw = Object.getPrototypeOf(this)[parseValueFromHw];
      if (!this.parseValueFromHw) {
        const err = `Unknown function: ${parseValueFromHw}`;
        console.error(err);
        throw err;
      }
    }
  }

  /**
   * @method parseLevel
   *
   * Called by the node in response to receiving a new value.
   */

  onValue(hwValue) {
    console.log('onValue: hwValue =', hwValue, 'typeof(hwValue) =', typeof(hwValue));
    let propertyValue;
    let logValue;
    if (this.parseValueFromHw) {
      [propertyValue, logValue] = this.parseValueFromHw(hwValue);
    } else {
      propertyValue = hwValue;
      logValue = `${propertyValue}`
    }

    console.log(this.name, 'property:', this.name, 'value:', logValue);
    this.setCachedValueAndNotify(propertyValue);
  }

  /**
   * @method parseHwLevel
   *
   * Converts the HW level value (0-255) into
   * a 'level' property (a percentage).
   */
  parseHwLevel(hwValue) {
    this.hwLevel = hwValue;
    const percent = levelToPercent(hwValue);
    return [
      percent,
      `${percent.toFixed(1)}% (hw: ${hwValue})`,
    ];
  }

  /**
   * @method parseOnOffHwValue
   *
   * Converts the HW level value (0-255) into
   * a 'level' property (a percentage).
   */
  parseOnOffHwValue(hwValue) {
    const propertyValue = !!hwValue;
    return [
      propertyValue,
      `${propertyValue} (hw: ${hwValue})`,
    ];
  }

  /**
   * @method setLevelValue
   *
   * Convert the 'level' property value (a percentage) into a HW
   * level (0-255).
   */
  setLevelValue(propertyValue) {
    // propertyValue is a percentage 0-100
    const hwValue = percentToLevel(propertyValue);
    this.hwLevel = hwValue;
    return [
      hwValue,
      `hw: ${hwValue} (${propertyValue.toFixed(1)}%)`,
    ];
  }

  /**
   * @method setOnOffValue
   *
   * Convert property value (a boolean) into a HW
   * level (0-255).
   */
  setOnOffValue(propertyValue) {
    const hwValue = propertyValue ? 0 : this.hwLevel;
    return [
      hwValue,
      `hw: ${hwValue} (${propertyValue})`,
    ];
  }

  /**
   * @method setValue
   * @returns a promise which resolves to the updated value.
   *
   * @note it is possible that the updated value doesn't match
   * the value passed in.
   */
  setValue(value) {
    if (!this.setHwFromValue) {
      const msg = 'Egw1Property:setValue: no setHwFromValue';
      console.error(msg);
      return Promise.reject(msg);
    }
    if (this.hasOwnProperty('minimum') && value < this.minimum) {
      return Promise.reject(`Value less than minimum: ${this.minimum}`);
    }

    if (this.hasOwnProperty('maximum') && value > this.maximum) {
      return Promise.reject(`Value greater than maximum: ${this.maximum}`);
    }

    /*
    let deferredSet = this.deferredSet;
    if (!deferredSet) {
      deferredSet = new Deferred();
      this.deferredSet = deferredSet;
    }
    */

    this.setCachedValue(value);

    const [hwValue, logData] = this.setHwFromValue(value);
    console.log('setValue property:', this.name,
                'for:', this.device.name,
                'hw:', logData,
                'value:', value);

    this.device.setValue(value);

    // We don't rely on the device to tell us that the value changed,
    // so we resolve the promise right away.
    //return deferredSet.promise;
    return Promise.resolve();
  }
}

module.exports = Egw1Property;
