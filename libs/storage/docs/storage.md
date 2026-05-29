# docs/storage.md

# Storage

The Storage extension allows reading and writing files on the EV3 brick.

It supports:

* Temporary storage (`/tmp`)
* Internal storage (brick memory)
* External storage (SD card)
* Text files
* CSV files

## Storage locations

| Type      | Description                                                     |
| --------- | --------------------------------------------------------------- |
| Temporary | Files stored in temporary memory. Usually removed after reboot. |
| Internal  | Files stored in the internal EV3 memory.                        |
| External  | Files stored on the SD card.                                    |

## Notes

* `.rtf` files are visible in the EV3 file browser.
* `.csv` files are usually hidden in the EV3 file browser.
* Simulator support is limited.

## Simulator support

Some file operations may behave differently in the simulator.

### Notes

* Simulator file access is not identical to the EV3 brick.
* Some APIs may use simulator stubs.
* Large files may not behave correctly.

### Recommendation

Always test important storage code on a real EV3 brick.

## See also

* [Text files](storage/text-files)
* [CSV files](storage/csv-files)