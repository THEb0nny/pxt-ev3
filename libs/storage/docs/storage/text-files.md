# Text files

The Storage extension can be used to read and write text files.

## Writing a file

Use the write block to create or overwrite a file.

```blocks
storage.internal.write("notes.rtf", "Hello EV3")
```

## Appending text

Use append to add new text to the end of the file.

```blocks
storage.internal.append("notes.rtf", "New line")
```

## Reading a file

```blocks
let text = storage.internal.read("notes.rtf")
```

## Removing a file

```blocks
storage.internal.remove("notes.rtf")
```

## Checking if a file exists

```blocks
if (storage.internal.exists("notes.rtf")) {
    brick.printString("Found", 1)
}
```