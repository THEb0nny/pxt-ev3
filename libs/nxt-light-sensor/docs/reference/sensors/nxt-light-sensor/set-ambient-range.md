# set ambient light range

Set the raw sensor values that correspond to `0%` (dark) and `100%` (bright) in ambient light mode.

```sig
sensors.nxtLight1.setAmbientLightRange(3411, 633)
```

Use this function to calibrate the ambient light measurement for your environment. Raw sensor readings will be mapped to the normalized range of `0` to `100`.

The **dark** value should be greater than the **bright** value. If `dark` is less than or equal to `bright`, the range is not changed.

## Parameters

* **dark**: the raw sensor value that represents complete darkness.
* **bright**: the raw sensor value that represents the brightest ambient light.

## Example

Calibrate the ambient light range and display the normalized ambient light value.

```blocks
sensors.nxtLight1.setAmbientLightRange(3411, 633)

forever(function () {
    brick.clearScreen()
    brick.printValue("Ambient", sensors.nxtLight1.light(NXTLightIntensityMode.Ambient), 1, 1)
    pause(100)
})
```