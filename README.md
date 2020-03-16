# mozilla-iot-lumencache
LumenCache LibRE EGW1 add-on for Mozilla-IoT

LumenCache is a DC power and control infrastructure for new construction.
Information on the LumenCache LibRE hardware and command protocol is available at 
http://lumencache.com/learn

The L2-EGW1 is an ethernet gateway based on the Raspberry Pi3 B+ with a hardware hat for:
  1. power
  2. RS485 transciever attached to /dev/ttyAMA0 with automatic enable control
  3. Green LED, GPIO pin 13
  4. Red LED, GPIO pin 26
  5. Yellow LED, GPIO pin 19
  6. Pushbutton, GPIO 6
  7. i2c A/D for PDM supply power voltage TI TLA2021

The add-on performs the following:
  1. Automatic detection of communicating devices: L2-DM, L2-CH16, L2-ENCFAN2.
  2. Assigning a unique bus ID to each device.  IDs are 0..239.
  3. Collecting EEPROM parameters from the L2-DM, L2-CH16, and L2-ENCFAN2 devices.
  4. Create and manage list of Web Things and their attributes.
  5. Monitor output attribute messages or poll all devices to update Mozilla-IoT adapter attributes.
 
If the connector uses redis to buffer the values we can allow additional services to interface with
the RS485 bus and ensure traffic is managed by the connector.

The protocol link above also recommends polling and collection techniques.
