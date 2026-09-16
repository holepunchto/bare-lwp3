exports.SERVICE_UUID = '00001623-1212-efde-1623-785feabcd123'
exports.CHARACTERISTIC_UUID = '00001624-1212-efde-1623-785feabcd123'

exports.PORT_A = 0x00
exports.PORT_B = 0x01
exports.PORT_C = 0x02
exports.PORT_D = 0x03

exports.MODE_SPEED = 0x01
exports.MODE_POSITION = 0x02
exports.MODE_ABSOLUTE_POSITION = 0x03

exports.LED_OFF = 0x00
exports.LED_PINK = 0x01
exports.LED_PURPLE = 0x02
exports.LED_BLUE = 0x03
exports.LED_LIGHT_BLUE = 0x04
exports.LED_CYAN = 0x05
exports.LED_GREEN = 0x06
exports.LED_YELLOW = 0x07
exports.LED_ORANGE = 0x08
exports.LED_RED = 0x09
exports.LED_WHITE = 0x0a

exports.startSpeed = function startSpeed(port, speed) {
  return Uint8Array.from([0x09, 0x00, 0x81, port, 0x11, 0x07, speed & 0xff, 0x64, 0x00])
}

exports.startPower = function startPower(port, power) {
  return Uint8Array.from([0x08, 0x00, 0x81, port, 0x11, 0x51, 0x00, power & 0xff])
}

exports.brake = function brake(port) {
  return exports.startPower(port, 0x7f)
}

exports.startSpeedForTime = function startSpeedForTime(port, ms, speed) {
  return Uint8Array.from([
    0x0c,
    0x00,
    0x81,
    port,
    0x11,
    0x09,
    ms & 0xff,
    (ms >> 8) & 0xff,
    speed & 0xff,
    0x64,
    0x7f,
    0x00
  ])
}

exports.startSpeedForDegrees = function startSpeedForDegrees(port, degrees, speed) {
  const message = Uint8Array.from([
    0x0e,
    0x00,
    0x81,
    port,
    0x11,
    0x0b,
    0x00,
    0x00,
    0x00,
    0x00,
    speed & 0xff,
    0x64,
    0x7f,
    0x00
  ])
  new DataView(message.buffer).setUint32(6, degrees, true)
  return message
}

exports.gotoAbsolutePosition = function gotoAbsolutePosition(port, position, speed) {
  const message = Uint8Array.from([
    0x0e,
    0x00,
    0x81,
    port,
    0x11,
    0x0d,
    0x00,
    0x00,
    0x00,
    0x00,
    speed,
    0x64,
    0x7e,
    0x00
  ])
  new DataView(message.buffer).setInt32(6, position, true)
  return message
}

exports.connectVirtualPort = function connectVirtualPort(portA, portB) {
  return Uint8Array.from([0x06, 0x00, 0x61, 0x01, portA, portB])
}

exports.disconnectVirtualPort = function disconnectVirtualPort(port) {
  return Uint8Array.from([0x05, 0x00, 0x61, 0x00, port])
}

exports.startSpeeds = function startSpeeds(port, speedA, speedB) {
  return Uint8Array.from([
    0x0a,
    0x00,
    0x81,
    port,
    0x11,
    0x08,
    speedA & 0xff,
    speedB & 0xff,
    0x64,
    0x00
  ])
}

exports.subscribe = function subscribe(port, mode) {
  return Uint8Array.from([0x0a, 0x00, 0x41, port, mode, 0x01, 0x00, 0x00, 0x00, 0x01])
}

exports.unsubscribe = function unsubscribe(port, mode) {
  return Uint8Array.from([0x0a, 0x00, 0x41, port, mode, 0x01, 0x00, 0x00, 0x00, 0x00])
}

exports.requestBattery = function requestBattery() {
  return Uint8Array.from([0x05, 0x00, 0x01, 0x06, 0x05])
}

exports.led = function led(color) {
  return Uint8Array.from([0x08, 0x00, 0x81, 0x32, 0x11, 0x51, 0x00, color])
}

exports.switchOff = function switchOff() {
  return Uint8Array.from([0x04, 0x00, 0x02, 0x01])
}

const types = {
  HUB_PROPERTY: 0x01,
  ATTACHED_IO: 0x04,
  ERROR: 0x05,
  PORT_VALUE: 0x45,
  FEEDBACK: 0x82
}

const ioEvents = {
  DETACHED: 0x00,
  ATTACHED: 0x01,
  ATTACHED_VIRTUAL: 0x02
}

const errorCodes = {
  0x01: 'ack',
  0x02: 'mack',
  0x03: 'bufferOverflow',
  0x04: 'timeout',
  0x05: 'notRecognized',
  0x06: 'invalidUse',
  0x07: 'overcurrent',
  0x08: 'internalError'
}

exports.decode = function decode(message) {
  const view = new DataView(message.buffer, message.byteOffset, message.byteLength)
  switch (message[2]) {
    case types.HUB_PROPERTY:
      return message[3] === 0x06
        ? { type: 'battery', level: message[5] }
        : { type: 'hubProperty', property: message[3] }
    case types.ERROR:
      return {
        type: 'error',
        command: message[3],
        code: message[4],
        reason: errorCodes[message[4]] ?? 'unknown'
      }
    case types.ATTACHED_IO: {
      const io = {
        type: 'attachedIo',
        port: message[3],
        event: message[4],
        ioType: message[4] === ioEvents.DETACHED ? 0 : message[5] | (message[6] << 8)
      }
      if (message[4] === ioEvents.ATTACHED_VIRTUAL) io.ports = [message[7], message[8]]
      return io
    }
    case types.PORT_VALUE:
      return {
        type: 'portValue',
        port: message[3],
        value:
          message.byteLength >= 8
            ? view.getInt32(4, true)
            : message.byteLength >= 6
              ? view.getInt16(4, true)
              : view.getInt8(4)
      }
    case types.FEEDBACK:
      return { type: 'feedback', port: message[3], status: message[4] }
    default:
      return { type: 'unknown', id: message[2] }
  }
}
