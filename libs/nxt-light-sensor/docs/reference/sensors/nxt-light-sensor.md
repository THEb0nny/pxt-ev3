# NXT Light Sensor

The NXT Light Sensor measures the intensity of light. It is a legacy analog sensor that can detect either ambient light from the surroundings or reflected light from surfaces.

The sensor operates in two primary modes:
* **Reflected light:** Turns on the sensor's built-in red LED to illuminate a surface and measures the amount of light reflected back. Useful for line following and surface contrast detection.
* **Ambient light:** Turns off the built-in LED and measures the surrounding environmental light level. Useful for detecting changes in room illumination or ambient brightness.

```cards
sensors.nxtLight1.light(NXTLightIntensityMode.Reflected)
sensors.nxtLight1.light(NXTLightIntensityMode.Ambient)
```

## See Also

[light](/reference/sensors/nxt-light-sensor/light),
[set reflected range](/reference/sensors/nxt-light-sensor/set-reflected-range),
[set ambient range](/reference/sensors/nxt-light-sensor/set-ambient-range)
