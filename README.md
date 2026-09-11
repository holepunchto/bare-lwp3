# bare-lwp3

LEGO Wireless Protocol 3 (Powered Up) codec. Pure functions: commands in, bytes out; hub notification bytes in, plain objects out. No Bluetooth inside - bring your own transport, for example [bare-bluetooth](https://github.com/holepunchto/bare-bluetooth).

```
npm i bare-lwp3
```

## Usage

```js
const lwp3 = require('bare-lwp3')

peripheral.write(characteristic, lwp3.startSpeed(lwp3.PORT_A, 50), false)

peripheral.on('notify', (c, data) => {
  console.log(lwp3.decode(data))
})
```

Scan for `lwp3.SERVICE_UUID` and write every message to `lwp3.CHARACTERISTIC_UUID` without response.

## API

Encoders return a `Uint8Array` ready to write to the LWP3 characteristic.

- `startSpeed(port, speed)` - run a motor at a regulated speed, -100 to 100
- `startPower(port, power)` - raw PWM power, -100 to 100, 0 floats
- `brake(port)` - actively brake a motor
- `gotoAbsolutePosition(port, position, speed)` - turn a motor to an angle in degrees and hold
- `subscribePosition(port)` - ask the hub to report the motor position on every change
- `requestBattery()` - ask for the battery level
- `led(color)` - set the hub LED (`LED_OFF`, `LED_PINK`, `LED_PURPLE`, `LED_BLUE`, `LED_LIGHT_BLUE`, `LED_CYAN`, `LED_GREEN`, `LED_YELLOW`, `LED_ORANGE`, `LED_RED`, `LED_WHITE`)
- `switchOff()` - power the hub down

`decode(bytes)` turns a hub notification into one of:

- `{ type: 'battery', level }` - percentage
- `{ type: 'attachedIo', port, event, ioType }` - device plugged (`event` 1) or unplugged (0)
- `{ type: 'portValue', port, value }` - subscribed sensor value, e.g. motor position
- `{ type: 'feedback', port, status }` - command progress report
- `{ type: 'hubProperty', property }` / `{ type: 'unknown', id }` - anything not decoded yet

Ports are `PORT_A` to `PORT_D`. Tested on the LEGO(R) Technic hub (88012); the LEGO Group publishes the protocol under the MIT license at [lego.github.io/lego-ble-wireless-protocol-docs](https://lego.github.io/lego-ble-wireless-protocol-docs/). See [bare-lwp3-demo](https://github.com/tony-go/bare-lwp3-demo) for a complete example.

## License

Apache-2.0

LEGO(R) is a trademark of the LEGO Group of companies which does not sponsor, authorize or endorse this project.
