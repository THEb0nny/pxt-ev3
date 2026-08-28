# sound level

Gets the current sound level measured by the NXT sound sensor as a percentage.

```sig
sensors.nxtSound1.soundLevel(NXTSoundSensorMode.DbA)
```

## Parameters

* **mode**: the measurement mode to use. 
  * `dB`: Unweighted sound pressure level. Measures raw volume across all frequencies (including mechanical noise).
  * `dBA`: A-weighted sound level. Filters frequencies to match human ear sensitivity (best for detecting voice or claps).

## Returns

* a [number](types/number) between `0` (absolute silence) and `100` (very loud).

## Example

Wait for a loud sound (like a clap) in `dBA` mode to show a smile on the EV3 screen.

```blocks
forever(function () {
    if (sensors.nxtSound1.soundLevel(NXTSoundSensorMode.DbA) > 50) {
        brick.showImage(images.expressionsBigSmile)
    } else {
        brick.clearScreen()
    }
})
```

## See Also

[raw value](/reference/sensors/nxt-sound-sensor/raw-value)