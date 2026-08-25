# pause Until

Wait until the NXT touch sensor is pressed, released, or bumped.

```sig
sensors.nxtTouch1.pauseUntil(ButtonEvent.Pressed)
```

## Parameters

* **ev**: the touch sensor action to wait for. The actions are: `pressed`, `released`, or `bumped`.

## Example

Wait for the NXT touch sensor to be pressed and then show a `green` status light.

```blocks
sensors.nxtTouch1.pauseUntil(ButtonEvent.Pressed)
brick.setStatusLight(StatusLight.Green)
```

## See also

[on event](/reference/sensors/nxt-touch-sensor/on-event)