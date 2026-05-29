# CSV files

CSV files store values separated by commas or semicolons.

## Writing rows

```blocks
storage.internal.writeCSVRow("scores.csv", "Alex,10")
```

## Reading rows

```blocks
let row = storage.internal.readCSVRow("scores.csv", 0)
```

## Reading cells

```blocks
let value = storage.internal.readCSVCell("scores.csv", 0, 1)
```

## Example

```blocks
storage.internal.writeCSVRow("data.csv", "Name,Score")
storage.internal.writeCSVRow("data.csv", "Robot,100")

let score = storage.internal.readCSVCell("data.csv", 1, 1)
```

## Notes

* CSV files are plain text.
* `.csv` files are usually hidden in the EV3 file browser.
* Different separators may be supported depending on the API.