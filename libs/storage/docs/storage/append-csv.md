# Append CSV

Appends a row of numeric CSV data to a file.

## Example

```blocks
storage.internal.appendCSV("data.csv", [10, 20, 30])
```

## Parameters

### filename

The CSV file name.

Example:

```typescript
"data.csv"
```

### data

Array of numeric values to append.

## Notes

* CSV values are separated using the currently selected CSV separator.
* Use `set CSV separator` to change the separator.
* `.csv` files are usually hidden in the EV3 file browser.
