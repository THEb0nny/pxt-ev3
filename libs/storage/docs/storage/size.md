# File size

Returns the file size in bytes.

## Example

```blocks
let bytes = storage.internal.size("log.txt")
```

## Notes

* Returns the file size in bytes.
* Returns `0` if the file does not exist.