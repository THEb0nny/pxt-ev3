# Read file

Reads text from a file.

## Example

```blocks
let text = storage.internal.read("log.rtf")
```

## Notes

* Returns the file contents as text.
* Empty string may be returned if the file does not exist.