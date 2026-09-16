> [!IMPORTANT]
> This module is experimental. The API is subject to change and may break at any time.

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

Encoders return a `Uint8Array` ready to write to the LWP3 characteristic. Ports are `PORT_A` to `PORT_D`.

#### `const message = startSpeed(port, speed)`

Run a motor at a regulated speed, `-100` to `100`.

#### `const message = startPower(port, power)`

Drive a motor with raw PWM power, `-100` to `100`. `0` lets the motor float.

#### `const message = brake(port)`

Actively brake a motor.

#### `const message = startSpeedForTime(port, ms, speed)`

Run at a regulated speed for `ms` milliseconds, then brake. The hub handles the timing.

#### `const message = startSpeedForDegrees(port, degrees, speed)`

Turn `degrees` in the direction of `speed`, then brake.

#### `const message = gotoAbsolutePosition(port, position, speed)`

Turn a motor to an angle in degrees and hold.

#### `const message = connectVirtualPort(portA, portB)`

Pair two motors into one virtual port. The hub replies with `attachedIo` (`event` 2) carrying the new port id.

#### `const message = disconnectVirtualPort(port)`

Split a virtual port back into its two motors.

#### `const message = startSpeeds(port, speedA, speedB)`

Run the two motors of a virtual port, synchronized by the hub.

#### `const message = subscribe(port, mode)`

Ask the hub to report a sensor mode on every change. Motor modes are `MODE_SPEED`, `MODE_POSITION` and `MODE_ABSOLUTE_POSITION`.

#### `const message = unsubscribe(port, mode)`

Stop the reports for a mode.

#### `const message = requestBattery()`

Ask for the battery level once.

#### `const message = subscribeBattery()`

Ask the hub to report the battery level on every change.

#### `const message = unsubscribeBattery()`

Stop the battery reports.

#### `const message = led(port, color)`

Set a hub LED (`LED_OFF`, `LED_PINK`, `LED_PURPLE`, `LED_BLUE`, `LED_LIGHT_BLUE`, `LED_CYAN`, `LED_GREEN`, `LED_YELLOW`, `LED_ORANGE`, `LED_RED`, `LED_WHITE`). `LED_PORT` is the built-in LED of the Technic hub; other hubs report theirs via `attachedIo`.

#### `const message = switchOff()`

Power the hub down.

#### `const notification = decode(bytes)`

Turn a hub notification into one of:

- `{ type: 'battery', level }` - percentage
- `{ type: 'attachedIo', port, event, ioType }` - device plugged (`event` 1) or unplugged (0); virtual port formed (`event` 2) adds `ports`, the two members
- `{ type: 'portValue', port, value }` - subscribed sensor value, e.g. motor position
- `{ type: 'feedback', port, status }` - command progress report
- `{ type: 'error', command, code, reason }` - hub rejected `command`; `code` is the raw byte, `reason` names it (`'notRecognized'`, `'invalidUse'`, `'overcurrent'`, ..., `'unknown'`)
- `{ type: 'hubProperty', property }` / `{ type: 'unknown', id }` - anything not decoded yet

Tested on the LEGO(R) Technic hub (88012); the LEGO Group publishes the protocol under the MIT license at [lego.github.io/lego-ble-wireless-protocol-docs](https://lego.github.io/lego-ble-wireless-protocol-docs/). See [bare-lwp3-demo](https://github.com/tony-go/bare-lwp3-demo) for a complete example.

## License

Apache-2.0

LEGO(R) is a trademark of the LEGO Group of companies which does not sponsor, authorize or endorse this project.
