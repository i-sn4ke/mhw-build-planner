"""Build the local uppercase display face from the bundled OFL Cinzel Bold.

Requires fonttools 4.66.1. Usage: python scripts/create-guild-display-font.py
The reference informs the heavy, flared, uneven outlines; this is not the
official Monster Hunter typeface. Original source font is never overwritten.
"""
from pathlib import Path
import math
import sys

# Optional tooling path keeps this authoring dependency outside the web app.
if len(sys.argv) > 1:
    sys.path.insert(0, sys.argv[1])

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables.ttProgram import Program

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/assets/fonts/cinzel-bold.ttf"
OUTPUT = ROOT / "src/assets/fonts/guild-carved-display.ttf"
font = TTFont(SOURCE, recalcTimestamp=False)
characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:;!?'-+/()&%"
options = subset.Options()
options.hinting = False
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=characters)
subsetter.subset(font)
cmap = font.getBestCmap()
widths = {"M": .98, "O": .94, "N": .96, "S": 1.1, "T": 1.06,
          "E": 1.04, "R": 1.04, "H": .96, "U": .96, "I": .96,
          "B": 1.02, "L": 1.02, "D": .98, "P": 1.04, "A": 1.02}
letters = {name: chr(code) for code, name in cmap.items()}

for name in font.getGlyphOrder():
    glyph = font["glyf"][name]
    if glyph.numberOfContours <= 0:
        continue
    coords, ends, _ = glyph.getCoordinates(font["glyf"])
    original = list(coords)
    letter = letters.get(name, "")
    width = widths.get(letter, 1) * .84
    start = 0
    for end in ends:
        contour = original[start:end + 1]
        count = len(contour)
        area = sum(contour[i][0] * contour[(i + 1) % count][1]
                   - contour[(i + 1) % count][0] * contour[i][1]
                   for i in range(count))
        center_x = (min(p[0] for p in contour) + max(p[0] for p in contour)) / 2
        center_y = (min(p[1] for p in contour) + max(p[1] for p in contour)) / 2
        for index, (x, y) in enumerate(contour):
            # TrueType contours keep filled material on the right: the left
            # normals thicken both exterior strokes and interior counters.
            previous = contour[(index - 1) % count]
            following = contour[(index + 1) % count]
            normals = []
            for a, b in ((previous, (x, y)), ((x, y), following)):
                dx, dy = b[0] - a[0], b[1] - a[1]
                length = math.hypot(dx, dy)
                if length:
                    normals.append((-dy / length, dx / length))
            nx = sum(p[0] for p in normals) / max(1, len(normals))
            ny = sum(p[1] for p in normals) / max(1, len(normals))
            x += 15 * nx
            y += 15 * ny
            if letter == "O" and area > 0:
                # The reference's narrow, slightly tilted carved O counter.
                x = center_x + (x - center_x) * .55 + (y - center_y) * .025
            # Coherent, small irregularities rather than random jagged edges.
            seed = ord(letter[0]) if letter else 0
            x += 2.5 * math.sin(y * .039 + seed) + 1.5 * math.sin(x * .071)
            y += 2 * math.sin(x * .043 + seed * .3)
            coords[start + index] = (round(x * width), round(y))
        start = end + 1
    glyph.coordinates = coords
    glyph.program = Program()
    glyph.recalcBounds(font["glyf"])
    advance, _ = font["hmtx"][name]
    font["hmtx"][name] = (round(advance * width) + 8, glyph.xMin)

# Lowercase inputs display the same capital outlines; no invented lowercase.
for table in font["cmap"].tables:
    if table.isUnicode():
        for code in range(ord("A"), ord("Z") + 1):
            table.cmap[code + 32] = cmap[code]

names = {1: "Guild Carved Display", 2: "Regular", 3: "GuildCarvedDisplay-1.000",
         4: "Guild Carved Display", 5: "Version 1.000", 6: "GuildCarvedDisplay",
         16: "Guild Carved Display", 17: "Regular"}
for record in font["name"].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font["OS/2"].usWeightClass = 400
font["OS/2"].fsSelection = (font["OS/2"].fsSelection & ~33) | 64
font["head"].macStyle = 0
font["head"].fontRevision = 1.0
font.save(OUTPUT)

# Round-trip validates table serialization and complete advertised coverage.
result = TTFont(OUTPUT)
assert all(ord(character) in result.getBestCmap() for character in characters)
assert result["name"].getDebugName(1) == "Guild Carved Display"
print(f"Created {OUTPUT.name}: {OUTPUT.stat().st_size:,} bytes, A-Z, 0-9 and punctuation")
