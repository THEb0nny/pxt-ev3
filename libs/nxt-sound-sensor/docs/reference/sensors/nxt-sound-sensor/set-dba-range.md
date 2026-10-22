# set dBA range

Set the raw sensor values that correspond to `0%` (silence) and `100%` (loud) in dBA mode.

```sig
sensors.nxtSound1.setDbARange(4095, 0)
```

Use this function to calibrate the dBA (human hearing sensitivity profile) measurement for your environment. Raw sensor readings will be mapped to the normalized range of `0` to `100`.

The **silent** value should be greater than the **loud** value. If `silent` is less than or equal to `loud`, the range is not changed.

## Parameters

* **silent**: the raw sensor value that represents silence (default is `4095`).
* **loud**: the raw sensor value that represents the loudest sound (default is `0`).

## Example

Calibrate the dBA sound range and display the normalized sound level.

```blocks
sensors.nxtSound1.setDbARange(3800, 600)

forever(function () {
    brick.clearScreen()
    brick.printValue("dBA Level", sensors.nxtSound1.soundLevel(NXTSoundSensorMode.DbA), 1)
    pause(100)
})
```

## See Also

[set dB range](/reference/sensors/nxt-sound-sensor/set-db-range),
[sound level](/reference/sensors/nxt-sound-sensor/sound-level),
[sound level (raw)](/reference/sensors/nxt-sound-sensor/sound-level-raw)
