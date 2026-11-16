The **Basemap** selector switches between OpenStreetMap streets and **Terrain —
land & ocean depth**. Terrain combines OpenTopoMap-R shaded land relief and
elevation contours with NOAA / GEBCO ocean-depth contours labeled in meters.
Zoom in for detail; switching basemaps keeps the current view and storm tracks.

The transparent [ocean-depth layer](https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/GEBCO_contours/MapServer)
is provided by NOAA NCEI from the GEBCO_2023 grid and appears only in Terrain
mode, below storm tracks. It shows smoothed depth contours at intervals of
2,000, 1,000, or 500 meters depending on zoom, plus additional shallow-water
contours. Native tiles cover zoom levels 0–10; closer views enlarge those tiles
without adding depth detail. Land contours retain their existing detail.

Terrain tiles are provided by [OpenMaps.fr](https://openmaps.fr/), with native
zoom levels up to 18. Their [tile usage policy](https://openmaps.fr/tile-usage-policy.html)
allows free, noncommercial use up to 500,000 tiles per month and requires visible
attribution and a donation link, which the map displays. Serve the app over HTTP
or HTTPS so tile requests include the required Referer header. Tiles load on
demand; availability depends on the external provider.

kms files are produced by https://github.com/CongGao-CG/HURDAT2kml and https://github.com/CongGao-CG/JTWCkml

```bash
python generate_json.py
```

This command reads every KML file in `storms/` and regenerates two files used by
the web app:

- `storms/storms.json` is the storm catalog. Each entry contains a storm ID,
  name, year, and the path to its KML file. The app uses it to populate the
  storm list and load the selected KML.
- `storms/tracks.json` is the compact track index. Each entry contains a storm
  ID, basin, year, and the coordinates extracted from the KML's point elements.
  The app uses it to display and compare multiple storm tracks efficiently.

Both JSON files are overwritten whenever `generate_json.py` is run.

Note: There are 8554 files but 8552 ATCF IDs.

CP022002_ELE_21.kml

CP022002_UNNAMED_67.kml

CP032002_HUKO_43.kml

CP032002_UNNAMED_59.kml
