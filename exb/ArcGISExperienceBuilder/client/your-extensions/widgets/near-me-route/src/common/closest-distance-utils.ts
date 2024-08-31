import geometryEngine from 'esri/geometry/geometryEngine'
import SpatialReference from 'esri/geometry/SpatialReference'
import geodesicUtils from 'esri/geometry/support/geodesicUtils'
import webMercatorUtils from 'esri/geometry/support/webMercatorUtils'
import Polygon from 'esri/geometry/Polygon'
import Polyline from 'esri/geometry/Polyline'
import Point from 'esri/geometry/Point'

const geodesicSR = new SpatialReference({ wkid: 4326 } as __esri.SpatialReference)

/**
 * Returns the closest distance between two geometries
 * Calculates distance between geometry of types Point/Polyline/Polygon
 * Important Note: This method will return geodesic distance if it can be calculated or else it will return planar distance between two geometries
 * @param selectedGeometry - Incident geometry
 * @param intersectedGeometry - Intersecting geometry to the selected incident geometry or the buffer
 * @param distanceUnit - Unit in which distance needs to be displayed
 * @returns geodesic distance
 */
export const getDistance = (selectedGeometry: __esri.Geometry, intersectedGeometry: __esri.Geometry, distanceUnit: __esri.LinearUnits): string | number => {
  let geodesicDistance: string | number = -1
  //return 0 if any of the geometry is not valid
  //or if the two geometries intersects
  if (!selectedGeometry || !intersectedGeometry || geometryEngine.intersects(selectedGeometry, intersectedGeometry)) {
    return 0
  }
  //check if geodesic calculations can be done or not
  if ((selectedGeometry && webMercatorUtils.canProject(selectedGeometry, geodesicSR)) &&
  (intersectedGeometry && webMercatorUtils.canProject(intersectedGeometry, geodesicSR))) {
    //project geometries in 4326 SR
    selectedGeometry = webMercatorUtils.project(selectedGeometry, geodesicSR)
    intersectedGeometry = webMercatorUtils.project(intersectedGeometry, geodesicSR)
    //Based on geometry types call the method to get distance between two geometries
    if (selectedGeometry.type === 'multipoint') {
      if (intersectedGeometry.type === 'point') {
        geodesicDistance = getGeodesicDistancebetweenMultipointToPoint(selectedGeometry, intersectedGeometry)
      } else if (intersectedGeometry.type === 'polyline') {
        geodesicDistance =
        getGeodesicDistancebetweenMultipointToPolyline(selectedGeometry, intersectedGeometry)
      } else if (intersectedGeometry.type === 'polygon') {
        geodesicDistance = getGeodesicDistancebetweenMultipointToPolygon(selectedGeometry, intersectedGeometry)
      }
    } else if (selectedGeometry.type === 'point') {
      if (intersectedGeometry.type === 'point') {
        geodesicDistance =
            getGeodesicDistanceBetweenPointToPoint(selectedGeometry, intersectedGeometry)
      } else if (intersectedGeometry.type === 'polyline') {
        geodesicDistance =
            getGeodesicDistanceBetweenPointToLine(selectedGeometry, intersectedGeometry)
      } else if (intersectedGeometry.type === 'polygon') {
        geodesicDistance =
            getGeodesicDistanceBetweenPointToPolygon(selectedGeometry, intersectedGeometry)
      }
    } else if (selectedGeometry.type === 'polyline') {
      if (intersectedGeometry.type === 'point') {
        geodesicDistance =
            getGeodesicDistanceBetweenPointToLine(intersectedGeometry, selectedGeometry)
      } else if (intersectedGeometry.type === 'polyline') {
        geodesicDistance =
            getGeodesicDistanceBetweenLineToLine(selectedGeometry, intersectedGeometry)
      } else if (intersectedGeometry.type === 'polygon') {
        geodesicDistance =
            getGeodesicDistanceBetweenLineToPolygon(selectedGeometry, intersectedGeometry)
      }
    } else if (selectedGeometry.type === 'polygon') {
      if (intersectedGeometry.type === 'point') {
        geodesicDistance =
            getGeodesicDistanceBetweenPointToPolygon(intersectedGeometry, selectedGeometry)
      } else if (intersectedGeometry.type === 'polyline') {
        geodesicDistance =
            getGeodesicDistanceBetweenLineToPolygon(intersectedGeometry, selectedGeometry)
      } else if (intersectedGeometry.type === 'polygon') {
        geodesicDistance =
            getGeodesicDistanceBetweenPolygonToPolygon(selectedGeometry, intersectedGeometry)
      }
    }
    //By default geodesicDistance will be calculated in meters,
    //If distance unit is defined, convert the the the value from meters to the defined unit
    if (distanceUnit) {
      geodesicDistance = convertToUnit(geodesicDistance, distanceUnit)
    }
  } else {
    geodesicDistance = geometryEngine.distance(selectedGeometry, intersectedGeometry, distanceUnit)
  }
  return geodesicDistance
}

/**
 * Returns geodesic distance between Multipoint To Point
 * @param multiPointGeom multi-point geometry
 * @param point point
 * @returns distance
 */

const getGeodesicDistancebetweenMultipointToPoint = (multiPointGeom: __esri.Geometry, point: __esri.Geometry): number => {
  const nearestCoordinate = geometryEngine.nearestCoordinate(multiPointGeom, point as Point).coordinate
  return getGeodesicDistanceBetweenPointToPoint(point, nearestCoordinate)
}

/**
 * Returns geodesic distance between Multipoint To polygon
 * @param multiPointGeom multi-point geometry
 * @param polygon polygon
 * @returns distance
 */
const getGeodesicDistancebetweenMultipointToPolygon = (multiPointGeom: __esri.Geometry, polygon: __esri.Geometry): number => {
  let newDistance: number
  let minimumDistance: number
  const multiPoint = multiPointGeom as __esri.Multipoint
  const coord = multiPoint.points
  for (let j = 0; j < multiPoint.points.length; j++) {
    const eachPoint = new Point({ x: coord[j][0], y: coord[j][1], spatialReference: multiPointGeom.spatialReference.toJSON() })
    newDistance = getGeodesicDistanceBetweenPointToPolygon(eachPoint, polygon)
    if (minimumDistance === undefined || newDistance < minimumDistance) {
      minimumDistance = newDistance
    }
  }
  return minimumDistance
}

/**
 * Returns geodesic distance between Multipoint To polyline
 * @param multiPointGeom multi-point geometry
 * @param polyline polyline
 * @returns distance
 */
const getGeodesicDistancebetweenMultipointToPolyline = (multiPointGeom: __esri.Geometry, polyline: __esri.Geometry): number => {
  let newDistance: number
  let minimumDistance: number
  const multiPoint = multiPointGeom as __esri.Multipoint
  const coord = multiPoint.points
  for (let j = 0; j < multiPoint.points.length; j++) {
    const eachPoint = new Point({ x: coord[j][0], y: coord[j][1], spatialReference: multiPointGeom.spatialReference.toJSON() })
    newDistance = getGeodesicDistanceBetweenPointToLine(eachPoint, polyline)
    if (minimumDistance === undefined || newDistance < minimumDistance) {
      minimumDistance = newDistance
    }
  }
  return minimumDistance
}

/**
 * Returns geodesic distance between two polygons
 * @param polygon1 - Polygon1 Geometry
 * @param polygon2 - Polygon2 Geometry
 * @returns distance
 */
const getGeodesicDistanceBetweenPolygonToPolygon = (polygon1Geom: __esri.Geometry, polygon2Geom: __esri.Geometry): number => {
  let newDistance: number
  let minimumDistance: number
  const polygon1 = polygon1Geom as __esri.Polygon
  const polygon2 = polygon2Geom as __esri.Polygon
  //if two geometries intersects then the distance will be zero
  if (geometryEngine.intersects(polygon1, polygon2)) {
    return 0
  }
  let i: number
  let j: number
  for (i = 0; i < polygon1.rings.length; i++) {
    for (j = 0; j < polygon1.rings[i].length; j++) {
      const polygon1Point = polygon1.getPoint(i, j)
      newDistance = getGeodesicDistanceBetweenPointToPolygon(polygon1Point, polygon2)
      if (minimumDistance === undefined || newDistance < minimumDistance) {
        minimumDistance = newDistance
      }
    }
  }
  for (i = 0; i < polygon2.rings.length; i++) {
    for (j = 0; j < polygon2.rings[i].length; j++) {
      const polygon2Point = polygon2.getPoint(i, j)
      newDistance = getGeodesicDistanceBetweenPointToPolygon(polygon2Point, polygon1)
      if (minimumDistance === undefined || newDistance < minimumDistance) {
        minimumDistance = newDistance
      }
    }
  }
  return minimumDistance
}

/**
 * Returns geodesic distance between Line and a polygon
 * @param line - Polyline Geometry
 * @param polygon - Polygon Geometry
 * @returns distance
 */
const getGeodesicDistanceBetweenLineToPolygon = (lineGeom: __esri.Geometry, polygonGeom: __esri.Geometry): number => {
  let newDistance: number
  let minimumDistance: number
  const line = lineGeom as __esri.Polyline
  const polygon = polygonGeom as __esri.Polygon
  let i: number
  let j: number
  //if two geometries intersects then the distance will be zero
  if (geometryEngine.intersects(line, polygon)) {
    return 0
  }
  for (i = 0; i < line.paths.length; i++) {
    for (j = 0; j < line.paths[i].length; j++) {
      const line1Point = line.getPoint(i, j)
      newDistance = getGeodesicDistanceBetweenPointToPolygon(line1Point, polygon)
      if (minimumDistance === undefined || newDistance < minimumDistance) {
        minimumDistance = newDistance
      }
    }
  }
  for (i = 0; i < polygon.rings.length; i++) {
    for (j = 0; j < polygon.rings[i].length; j++) {
      const polygon1Point = polygon.getPoint(i, j)
      newDistance = getGeodesicDistanceBetweenPointToLine(polygon1Point, line)
      if (minimumDistance === undefined || newDistance < minimumDistance) {
        minimumDistance = newDistance
      }
    }
  }
  return minimumDistance
}

/**
 * Returns geodesic distance between 2 Line geometries
 * @param line1 - Polyline Geometry
 * @param line2 - Polyline Geometry
 * @returns distance
 */
const getGeodesicDistanceBetweenLineToLine = (line1Geom: __esri.Geometry, line2Geom: __esri.Geometry): number => {
  let i: number
  let j: number
  let newDistance: number
  let minimumDistance: number
  const line1 = line1Geom as __esri.Polyline
  const line2 = line2Geom as __esri.Polyline
  //if two geometries intersects then the distance will be zero
  if (geometryEngine.intersects(line1, line2)) {
    return 0
  }
  for (i = 0; i < line1.paths.length; i++) {
    for (j = 0; j < line1.paths[i].length; j++) {
      const line1Point = line1.getPoint(i, j)
      newDistance = getGeodesicDistanceBetweenPointToLine(line1Point, line2)
      if (minimumDistance === undefined || newDistance < minimumDistance) {
        minimumDistance = newDistance
      }
    }
  }
  for (i = 0; i < line2.paths.length; i++) {
    for (j = 0; j < line2.paths[i].length; j++) {
      const line2Point = line2.getPoint(i, j)
      newDistance = getGeodesicDistanceBetweenPointToLine(line2Point, line1)
      if (minimumDistance === undefined || newDistance < minimumDistance) {
        minimumDistance = newDistance
      }
    }
  }
  return minimumDistance
}

/**
 * Returns geodesic distance between a point and Polygon geometries
 * @param point - Point Geometry
 * @param polygon - Polygon Geometry
 * @returns distance
 */
const getGeodesicDistanceBetweenPointToPolygon = (pointGeom: __esri.Geometry, polygonGeom: __esri.Geometry): number => {
  let newDistance: number
  let minimumDistance: number
  const point = pointGeom as __esri.Point
  const polygon = polygonGeom as __esri.Polygon
  if (polygon?.rings?.length > 0) {
    polygon.rings.forEach((eachRing) => {
      const polygonJson = {
        rings: [eachRing],
        spatialReference: polygon.spatialReference
      }
      const newPolygon = new Polygon(polygonJson)
      const nearestCoordinate = geometryEngine.nearestCoordinate(newPolygon, point).coordinate
      newDistance = getGeodesicDistanceBetweenPointToPoint(point, nearestCoordinate)
      if (minimumDistance === undefined || newDistance < minimumDistance) {
        minimumDistance = newDistance
      }
    })
  }
  return minimumDistance
}

/**
 * Returns geodesic distance between a point and Polygon geometries
 * @param point - Point Geometry
 * @param line - Polyline Geometry
 * @returns distance
 */
const getGeodesicDistanceBetweenPointToLine = (pointGeom: __esri.Geometry, lineGeom: __esri.Geometry): number => {
  let newDistance: number
  let minimumDistance: number
  const point = pointGeom as __esri.Point
  const line = lineGeom as __esri.Polyline
  if (line.paths?.length > 0) {
    line.paths.forEach((eachPath) => {
      const polylineJson = {
        paths: [eachPath],
        spatialReference: line.spatialReference
      }
      const polyline = new Polyline(polylineJson)
      const nearestCoordinate = geometryEngine.nearestCoordinate(polyline, point).coordinate
      newDistance = getGeodesicDistanceBetweenPointToPoint(point, nearestCoordinate)
      if (minimumDistance === undefined || newDistance < minimumDistance) {
        minimumDistance = newDistance
      }
    })
  }
  return minimumDistance
}

/**
 * Returns geodesic distance between 2 Points
 * @param point1 - Point Geometry
 * @param point2 - Point Geometry
 * @returns distance
 */
const getGeodesicDistanceBetweenPointToPoint = (point1: __esri.Geometry, point2: __esri.Geometry): number => {
  //Using geometryEngine get the geodesic distance between two points
  const geodesicDist = geodesicUtils.geodesicDistance(point1 as __esri.Point, point2 as __esri.Point, 'meters')
  return isNaN(geodesicDist.distance) ? -1 : geodesicDist.distance
}

/**
 * Converts the distance from meters to the defined unit
 * @param fromValue - always in meters
 * @param toUnits - unit in which the value is to be converted
 * @returns number
 */
const convertToUnit = (fromValue: string | number, toUnits: __esri.LinearUnits): string | number => {
  const fromUnits = 'meters'
  if (fromUnits === toUnits) {
    return +fromValue
  } else {
    return (+fromValue / perUnitMeter(fromUnits)) * perUnitMeter(toUnits)
  }
}

/**
 * Get the conversion factor according to the units
 * @param units passed units
 * @returns converted units values
 */
export const perUnitMeter = (units: __esri.LinearUnits): number => {
  let conversionFactor = 1.0
  switch (units) {
    case 'meters':
      conversionFactor = 1.0
      break
    case 'kilometers':
      conversionFactor = 1 / 1000
      break
    case 'feet':
      conversionFactor = 1 / 0.3048
      break
    case 'yards':
      conversionFactor = 1 / 0.9144
      break
    case 'miles':
      conversionFactor = 1 / 1609.344
      break
  }
  return conversionFactor
}
