# set reflected light range

Set the raw sensor values that correspond to `0%` (dark) and `100%` (bright) in reflected light mode.

```sig
sensors.nxtLight1.setReflectedLightRange(3372, 445)
```

Use this function to calibrate the reflected light measurement for the surface being detected. Raw sensor readings will be mapped to the normalized range of `0` to `100`.

The **dark** value should be greater than the **bright** value. If `dark` is less than or equal to `bright`, the range is not changed.

## Parameters

* **dark**: the raw sensor value that represents the darkest reflected light.
* **bright**: the raw sensor value that represents the brightest reflected light.

## Example

Calibrate the reflected light range and display the normalized reflected light value.

```blocks
sensors.nxtLight1.setReflectedLightRange(3372, 445)

forever(function () {
    brick.clearScreen()
    brick.printValue("Reflected", sensors.nxtLight1.light(NXTLightIntensityMode.Reflected), 1, 1)
    pause(100)
})
```