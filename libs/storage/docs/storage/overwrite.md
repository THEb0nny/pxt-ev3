# Overwrite file

Completely replaces the contents of a file with new text.

## Example

```blocks
storage.internal.overwrite("data.rtf", "Hello")
```

## Parameters

### filename

The file name to overwrite.

### data

The new file contents.

## Notes

* Existing file contents are deleted before writing.
* The file is automatically created if it does not exist.
* `.rtf` files are recommended for readable EV3 text files.
