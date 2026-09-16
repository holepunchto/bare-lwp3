const test = require('brittle')
const lwp3 = require('.')

function bytes(message) {
  return Array.from(message)
}

test('startSpeed', (t) => {
  t.alike(
    bytes(lwp3.startSpeed(lwp3.PORT_A, 50)),
    [0x09, 0x00, 0x81, 0x00, 0x11, 0x07, 0x32, 0x64, 0x00]
  )
  t.alike(
    bytes(lwp3.startSpeed(lwp3.PORT_B, -50)),
    [0x09, 0x00, 0x81, 0x01, 0x11, 0x07, 0xce, 0x64, 0x00]
  )
})

test('startPower', (t) => {
  t.alike(bytes(lwp3.startPower(lwp3.PORT_D, 30)), [0x08, 0x00, 0x81, 0x03, 0x11, 0x51, 0x00, 0x1e])
  t.alike(
    bytes(lwp3.startPower(lwp3.PORT_D, -30)),
    [0x08, 0x00, 0x81, 0x03, 0x11, 0x51, 0x00, 0xe2]
  )
  t.alike(bytes(lwp3.startPower(lwp3.PORT_D, 0)), [0x08, 0x00, 0x81, 0x03, 0x11, 0x51, 0x00, 0x00])
})

test('brake', (t) => {
  t.alike(bytes(lwp3.brake(lwp3.PORT_A)), [0x08, 0x00, 0x81, 0x00, 0x11, 0x51, 0x00, 0x7f])
})

test('gotoAbsolutePosition', (t) => {
  t.alike(
    bytes(lwp3.gotoAbsolutePosition(lwp3.PORT_D, 100, 40)),
    [0x0e, 0x00, 0x81, 0x03, 0x11, 0x0d, 0x64, 0x00, 0x00, 0x00, 0x28, 0x64, 0x7e, 0x00]
  )
  t.alike(
    bytes(lwp3.gotoAbsolutePosition(lwp3.PORT_D, -300, 40)),
    [0x0e, 0x00, 0x81, 0x03, 0x11, 0x0d, 0xd4, 0xfe, 0xff, 0xff, 0x28, 0x64, 0x7e, 0x00]
  )
})

test('subscribePosition', (t) => {
  t.alike(
    bytes(lwp3.subscribePosition(lwp3.PORT_D)),
    [0x0a, 0x00, 0x41, 0x03, 0x02, 0x01, 0x00, 0x00, 0x00, 0x01]
  )
})

test('requestBattery', (t) => {
  t.alike(bytes(lwp3.requestBattery()), [0x05, 0x00, 0x01, 0x06, 0x05])
})

test('led', (t) => {
  t.alike(bytes(lwp3.led(lwp3.LED_GREEN)), [0x08, 0x00, 0x81, 0x32, 0x11, 0x51, 0x00, 0x06])
})

test('switchOff', (t) => {
  t.alike(bytes(lwp3.switchOff()), [0x04, 0x00, 0x02, 0x01])
})

test('decode battery', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x06, 0x00, 0x01, 0x06, 0x06, 0x55])), {
    type: 'battery',
    level: 85
  })
})

test('decode other hub property', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x06, 0x00, 0x01, 0x01, 0x06, 0x00])), {
    type: 'hubProperty',
    property: 0x01
  })
})

test('decode attached io', (t) => {
  t.alike(
    lwp3.decode(
      Uint8Array.from([0x0f, 0x00, 0x04, 0x00, 0x01, 0x2e, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00])
    ),
    { type: 'attachedIo', port: lwp3.PORT_A, event: 0x01, ioType: 46 }
  )
})

test('decode detached io', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x05, 0x00, 0x04, 0x01, 0x00])), {
    type: 'attachedIo',
    port: lwp3.PORT_B,
    event: 0x00,
    ioType: 0
  })
})

test('decode port value', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x08, 0x00, 0x45, 0x03, 0xd4, 0xfe, 0xff, 0xff])), {
    type: 'portValue',
    port: lwp3.PORT_D,
    value: -300
  })
})

test('decode short port value', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x05, 0x00, 0x45, 0x03, 0x07])), {
    type: 'portValue',
    port: lwp3.PORT_D,
    value: 7
  })
})

test('decode feedback', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x05, 0x00, 0x82, 0x00, 0x0a])), {
    type: 'feedback',
    port: lwp3.PORT_A,
    status: 0x0a
  })
})

test('decode error', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x05, 0x00, 0x05, 0x81, 0x05])), {
    type: 'error',
    command: 0x81,
    code: 0x05,
    reason: 'notRecognized'
  })
})

test('decode error unknown code', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x05, 0x00, 0x05, 0x81, 0x99])), {
    type: 'error',
    command: 0x81,
    code: 0x99,
    reason: 'unknown'
  })
})

test('decode unknown', (t) => {
  t.alike(lwp3.decode(Uint8Array.from([0x03, 0x00, 0x99])), { type: 'unknown', id: 0x99 })
})

test('decode offset view', (t) => {
  const framed = Uint8Array.from([0xff, 0xff, 0x08, 0x00, 0x45, 0x03, 0x64, 0x00, 0x00, 0x00])
  const message = framed.subarray(2)
  t.alike(lwp3.decode(message), { type: 'portValue', port: lwp3.PORT_D, value: 100 })
})
