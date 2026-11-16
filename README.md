The **Basemap** selector switches between **Streets — English labels** and
**Terrain — land & ocean depth**. Both prefer English place names, then
Latin-script names where available, with original names as a last fallback.
Both use OpenFreeMap's Liberty map features. Terrain adds OpenTopoMap's
elevation colors and hillshade styling, with Mapterhorn elevation data and land
contours. Terrain also includes
colored ocean depths and NOAA / GEBCO depth contours labeled in meters.
Pale blues show shallow water; darker blues show deeper water.
Expand **Depth color key (meters)** for the exact depth bands.
Zoom in for detail; switching basemaps keeps the current view and storm tracks.
Storm tracks repeat with the basemap when panning east or west, in both
single-storm and multiple-storm modes. Dateline crossings remain continuous.

Ocean colors come from [OpenDEM's GEBCO 2021 WMS](https://www.opendem.info/download_bathymetry.html),
with land masked using Natural Earth so the terrain remains visible. Depths
shallower than 25 m are uncolored. The [provider's legend](https://opendem.info/ol6/bathymetry_raster/legend.71d11efa.png)
is saved as `assets/ocean-depth-legend.png`. Colors and contours use different
GEBCO releases (2021 and 2023), so their boundaries can differ locally. Color
requests use 512-pixel tiles up to source zoom 9; closer views enlarge those
tiles without adding depth detail.

The transparent [ocean-depth layer](https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/GEBCO_contours/MapServer)
is provided by NOAA NCEI from the GEBCO_2023 grid and appears only in Terrain
mode, below storm tracks. It shows smoothed depth contours at intervals of
2,000, 1,000, or 500 meters depending on zoom, plus additional shallow-water
contours. Native tiles cover zoom levels 0–10; closer views enlarge those tiles
without adding depth detail. Land contours are computed separately from the
terrain elevation data.

English labels are drawn from vector data instead of being embedded in raster
images. [OpenFreeMap](https://openfreemap.org/quick_start/) supplies map features
and labels for both views. The terrain elevation styling is adapted from
[OpenTopoMap](https://opentopomap.org/vector/).
[Mapterhorn](https://mapterhorn.com/) supplies elevation data, with contours
computed in the browser using maplibre-contour. The terrain style uses elevation
colors at broad scales and land-cover colors at closer scales.

MapLibre renders the basemap beneath the existing OpenLayers ocean and storm
layers. The two views share their center, zoom, rotation, and horizontal world
copies. English styles are saved in `assets/streets-en.json` and
`assets/terrain-en.json`; their source credits and licenses are in
`assets/map-style-licenses.md`.

Provider credits stay in the fixed sidebar footer and update with the active
layers. Serve the app over HTTP or HTTPS. Tiles load on demand; availability
depends on the external providers. Failed map tiles retry twice automatically
while in view. If they still fail, **Retry tiles** tries again without reloading the page or clearing
storm tracks. Warnings clear when the affected tiles load or leave the view;
style or supporting-resource failures offer a manual basemap reload.

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
