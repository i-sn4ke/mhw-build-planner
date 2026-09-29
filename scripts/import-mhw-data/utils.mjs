import fs from 'node:fs'
import path from 'node:path'

export function createId(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function parseCsv(content) {
  const rows = []
  let row = []
  let value = ''
  let insideQuotes = false

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        value += '"'
        i += 1
      } else {
        insideQuotes = !insideQuotes
      }

      continue
    }

    if (char === ',' && !insideQuotes) {
      row.push(value)
      value = ''
      continue
    }

    if (
      (char === '\n' || char === '\r') &&
      !insideQuotes
    ) {
      if (char === '\r' && nextChar === '\n') {
        i += 1
      }

      row.push(value)

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row)
      }

      row = []
      value = ''
      continue
    }

    value += char
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  const [headers, ...dataRows] = rows

  return dataRows.map((dataRow) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        dataRow[index] ?? '',
      ]),
    ),
  )
}

export function readCsv(directory, filename) {
  const filePath = path.join(directory, filename)
  const content = fs.readFileSync(filePath, 'utf8')

  return parseCsv(content)
}