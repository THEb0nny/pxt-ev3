# File limit

Limits the growth of a file.

If the file size exceeds the specified limit, the oldest half of the file is removed and only the newest half is kept.

This is useful for log files that continuously grow over time.

## Example

```blocks
storage.internal.limit("log.txt", 1024)
```

## Parameters

### filename

The file name.

### size

Maximum file size in bytes.

## Notes

* The limit is specified in bytes.
* The file is not resized exactly to the specified limit.
* When the file size exceeds the limit, the oldest half of the file is discarded.
* This behavior is useful for rotating log files while preserving the most recent data.