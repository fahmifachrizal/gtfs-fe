// utils/leaflet/L.Polyline.SnakeAnim.js
// Enhanced version with CONSTANT GEOGRAPHIC SPEED regardless of zoom level

// Global registry for tracking instances
if (!window.L.SnakeRegistry) {
  window.L.SnakeRegistry = new Map()
}

// Extend L.Polyline with enhanced snake animation
L.Polyline.include({
  _marker: null,
  _snakingTimestamp: 0,
  _snakingRings: 0,
  _snakingVertices: 0,
  _snakingDistance: 0,
  _snaking: false,

  // NEW: Instance metadata
  _instanceId: null,
  _routeId: null,
  _scheduleInfo: null,
  _snakeConfig: null,

  // NEW: Geographic distance cache
  _segmentDistances: null,
  _totalDistance: 0,

  // Initialize snake with configuration
  initSnake: function (config = {}) {
    this._instanceId = config.id || `instance-${Date.now()}`
    this._routeId = config.routeId || null
    this._scheduleInfo = config.scheduleInfo || null
    this._snakeConfig = {
      speed: config.speed || this.options.snakingSpeed || 200,
      autoRestart: config.autoRestart || false,
      restartDelay: config.restartDelay || 2000,
      onStart: config.onStart || null,
      onProgress: config.onProgress || null,
      onEnd: config.onEnd || null,
      onPause: config.onPause || null,
      onResume: config.onResume || null,
    }

    // Register in global registry
    window.L.SnakeRegistry.set(this._instanceId, this)

    console.log(`[Snake] Initialized instance ${this._instanceId}`)
    return this
  },

  // Calculate geographic distances for all segments
  _calculateDistances: function () {
    if (this._segmentDistances) return // Already calculated

    this._segmentDistances = []
    this._totalDistance = 0

    const rings = L.LineUtil.isFlat(this._latlngs)
      ? [this._latlngs]
      : this._latlngs

    rings.forEach((ring) => {
      const ringDistances = []
      for (let i = 0; i < ring.length - 1; i++) {
        // Calculate geographic distance in meters
        const distance = ring[i].distanceTo(ring[i + 1])
        ringDistances.push(distance)
        this._totalDistance += distance
      }
      this._segmentDistances.push(ringDistances)
    })

    console.log(
      `[Snake ${
        this._instanceId
      }] Calculated distances: ${this._totalDistance.toFixed(2)}m total`
    )
  },

  // Remove snake and cleanup
  removeSnake: function () {
    console.log(`[Snake] Removing instance ${this._instanceId}`)

    // Stop animation if running
    if (this._snaking) {
      this.snakeStop()
    }

    // Remove marker
    if (this._marker && this._map) {
      this._map.removeLayer(this._marker)
      this._marker = null
    }

    // Unregister from global registry
    if (this._instanceId) {
      window.L.SnakeRegistry.delete(this._instanceId)
    }

    // Clear references
    this._snakeLatLngs = null
    this._snakeConfig = null
    this._segmentDistances = null

    return this
  },

  // Draw the entire route immediately
  drawRoute: function () {
    this.setLatLngs(this._latlngs)
    return this
  },

  // Start the snaking animation
  snakeIn: function (options = {}) {
    if (this._snaking) {
      console.warn(`[Snake ${this._instanceId}] Already animating`)
      return this
    }

    if (
      !("performance" in window) ||
      !("now" in window.performance) ||
      !this._map
    ) {
      console.error(`[Snake ${this._instanceId}] Required APIs not available`)
      return this
    }

    console.log(`[Snake ${this._instanceId}] Starting animation`)

    this._snaking = true
    this._snakingTime = performance.now()
    this._snakingVertices = this._snakingRings = this._snakingDistance = 0

    // Cache lat/lng points
    if (!this._snakeLatLngs) {
      this._snakeLatLngs = L.LineUtil.isFlat(this._latlngs)
        ? [this._latlngs]
        : this._latlngs
    }

    // Calculate geographic distances
    this._calculateDistances()

    // Create marker
    const icon = options.icon || null
    this._marker = L.marker(this._snakeLatLngs[0][0], {
      icon,
      zIndexOffset: 1000,
    }).addTo(this._map)

    // Initialize with first point
    this._latlngs = [[this._snakeLatLngs[0][0]]]
    this.setLatLngs(this._latlngs)

    // Fire start callback
    if (this._snakeConfig && this._snakeConfig.onStart) {
      this._snakeConfig.onStart(this)
    }
    this.fire("snakestart", { instanceId: this._instanceId })

    this._snake()
    return this
  },

  // Stop animation completely
  snakeStop: function () {
    if (!this._snaking) return this

    console.log(`[Snake ${this._instanceId}] Stopping`)

    this._snaking = false

    // Remove marker
    if (this._marker && this._map) {
      this._map.removeLayer(this._marker)
      this._marker = null
    }

    this.fire("snakestop", { instanceId: this._instanceId })
    return this
  },

  // Pause animation (can be resumed)
  snakePause: function () {
    if (!this._snaking) return this

    console.log(`[Snake ${this._instanceId}] Pausing`)

    this._snaking = false

    if (this._snakeConfig && this._snakeConfig.onPause) {
      this._snakeConfig.onPause(this)
    }
    this.fire("snakepause", { instanceId: this._instanceId })
    return this
  },

  // Resume paused animation
  snakeResume: function () {
    if (this._snaking) return this

    console.log(`[Snake ${this._instanceId}] Resuming`)

    this._snaking = true
    this._snakingTime = performance.now()

    if (this._snakeConfig && this._snakeConfig.onResume) {
      this._snakeConfig.onResume(this)
    }
    this.fire("snakeresume", { instanceId: this._instanceId })

    this._snake()
    return this
  },

  // Reset to beginning
  snakeReset: function () {
    console.log(`[Snake ${this._instanceId}] Resetting`)

    this.snakeStop()

    this._snakingVertices = this._snakingRings = this._snakingDistance = 0

    if (this._snakeLatLngs) {
      this._latlngs = [[this._snakeLatLngs[0][0]]]
      this.setLatLngs(this._latlngs)
    }

    this.fire("snakereset", { instanceId: this._instanceId })
    return this
  },

  // Get current animation progress (0-1)
  getSnakeProgress: function () {
    if (!this._segmentDistances || this._totalDistance === 0) return 0

    // Calculate distance traveled so far
    let traveledDistance = 0

    for (let r = 0; r < this._snakingRings; r++) {
      traveledDistance += this._segmentDistances[r].reduce((a, b) => a + b, 0)
    }

    if (
      this._snakingRings < this._segmentDistances.length &&
      this._snakingVertices < this._segmentDistances[this._snakingRings].length
    ) {
      for (let v = 0; v < this._snakingVertices; v++) {
        traveledDistance += this._segmentDistances[this._snakingRings][v]
      }
      traveledDistance += this._snakingDistance
    }

    return Math.min(1, traveledDistance / this._totalDistance)
  },

  // Recursive animation loop - CONSTANT GEOGRAPHIC SPEED
  _snake: function () {
    if (!this._snaking) return

    const now = performance.now()
    const diff = now - this._snakingTime
    this._snakingTime = now

    // Speed is in meters per second
    // Convert time difference to seconds and multiply by speed to get meters traveled
    const speed = this._snakeConfig?.speed || this.options.snakingSpeed || 200
    const metersToTravel = (diff / 1000) * speed

    // Remove last point from current segment
    if (
      this._latlngs[this._snakingRings] &&
      this._latlngs[this._snakingRings].length > 1
    ) {
      this._latlngs[this._snakingRings].pop()
    }

    return this._snakeForward(metersToTravel)
  },

  // Move forward along the line by geographic distance
  _snakeForward: function (metersToTravel) {
    if (!this._map || !this._segmentDistances) return

    const currRing = this._snakeLatLngs[this._snakingRings]
    if (!currRing || this._snakingVertices >= currRing.length - 1) {
      return this._snakeEnd()
    }

    // Get current segment distance
    const segmentDistance =
      this._segmentDistances[this._snakingRings][this._snakingVertices]

    // Check if we've passed this segment
    if (this._snakingDistance + metersToTravel >= segmentDistance) {
      // Move to next vertex
      this._snakingVertices++

      if (!this._latlngs[this._snakingRings]) {
        this._latlngs[this._snakingRings] = []
      }

      this._latlngs[this._snakingRings].push(currRing[this._snakingVertices])

      // Check if reached end of ring
      if (this._snakingVertices >= currRing.length - 1) {
        if (this._snakingRings >= this._snakeLatLngs.length - 1) {
          return this._snakeEnd()
        } else {
          // Move to next ring
          this._snakingVertices = 0
          this._snakingRings++
          this._latlngs[this._snakingRings] = [
            this._snakeLatLngs[this._snakingRings][this._snakingVertices],
          ]
        }
      }

      // Continue with remaining distance
      const remainingMeters =
        metersToTravel - (segmentDistance - this._snakingDistance)
      this._snakingDistance = 0
      return this._snakeForward(remainingMeters)
    }

    // We're within this segment
    this._snakingDistance += metersToTravel

    // Calculate interpolated position using geographic distance ratio
    const percent = this._snakingDistance / segmentDistance
    const currPoint = currRing[this._snakingVertices]
    const nextPoint = currRing[this._snakingVertices + 1]

    // Interpolate between points geographically
    const headLatLng = L.latLng(
      currPoint.lat + (nextPoint.lat - currPoint.lat) * percent,
      currPoint.lng + (nextPoint.lng - currPoint.lng) * percent
    )

    if (!this._latlngs[this._snakingRings]) {
      this._latlngs[this._snakingRings] = []
    }

    this._latlngs[this._snakingRings].push(headLatLng)
    this.setLatLngs(this._latlngs)

    // Update marker position
    if (this._marker) {
      this._marker.setLatLng(headLatLng)
    }

    // Fire progress callback
    const progress = this.getSnakeProgress()
    if (this._snakeConfig && this._snakeConfig.onProgress) {
      this._snakeConfig.onProgress(this, progress, headLatLng)
    }
    this.fire("snake", {
      instanceId: this._instanceId,
      progress,
      latLng: headLatLng,
    })

    L.Util.requestAnimFrame(this._snake, this)
  },

  // End animation
  _snakeEnd: function () {
    console.log(`[Snake ${this._instanceId}] Animation completed`)

    this.setLatLngs(this._snakeLatLngs)
    this._snaking = false

    // Remove marker
    if (this._marker && this._map) {
      this._map.removeLayer(this._marker)
      this._marker = null
    }

    // Fire end callback
    if (this._snakeConfig && this._snakeConfig.onEnd) {
      this._snakeConfig.onEnd(this)
    }
    this.fire("snakeend", { instanceId: this._instanceId })

    // Handle auto-restart
    if (this._snakeConfig && this._snakeConfig.autoRestart) {
      const delay = this._snakeConfig.restartDelay || 2000
      console.log(`[Snake ${this._instanceId}] Auto-restarting in ${delay}ms`)

      setTimeout(() => {
        if (this._map && this._snakeConfig.autoRestart) {
          this.snakeReset()
          this.snakeIn()
        }
      }, delay)
    }
  },
})

// Default options
L.Polyline.mergeOptions({
  snakingSpeed: 200, // meters per second
})

// Helper function to get instance from registry
L.getSnakeInstance = function (instanceId) {
  return window.L.SnakeRegistry.get(instanceId) || null
}

// Helper to get all instances for a route
L.getRouteInstances = function (routeId) {
  const instances = []
  window.L.SnakeRegistry.forEach((polyline, instanceId) => {
    if (polyline._routeId === routeId) {
      instances.push({ instanceId, polyline })
    }
  })
  return instances
}

// Helper to cleanup all instances
L.cleanupAllSnakeInstances = function () {
  console.log(`[Snake] Cleaning up ${window.L.SnakeRegistry.size} instances`)
  window.L.SnakeRegistry.forEach((polyline) => {
    if (polyline.removeSnake) {
      polyline.removeSnake()
    }
  })
  window.L.SnakeRegistry.clear()
}

console.log("[Snake] Enhanced plugin loaded with CONSTANT GEOGRAPHIC SPEED")
