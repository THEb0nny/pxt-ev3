# on Event

Run some code when the NXT touch sensor is pressed, released, or bumped.

```sig
sensors.nxtTouch1.onEvent(ButtonEvent.Pressed, function () {
})
```

## Parameters

* **ev**: the touch sensor action to wait for. The actions are: `pressed`, `released`, or `bumped`.
* **body**: the code to run when the action happens.

## Example

Show a `green` status light when the NXT touch sensor is pressed.

```blocks
sensors.nxtTouch1.onEvent(ButtonEvent.Pressed, function () {
    brick.setStatusLight(StatusLight.Green)
})
```

## See also

[pause until](/reference/sensors/nxt-touch-sensor/pause-until)