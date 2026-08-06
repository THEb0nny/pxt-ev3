# light

Get the amount of ambient or reflected light measured by the sensor.

```sig
sensors.nxtLight1.light(NXTLightIntensityMode.Reflected)
```

The light sensor can measure either **ambient** light (light from the surrounding environment) or **reflected** light (light reflected from a surface illuminated by the sensor's built-in LED).

For each measurement type, you can choose between:

* **Normalized** mode, which returns a value from `0` (darkest) to `100` (brightest). The normalization range can be adjusted using the sensor calibration methods.
* **Raw** mode, which returns the unprocessed analog sensor reading in the range of approximately `0` to `4095`.

## Parameters

* **mode**: the light measurement mode. This can be one of:
    * ``Reflected`` – normalized reflected light (`0`–`100`)
    * ``ReflectedRaw`` – raw reflected light (`0`–`4095`)
    * ``Ambient`` – normalized ambient light (`0`–`100`)
    * ``AmbientRaw`` – raw ambient light (`0`–`4095`)

## Returns

* a number representing the measured light intensity. The returned range depends on the selected mode.

## Example

Make the status light show ``green`` if the reflected light intensity is greater than `20`.

```blocks
forever(function () {
    if (sensors.nxtLight1.light(NXTLightIntensityMode.Reflected) > 20) {
        brick.setStatusLight(StatusLight.Green)
    } else {
        brick.setStatusLight(StatusLight.Orange)
    }
})
```