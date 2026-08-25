# was Pressed

Check to see if the NXT touch sensor was pressed since the last time it was checked.

```sig
sensors.nxtTouch1.wasPressed()
```

## Returns

* a [boolean](/types/boolean) value that is `true` if the sensor was pressed before. It is `false` if the sensor was not pressed.

## Example

Check if the NXT touch sensor was pressed. If so, show a message on the screen.

```blocks
forever(function () {
    if (sensors.nxtTouch1.wasPressed()) {
        brick.showString("Pressed!", 1)
    }
})
```

## See also

[is pressed](/reference/sensors/nxt-touch-sensor/is-pressed)