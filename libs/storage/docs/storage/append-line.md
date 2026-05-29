# Append line

Appends a line of text to a file.

A new line (`\\r\\n`) is automatically added after the text.

## Example

```blocks
storage.internal.appendLine("log.rtf", "Started")
```

## Parameters

### filename

The file name to append data to.

Example:

```typescript
"log.rtf"
```

### data

The text line to append.

## Notes

* The file is automatically created if it does not exist.
* `.rtf` files are visible in the EV3 file browser.
* Relative paths can be used to store files inside folders.
