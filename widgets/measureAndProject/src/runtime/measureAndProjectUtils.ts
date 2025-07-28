import { type Point, SpatialReference } from 'esri/geometry'
import * as coordinateFormatter from '@arcgis/core/geometry/coordinateFormatter.js'
import * as projection from '@arcgis/core/geometry/projection.js'
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils.js'

export enum allowedSrs {
  EPSG25832 = 25832,
  EPSG8395 = 8395,
  EPSG4326 = 4326,
  EPSG0 = 0
}

const projectPoint = (point: Point, epsg: number): Point => {
  if (!point) return
  const outSr = new SpatialReference({
    wkid: epsg
  })
  const geogtran = projection.getTransformation(point?.spatialReference, outSr)
  const projectedPoint = projection.project(point, outSr, geogtran)
  return projectedPoint as Point
}

const formatPointAsDms = (point: Point): string => {
  if (!point) return
  const geoPoint = webMercatorUtils.webMercatorToGeographic(point) as Point
  return coordinateFormatter.toLatitudeLongitude(geoPoint, 'dms', 2)
}

const getDegNoLeadingZeroes = (deg: string): string => {
  return deg.replace(/^0+/, '').length > 0 ? deg.replace(/^0+/, '') : '0'
}

const getDmsLatitude = (point: Point): string => {
  if (!point) return
  const dmsPoint = formatPointAsDms(point)
  const latitude = dmsPoint?.split(/[N|S]/)[0]?.trim()
  const latitudeParts = latitude.split(' ')
  if (latitudeParts.length < 3) return latitude // fallback
  const latitudeFormatted = `${dmsPoint.includes('S') ? '-' : ''}${getDegNoLeadingZeroes(latitudeParts[0])}°${latitudeParts[1]}′${latitudeParts[2].replace(/[N|S]+/, '')}″`
  return latitudeFormatted
}

const getDmsLongitude = (point: Point): string => {
  if (!point) return
  const dmsPoint = formatPointAsDms(point)
  const longitude = dmsPoint?.split(/[N|S]/)[1]?.trim()
  const longitudeParts = longitude.split(' ')
  if (longitudeParts.length < 3) return longitude // fallback
  const longitudeFormatted = `${dmsPoint.includes('W') ? '-' : ''}${getDegNoLeadingZeroes(longitudeParts[0])}°${longitudeParts[1]}′${longitudeParts[2].replace(/[E|W]+/, '')}″`
  return longitudeFormatted
}

export const getFormattedLatitude = (srs: allowedSrs, point: Point): string => {
  return srs === allowedSrs.EPSG4326 // decimal degrees
    ? formatPointAsDecimalDegrees(point)?.y.toFixed(6)
    : srs === allowedSrs.EPSG25832 // LS310
      ? projectPoint(point, allowedSrs.EPSG25832)?.y.toFixed(2)
      : srs === allowedSrs.EPSG8395 // LS320
        ? projectPoint(point, allowedSrs.EPSG8395)?.y.toFixed(2)
        : getDmsLatitude(point) // degrees minutes seconds latitude
}

export const getFormattedLongitude = (srs: allowedSrs, point: Point): string => {
  return srs === allowedSrs.EPSG4326 // decimal degrees
    ? formatPointAsDecimalDegrees(point)?.x.toFixed(6)
    : srs === allowedSrs.EPSG25832 // LS310
      ? projectPoint(point, allowedSrs.EPSG25832)?.x.toFixed(2)
      : srs === allowedSrs.EPSG8395 // LS320
        ? point.x > 200000 && point.x < 6000000 // bounding box for LS320 validity
          ? `3${projectPoint(point, allowedSrs.EPSG8395)?.x.toFixed(2)}` // requirement: "False_Easting",3500000.0 instead of 500000.0, as defined for EPSG:8395
          : ''
        : getDmsLongitude(point) // degrees minutes seconds longitude
}

const formatPointAsDecimalDegrees = (point: Point): Point => {
  if (!point) return
  return webMercatorUtils.webMercatorToGeographic(point) as Point
}

export const formatMeasurementStringDistance = (mRound: number, fractionDigits: number, locale: string): string => {
  // implemented just like the original measurement widget behaves => could be changed or made configurable
  let unit = 'm'
  if (mRound > 3000) {
    mRound = mRound / 1000
    unit = 'km'
  }
  const numberFormat = new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }) // format as meters including the unit (because it's in the standard) in local number format
  return `${numberFormat.format(mRound)} ${unit}`
}

export const formatMeasurementStringArea = (mRound: number, fractionDigits: number, locale: string): string => {
  // implemented just like the original measurement widget behaves => could be changed or made configurable
  let unit = 'm²'
  if (mRound > 3000000) {
    mRound = mRound / 1000000
    unit = 'km²'
  }
  const numberFormat = new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }) // format as decimal in local number format
  return `${numberFormat.format(mRound)} ${unit}`
}
