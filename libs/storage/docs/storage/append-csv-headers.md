# Append CSV headers

Appends a row of CSV column headers to a file.

## Example

```blocks
storage.internal.appendCSVHeaders("data.csv", ["Name", "Score"])
```

## Parameters

### filename

The CSV file name.

Example:

```typescript
"data.csv"
```

### headers

Array of header names to append.

## Notes

* CSV values are separated using the currently selected CSV separator.
* Use `set CSV separator` to change the separator.
* `.csv` files are usually hidden in the EV3 file browser.