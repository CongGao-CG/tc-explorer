from pathlib import Path, PurePath
import json

records = []
for kml in Path("storms").glob("*.kml"):
    stem = kml.stem
    parts = stem.split("_")
    year  = parts[0][4:8]
    name  = parts[1].title()
    records.append({"id": parts[0], "name": name,
                    "year": int(year), "kml": str(PurePath(kml))})

Path("storms/storms.json").write_text(json.dumps(sorted(records,
                              key=lambda x: (x['year'], x['name'])),
                              indent=2))
