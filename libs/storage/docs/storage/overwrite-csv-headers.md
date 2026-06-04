# Overwrite CSV headers

Overwrites a CSV file and writes a new header row.

All existing contents of the file are removed before the headers are written.

## Example

```blocks
storage.internal.overwriteCSVHeaders("data.csv", ["Time", "Distance", "Speed"])
```

## See also

[append CSV headers](/reference/storage/append-csv-headers),
[append CSV](/reference/storage/append-csv)