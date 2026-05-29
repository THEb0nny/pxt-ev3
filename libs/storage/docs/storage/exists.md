# docs/storage/exists.md

# File exists

Checks whether a file exists.

## Example

```blocks
if (storage.exists("log.rtf")) {
    brick.showString("Found", 1)
}
```