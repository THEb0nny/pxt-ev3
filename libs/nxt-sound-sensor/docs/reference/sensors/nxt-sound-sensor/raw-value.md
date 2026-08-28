# raw value

Gets the raw 12-bit ADC value from the NXT sound sensor. 

```sig
sensors.nxtSound1.rawValue(NXTSoundSensorMode.Db)
```

This block is useful for advanced calibration and filtering where the mapped `0-100%` scale lacks precision. 
**Note:** The raw ADC scale is inverted. A value of `4095` represents complete silence, and `0` represents the maximum measurable volume.

## Parameters

* **mode**: the hardware filter mode to use (`dB` for all frequencies, `dBA` for human hearing profile).

## Returns

* a [number](types/number) between `0` (very loud) and `4095` (silence).

## Example

Continuously read the raw unweighted sound data (`dB`) and display it on the EV3 brick screen for custom threshold calibration.

```blocks
forever(function () {
    let raw = sensors.nxtSound1.rawValue(NXTSoundSensorMode.Db)
    brick.printValue("Raw Audio:", raw, 1)
})
```

## See Also

[sound level](/reference/sensors/nxt-sound-sensor/sound-level)