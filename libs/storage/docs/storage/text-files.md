# docs/storage/text-files.md

# Text files

The Storage extension can be used to read and write text files.

## Writing a file

Use the write block to create or overwrite a file.

```blocks
storage.write("notes.rtf", "Hello EV3")
```

## Appending text

Use append to add new text to the end of the file.

```blocks
storage.append("notes.rtf", "New line")
```

## Reading a file

```blocks
let text = storage.read("notes.rtf")
```

## Removing a file

```blocks
storage.remove("notes.rtf")
```

## Checking if a file exists

```blocks
if (storage.exists("notes.rtf")) {
    brick.showString("Found", 1)
}
```