class EnglishBasemap {
  constructor({ onRecoveryChange = () => {}, prepareStyle = style => style } = {}) {
    this.onRecoveryChange = onRecoveryChange;
    this.prepareStyle = prepareStyle;
    this.failures = new Map();
    this.retryDelays = [1000, 3000];
    this.requestId = 0;
    this.style = null;
    this.resourceError = null;
    this.extent = null;
    this.recoverySignature = '';
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'absolute', inset: '0', pointerEvents: 'none'
    });
    this.container.setAttribute('aria-hidden', 'true');
    this.map = new maplibregl.Map({
      container: this.container,
      style: { version: 8, sources: {}, layers: [] },
      interactive: false,
      attributionControl: false,
      renderWorldCopies: true,
      minZoom: -2,
      maxZoom: 23,
      pitch: 0,
      fadeDuration: 0,
      trackResize: false,
      transformConstrain: (center, zoom) => ({ center, zoom })
    });
    this.source = new ol.source.Source({ attributionsCollapsible: false });
    this.layer = new ol.layer.Layer({
      source: this.source,
      render: frameState => this.render(frameState)
    });
    this.map.on('error', event => this.handleError(event));
    this.map.on('sourcedata', event => {
      if (event.tile?.state === 'loaded') this.removeFailure(event);
      this.updateRecovery();
    });
    this.map.on('sourcedataabort', event => this.removeFailure(event));
    this.map.on('style.load', () => this.layer.changed());
  }

  async setBasemap(name) {
    if (!['streets', 'terrain'].includes(name)) throw new Error('Unknown basemap');
    const requestId = ++this.requestId;
    this.fetchController?.abort();
    this.fetchController = new AbortController();
    this.name = name;
    this.style = null;
    this.resourceError = null;
    this.clearFailures();
    this.updateRecovery();
    try {
      const response = await fetch(`assets/${name}-en.json`, { signal: this.fetchController.signal });
      if (!response.ok) throw new Error(`Map style: HTTP ${response.status}`);
      let style = await response.json();
      style = await this.prepareStyle(style, name) || style;
      if (requestId !== this.requestId) return false;
      style.projection = { type: 'mercator' };
      this.style = style;
      const credits = Object.values(style.sources).map(source => source.attribution).filter(Boolean);
      this.source.setAttributions([...new Set(credits)]);
      this.map.setStyle(style, { diff: false });
      this.layer.changed();
      return true;
    } catch (error) {
      if (requestId !== this.requestId || error.name === 'AbortError') return false;
      this.resourceError = error;
      console.error('Basemap could not load:', error);
      this.updateRecovery();
      return false;
    }
  }

  render(frameState) {
    const [width, height] = frameState.size;
    this.extent = frameState.extent;
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
    this.container.style.opacity = this.layer.getOpacity();
    if (!this.container.isConnected) {
      requestAnimationFrame(() => this.layer.changed());
      return this.container;
    }
    if (width !== this.width || height !== this.height) {
      this.map.resize();
      this.width = width;
      this.height = height;
    }
    const view = frameState.viewState;
    this.map.jumpTo({
      // toLonLat normalizes longitude, which would lose the displayed world copy.
      center: ol.proj.transform(view.center, view.projection, 'EPSG:4326'),
      zoom: view.zoom - 1,
      bearing: -view.rotation * 180 / Math.PI,
      pitch: 0
    });
    this.map.redraw();
    this.updateRecovery();
    return this.container;
  }

  tileKey(sourceId, coord) {
    return `${sourceId}/${coord.z}/${coord.x}/${coord.y}`;
  }

  handleError(event) {
    if (!this.style) return;
    const coord = event.tile?.tileID?.canonical;
    if (!coord || !event.sourceId) {
      this.resourceError = event.error;
      console.error('Basemap resource could not load:', event.error);
    } else {
      const key = this.tileKey(event.sourceId, coord);
      const failure = this.failures.get(key) || {
        sourceId: event.sourceId, coord: { x: coord.x, y: coord.y, z: coord.z },
        attempts: 0, timer: null
      };
      failure.loading = false;
      this.failures.set(key, failure);
    }
    this.updateRecovery();
  }

  removeFailure(event) {
    const coord = event.coord?.canonical || event.tile?.tileID?.canonical;
    if (!coord || !event.sourceId) return;
    const key = this.tileKey(event.sourceId, coord);
    clearTimeout(this.failures.get(key)?.timer);
    this.failures.delete(key);
    this.updateRecovery();
  }

  tileIsInView(failure) {
    if (!this.style || !this.extent || !this.layer.getVisible()) return false;
    const source = this.map.getSource(failure.sourceId);
    if (!source) return false;
    const zoom = this.map.getZoom();
    const active = this.style.layers.some(layer => layer.source === failure.sourceId &&
      layer.layout?.visibility !== 'none' && (!layer.minzoom || zoom >= layer.minzoom) && zoom < (layer.maxzoom ?? 24));
    if (!active) return false;
    const tileZoom = (source.roundZoom ? Math.round : Math.floor)(zoom + Math.log2(512 / (source.tileSize || 512)));
    if (failure.coord.z !== Math.min(source.maxzoom, Math.max(0, tileZoom))) return false;
    const world = ol.proj.get('EPSG:3857').getExtent();
    const worldWidth = ol.extent.getWidth(world);
    const tileWidth = worldWidth / 2 ** failure.coord.z;
    const left = world[0] + failure.coord.x * tileWidth;
    const top = world[3] - failure.coord.y * tileWidth;
    const offset = Math.ceil((this.extent[0] - left - tileWidth) / worldWidth) * worldWidth;
    return ol.extent.intersects(this.extent, [left + offset, top - tileWidth, left + offset + tileWidth, top]);
  }

  updateRecovery() {
    for (const failure of this.failures.values()) {
      if (!this.tileIsInView(failure)) {
        clearTimeout(failure.timer);
        failure.timer = null;
        continue;
      }
      if (!failure.loading && !failure.timer && failure.attempts < this.retryDelays.length) {
        const requestId = this.requestId;
        failure.timer = setTimeout(() => {
          failure.timer = null;
          if (requestId === this.requestId && this.tileIsInView(failure)) {
            failure.attempts += 1;
            failure.loading = true;
            this.map.refreshTiles(failure.sourceId, [failure.coord]);
          }
          this.updateRecovery();
        }, this.retryDelays[failure.attempts]);
      }
    }
    const signature = JSON.stringify(this.getFailures());
    if (signature !== this.recoverySignature) {
      this.recoverySignature = signature;
      queueMicrotask(() => this.onRecoveryChange());
    }
  }

  getFailures() {
    const label = this.name === 'terrain' ? 'terrain' : 'street map';
    const visible = [...this.failures.values()].filter(failure => this.tileIsInView(failure));
    const failures = [];
    if (visible.length) {
      failures.push({
        label,
        retrying: visible.some(failure => failure.timer || failure.loading),
        stalled: visible.some(failure => !failure.timer && !failure.loading)
      });
    }
    if (this.resourceError) failures.push({ label: `${label} resources`, retrying: false, stalled: true });
    return failures;
  }

  retry() {
    if (this.resourceError) return this.setBasemap(this.name);
    for (const failure of this.failures.values()) {
      if (this.tileIsInView(failure) && !failure.timer && !failure.loading) failure.attempts = 0;
    }
    this.updateRecovery();
  }

  clearFailures() {
    for (const failure of this.failures.values()) clearTimeout(failure.timer);
    this.failures.clear();
  }

  dispose() {
    this.requestId += 1;
    this.fetchController?.abort();
    this.clearFailures();
    this.map.remove();
  }
}

window.EnglishBasemap = EnglishBasemap;
