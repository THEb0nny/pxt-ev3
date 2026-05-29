# File limit

Limits the maximum file size.

## Example

```blocks
storage.internal.limit("log.txt", 1024)
```

## Notes

* The limit is specified in bytes.
* Writing more data than the limit may truncate the file or prevent additional writes depending on implementation.