# CSV files

CSV (Comma-Separated Values) files store tabular data as plain text. Values are separated by commas or semicolons.

Use CSV files to save measurements, logs, sensor readings, or other data that can later be opened in spreadsheet applications.

## Writing headers

```blocks
storage.internal.appendCSVHeaders("scores.csv", ["Name", "Score"])
```

## Creating a CSV file

```blocks
storage.internal.overwriteCSVHeaders("scores.csv", ["Name", "Score"])
```

## Writing rows

```blocks
storage.internal.appendCSV("scores.csv", [10, 20, 30])
```

## Reading rows

```blocks
let row = storage.internal.readCSVRow("scores.csv", 0)
```

## Reading cells

```blocks
let value = storage.internal.readCSVCell("scores.csv", 0, 1)
```

## Counting rows

```blocks
let rows = storage.internal.csvRowCount("scores.csv")
```

## Example

```blocks
storage.setCSVSeparator(CSVSeparator.Comma)

storage.internal.overwriteCSVHeaders( "data.csv", ["Time", "Distance"])

storage.internal.appendCSVHeaders("data.csv", ["Time", "Distance"])

storage.internal.appendCSV("data.csv", [1, 100])

let distance = storage.internal.readCSVCell("data.csv", 1, 1)
```

## Notes

* CSV files are stored as plain text.
* Creating a CSV file with Overwrite CSV headers removes any existing contents.
* The first row often contains column headers.
* Spreadsheet applications may use either commas or semicolons as separators depending on regional settings.
* Use **Set CSV separator** to select the separator used when reading and writing CSV files.
* CSV files may not be visible in the EV3 file browser.