# Read CSV row

Reads a row from a CSV file.
Before reading a CSV file, configure the separator that was used when the file was created.

## Example

```blocks
let row = storage.internal.readCSVRow("scores.csv", 0)
```