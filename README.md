The **Basemap** selector switches between OpenStreetMap streets and
OpenTopoMap-R terrain with shaded relief and elevation contours. Zoom in to
see contour lines and height labels; switching basemaps keeps the current view
and storm tracks.

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
