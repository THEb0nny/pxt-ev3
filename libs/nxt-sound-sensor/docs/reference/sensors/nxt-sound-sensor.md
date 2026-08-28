# NXT Sound Sensor

The NXT Sound Sensor measures the volume of sound in its environment. It is a legacy analog sensor that can detect anything from a quiet whisper to a loud shout. 

The sensor can measure sound using two different hardware profiles:
* **dB (Unweighted):** Measures the raw sound pressure level across all frequencies. This is useful for detecting mechanical noises, motors, or general environmental volume.
* **dBA (A-weighted):** Filters the incoming sound to mimic the sensitivity of the human ear. It dampens very high and very low frequencies, making it perfect for detecting claps, speech, and music.

```cards
sensors.nxtSound1.soundLevel(NXTSoundSensorMode.DbA)
sensors.nxtSound1.rawValue(NXTSoundSensorMode.DbA)
```

## See Also

[sound level](/reference/sensors/nxt-sound-sensor/sound-level),
[raw value](/reference/sensors/nxt-sound-sensor/raw-value)