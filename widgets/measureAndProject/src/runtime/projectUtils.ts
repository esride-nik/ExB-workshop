import { Point } from 'esri/geometry'

export function projectWrapper (p, epsg, func) {
  if (Projection.isSupported()) {
    const projectedPoints = Projection.project([p], new SpatialReference(epsg))
    if (projectedPoints !== null) {
      return projectedPoints
    }
  }
  return null
}

export function displayValuesOnClick (p, epsg) {
  if (epsg === 4326) {
    this.measurement.markerLongitude.innerHTML = '' + p.x.toFixed(6)
    this.measurement.markerLatitude.innerHTML = p.y.toFixed(6)
  } else if (epsg === 0) {
    dd = p.x
    d = parseInt(dd)
    m = parseInt((dd - d) * 60)
    s = parseFloat((dd - d - m / 60) * 3600).toFixed(2)
    this.measurement.markerLongitude.innerHTML = '' + d + '°' + m + "'" + s + '"'
    dd = p.y
    d = parseInt(dd)
    m = parseInt((dd - d) * 60)
    s = parseFloat((dd - d - m / 60) * 3600).toFixed(2)
    this.measurement.markerLatitude.innerHTML = '' + d + '°' + m + "'" + s + '"'
  } else if (epsg === 25832) {
    this.measurement.markerLongitude.innerHTML = p.x.toFixed(2)
    this.measurement.markerLatitude.innerHTML = p.y.toFixed(2)
  } else {
    this.measurement.markerLongitude.innerHTML = '3' + p.x.toFixed(2)
    this.measurement.markerLatitude.innerHTML = p.y.toFixed(2)
  }
}

export function displayValuesOnMove (p, epsg) {
  if (epsg === 4326) {
    this.measurement.mouseLongitude.innerHTML = '' + p.x.toFixed(6)
    this.measurement.mouseLatitude.innerHTML = p.y.toFixed(6)
  } else if (epsg == 0) {
    dd = p.x
    d = parseInt(dd)
    m = parseInt((dd - d) * 60)
    s = parseFloat((dd - d - m / 60) * 3600).toFixed(2)
    this.measurement.mouseLongitude.innerHTML = '' + d + '°' + m + "'" + s + '"'
    dd = p.y
    d = parseInt(dd)
    m = parseInt((dd - d) * 60)
    s = parseFloat((dd - d - m / 60) * 3600).toFixed(2)
    this.measurement.mouseLatitude.innerHTML = '' + d + '°' + m + "'" + s + '"'
  } else if (epsg == 25832) {
    this.measurement.mouseLongitude.innerHTML = p.x.toFixed(2)
    this.measurement.mouseLatitude.innerHTML = p.y.toFixed(2)
  } else {
    this.measurement.mouseLongitude.innerHTML = '3' + p.x.toFixed(2)
    this.measurement.mouseLatitude.innerHTML = p.y.toFixed(2)
  }
}

export function _projectLocation (b) {
  const epsg = this._getProjection()

  if (epsg === 4326 || epsg === 0) {
    if (b.spatialReference.wkid === 4326) {
      this.displayValuesOnMove(b, epsg)
    } else {
      const projectedPoints = this.projectWrapper(b, 4326, null)
      this.displayValuesOnMove(projectedPoints[0], epsg)
    }
  } else if (Projection.isSupported()) {
    const projectedPoints = this.projectWrapper(b, epsg, null)
    if (projectedPoints[0] !== null) {
      this.displayValuesOnMove(projectedPoints[0], epsg)
    }
    return projectedPoints[0]
  }
  return null
}

export function _projectLocationOnClick (b) {
  const epsg = this._getProjection()

  if (epsg == 4326 || epsg == 0) {
    if (b.spatialReference.wkid == 4326) {
      this.displayValuesOnClick(b, epsg)
    } else {
      const projectedPoints = this.projectWrapper(b, 4326, null)
      this.displayValuesOnClick(projectedPoints[0], epsg)
    }
  } else if (Projection.isSupported()) {
    const projectedPoints = this.projectWrapper(b, epsg, null)
    if (projectedPoints[0] != null) {
      this.displayValuesOnClick(projectedPoints[0], epsg)
    }
    return projectedPoints[0]
  }
  return null
}

export function _updateClickLocation (b, a) {
  let p = new Point({
    x: parseFloat(b.replace(',', '.')),
    y: parseFloat(a.replace(',', '.')),
    spatialReference: { wkid: 4326 }
  })
  p = this._projectLocationOnClick(p)
}

export function _getProjection () {
  if (document.getElementById('LS310').checked) return parseInt(document.getElementById('LS310').value)
  else if (document.getElementById('LS320').checked) return parseInt(document.getElementById('LS320').value)
  else if (document.getElementById('GRAD').checked) return parseInt(document.getElementById('GRAD').value)
  else if (document.getElementById('DMS').checked) return parseInt(document.getElementById('DMS').value)
}
