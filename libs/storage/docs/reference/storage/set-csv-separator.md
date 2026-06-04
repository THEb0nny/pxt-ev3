# Set CSV separator

Sets the separator character used for CSV files.

Different spreadsheet applications and regional settings may require different separators.

By default, a comma is used.

## Example

```blocks
storage.setCSVSeparator(CSVSeparator.Semicolon)
```

## Parameters

### sep

The CSV separator type.

Available values:

* `CSVSeparator.Comma`
* `CSVSeparator.Semicolon`

## Notes

* The separator affects:

  * `append CSV`
  * `append CSV headers`
  * `read CSV row`
  * `read CSV cell`
* Many European regional settings use semicolons instead of commas.