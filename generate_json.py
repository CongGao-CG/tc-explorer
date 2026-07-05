from pathlib import Path, PurePath
import json
import xml.etree.ElementTree as ET

KML_NS = "{http://www.opengis.net/kml/2.2}"


def extract_track(kml):
    root = ET.parse(kml).getroot()
    coords = []
    for node in root.findall(f".//{KML_NS}Point/{KML_NS}coordinates"):
        for coord in (node.text or "").strip().split():
            parts = coord.split(",")
            if len(parts) < 2:
                continue
            lon, lat = float(parts[0]), float(parts[1])
            coords.append([round(lon, 4), round(lat, 4)])
    return coords


records = []
tracks = []
for kml in Path("storms").glob("*.kml"):
    stem = kml.stem
    parts = stem.split("_")
    year  = parts[0][4:8]
    name  = parts[1].title()
    records.append({"id": parts[0], "name": name,
                    "year": int(year), "kml": str(PurePath(kml))})
    tracks.append({
        "id": parts[0],
        "basin": parts[0][:2],
        "year": int(year),
        "coords": extract_track(kml)
    })

Path("storms/storms.json").write_text(json.dumps(sorted(records,
                              key=lambda x: (x['year'], x['name'])),
                              indent=2))
Path("storms/tracks.json").write_text(json.dumps(sorted(tracks,
                              key=lambda x: (x['year'], x['id'])),
                              separators=(",", ":")))
