# Storage

```cards
storage.limit("data.rtf", 0)
storage.exists("data.rtf")
storage.size("data.rtf")
storage.remove("data.rtf")
storage.permanent.read("data.rtf")
storage.permanent.overwrite("data.rtf", "string")
storage.permanent.append("data.rtf", "")
storage.permanent.appendLine("data.txt", "")

storage.setCSVSeparator(CSVSeparator.Comma)
storage.permanent.appendCSVHeaders("data.csv", [])
storage.permanent.appendCSV("data.csv", [])
storage.external.readCSVRow("data.csv", 0)
storage.external.readCSVCell("data.csv", 0, 0)
```