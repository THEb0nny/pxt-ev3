# CSV row count

Returns the number of rows in a CSV file.

The first row is usually the header row and is included in the count.

## Example

```blocks
let rows = storage.permanent.csvRowCount("data.csv")
brick.printNumber(rows, 1)
```

## See also

[append CSV](/reference/storage/append-csv),
[read CSV row](/reference/storage/read-csv-row),
[read CSV cell](/reference/storage/read-csv-cell)