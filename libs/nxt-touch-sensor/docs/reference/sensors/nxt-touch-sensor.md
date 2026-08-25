# NXT Touch Sensor

The NXT touch sensor is an analog sensor that detects when its front button is pressed or released. It can be used to make your robot feel its surroundings or act as a button to start a program.

```cards
sensors.nxtTouch1.isPressed()
sensors.nxtTouch1.wasPressed()
sensors.nxtTouch1.onEvent(ButtonEvent.Pressed, function () {})
sensors.nxtTouch1.pauseUntil(ButtonEvent.Pressed)
```

## See Also

[is pressed](/reference/sensors/nxt-touch-sensor/is-pressed),
[was pressed](/reference/sensors/nxt-touch-sensor/was-pressed),
[on event](/reference/sensors/nxt-touch-sensor/on-event),
[pause until](/reference/sensors/nxt-touch-sensor/pause-until)