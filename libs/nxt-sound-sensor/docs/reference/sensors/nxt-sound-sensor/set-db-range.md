# set dB range

Set the raw sensor values that correspond to `0%` (silence) and `100%` (loud) in dB mode.

```sig
sensors.nxtSound1.setDbRange(4095, 0)
```

Use this function to calibrate the dB (unweighted sound pressure) measurement for your environment. Raw sensor readings will be mapped to the normalized range of `0` to `100`.

The **silent** value should be greater than the **loud** value. If `silent` is less than or equal to `loud`, the range is not changed.

## Parameters

* **silent**: the raw sensor value that represents silence (default is `4095`).
* **loud**: the raw sensor value that represents the loudest sound (default is `0`).

## Example

Calibrate the dB sound range and display the normalized sound level.

```blocks
sensors.nxtSound1.setDbRange(3500, 500)

forever(function () {
    brick.clearScreen()
    brick.printValue("dB Level", sensors.nxtSound1.soundLevel(NXTSoundSensorMode.Db), 1)
    pause(100)
})
```

## See Also

[set dBA range](/reference/sensors/nxt-sound-sensor/set-dba-range),
[sound level](/reference/sensors/nxt-sound-sensor/sound-level),
[sound level (raw)](/reference/sensors/nxt-sound-sensor/sound-level-raw)
