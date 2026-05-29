# Append file

Adds text to the end of a file.

## Example

```blocks
storage.internal.append("log.rtf", "New line")
```

## Notes

* The file is created automatically if it does not exist.
* Existing contents are preserved.