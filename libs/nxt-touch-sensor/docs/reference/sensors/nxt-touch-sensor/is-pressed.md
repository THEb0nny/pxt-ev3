# is Pressed

Check to see if a NXT touch sensor is currently pressed or not.

```sig
sensors.nxtTouch1.isPressed()
```
## Returns

* a [boolean](/types/boolean) value that is `true` if the sensor is currently pressed. It's `false` if the sensor is not pressed.

## Example

If the NXT touch sensor ``NXT touch 1`` is pressed, show a `green` status light. Otherwise, set the status light to `orange`.

```blocks
forever(function () {
    if (sensors.nxtTouch1.isPressed()) {
        brick.setStatusLight(StatusLight.Green)
    } else {
        brick.setStatusLight(StatusLight.Orange)
    }
})
```

## See also

[was pressed](/reference/sensors/nxt-touch-sensor/was-pressed), [on event](/reference/sensors/nxt-touch-sensor/on-event)