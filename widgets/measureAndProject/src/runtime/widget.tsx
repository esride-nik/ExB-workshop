import { React, type AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Radio, Button } from 'jimu-ui'
import defaultMessages from './translations/default'
import { useEffect, useRef, useState } from 'react'
import Measurement from '@arcgis/core/widgets/Measurement.js'
import * as projection from '@arcgis/core/geometry/projection.js'
import { SpatialReference, type Point } from 'esri/geometry'
import * as reactiveUtils from 'esri/core/reactiveUtils.js'
import * as coordinateFormatter from '@arcgis/core/geometry/coordinateFormatter.js'
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils.js'

import './measureAndProject.css'

enum allowedSrs {
  EPSG25832 = 25832,
  EPSG8395 = 8395,
  EPSG4326 = 4326,
  EPSG0 = 0
}

export default function (props: AllWidgetProps<unknown>) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [measurementWidget, setMeasurementWidget] = useState<Measurement>(undefined)
  const [mouseMapPoint, setMouseMapPoint] = useState<Point>(undefined)
  const [activeTool, setActiveTool] = useState<string>(undefined)
  const [srs, setSrs] = useState<allowedSrs>(25832)
  const [watchHandler, setWatchHandler] = useState<any>(undefined)
  const measurementWidgetNode = useRef(null)
  const measurementPositionNode = useRef(null)
  const originalMeasurementResultNode = useRef(null)
  const duplicateMeasurementResultNode = useRef(null)

  useEffect(() => {
    projection.load()
    coordinateFormatter.load()
  }, [])

  useEffect(() => {
    if (jimuMapView) {
      // init Measurement widget
      const measurement = new Measurement({
        view: jimuMapView.view,
        container: measurementWidgetNode.current
      })
      setMeasurementWidget(measurement)

      // get current mouse position on map as mapm coordinates
      jimuMapView.view.on('pointer-move', (event: any) => {
        fillMeasurementResultNodeRefs()
        const mouseMapPoint = jimuMapView.view.toMap({
          x: event.x,
          y: event.y
        })
        setMouseMapPoint(mouseMapPoint)
        console.log('watchHandler', watchHandler) // TODO: Make it work or remove
      })

      // in case of lost WebGL context
      reactiveUtils.when(
        () => jimuMapView.view.fatalError,
        () => { jimuMapView.view.tryFatalErrorRecovery() }
      )
    }
  }, [jimuMapView])

  // TODO: Make it work or remove
  useEffect(() => {
    console.log('watchHandler', watchHandler)
  }, [watchHandler])

  const fillMeasurementResultNodeRefs = () => {
    // Getting the original measurement display node and creating a duplicate to show the rounded value. We're not using the original node because this would cause a flicker effect.
    if (!originalMeasurementResultNode.current &&
      document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')?.length > 0 &&
      document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] !== undefined) {
      originalMeasurementResultNode.current = (document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] as HTMLElement)
      duplicateMeasurementResultNode.current = originalMeasurementResultNode.current.cloneNode(true) as HTMLElement
      duplicateMeasurementResultNode.current.className = 'esri-measurement-widget-content__measurement-item__value-rounded'
      originalMeasurementResultNode.current.parentNode.insertBefore(duplicateMeasurementResultNode.current, originalMeasurementResultNode.current.nextSibling)
    }
  }

  const isConfigured = () => {
    return props.useMapWidgetIds?.length > 0
  }

  const onActiveViewChange = async (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
    }
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
    const dmsPoint = formatPointAsDms(mouseMapPoint)
    const latitude = dmsPoint?.split(/[N|S]/)[0]?.trim()
    const latitudeParts = latitude.split(' ')
    if (latitudeParts.length < 3) return latitude // fallback
    const latitudeFormatted = `${dmsPoint.includes('S') ? '-' : ''}${getDegNoLeadingZeroes(latitudeParts[0])}°${latitudeParts[1]}′${latitudeParts[2].replace(/[N|S]+/, '')}″`
    return latitudeFormatted
  }

  const getDmsLongitude = (point: Point): string => {
    if (!point) return
    const dmsPoint = formatPointAsDms(mouseMapPoint)
    const longitude = dmsPoint?.split(/[N|S]/)[1]?.trim()
    const longitudeParts = longitude.split(' ')
    if (longitudeParts.length < 3) return longitude // fallback
    const longitudeFormatted = `${dmsPoint.includes('W') ? '-' : ''}${getDegNoLeadingZeroes(longitudeParts[0])}°${longitudeParts[1]}′${longitudeParts[2].replace(/[E|W]+/, '')}″`
    return longitudeFormatted
  }

  const getFormattedLatitude = (): string => {
    return srs === allowedSrs.EPSG4326 // decimal degrees
      ? formatPointAsDecimalDegrees(mouseMapPoint)?.y.toFixed(2)
      : srs === allowedSrs.EPSG25832 // LS310
        ? projectPoint(mouseMapPoint, allowedSrs.EPSG25832)?.y.toFixed(2)
        : srs === allowedSrs.EPSG8395 // LS320
          ? projectPoint(mouseMapPoint, allowedSrs.EPSG8395)?.y.toFixed(2)
          : getDmsLatitude(mouseMapPoint) // degrees minutes seconds latitude
  }

  const getFormattedLongitude = (): string => {
    return srs === allowedSrs.EPSG4326 // decimal degrees
      ? formatPointAsDecimalDegrees(mouseMapPoint)?.x.toFixed(2)
      : srs === allowedSrs.EPSG25832 // LS310
        ? projectPoint(mouseMapPoint, allowedSrs.EPSG25832)?.x.toFixed(2)
        : srs === allowedSrs.EPSG8395 // LS320
          ? mouseMapPoint.x > 200000 && mouseMapPoint.x < 6000000 // bounding box for LS320 validity
            ? `3${projectPoint(mouseMapPoint, allowedSrs.EPSG8395)?.x.toFixed(2)}` // requirement: "False_Easting",3500000.0 instead of 500000.0, as defined for EPSG:8395
            : ''
          : getDmsLongitude(mouseMapPoint) // degrees minutes seconds longitude
  }

  const formatPointAsDecimalDegrees = (point: Point): Point => {
    if (!point) return
    return webMercatorUtils.webMercatorToGeographic(point) as Point
  }

  if (!isConfigured()) {
    return <h5><FormattedMessage id="cfgDataSources" defaultMessage={defaultMessages.cfgDataSources} /></h5>
  }
  return (
        <div className="widget-measure-and-project"
          style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>

          <div id="toolbarDiv" className="esri-component esri-widget">
            <Button
              id="distance"
              className="esri-widget--button esri-interactive esri-icon-measure-line"
              disabled={activeTool === 'distance'}
              title={defaultMessages.distanceMeasurementTool}
              onClick={() => {
                if (measurementWidget) {
                  measurementWidget.clear()
                  measurementWidget.activeTool = 'distance'
                  setActiveTool('distance')

                  measurementWidget.viewModel.watch('state', (state: string) => {
                    if (state === 'measuring') {
                      const watchHandler = (measurementWidget.viewModel.activeViewModel as any).watch('measurement', (m: string) => {
                        if (!document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] || !m) return

                        // TODO: this is going to be configurable by Settings
                        // no need to distinguish by unit: m.length always contains meters, although the widget automatically displays km if m > 3000
                        const mRound = (Math.round(m.length * 2) / 2)
                        const measurementInnerText = originalMeasurementResultNode?.current?.innerText
                        const measurementParts = measurementInnerText.split(/ /)
                        measurementParts[0] = measurementParts[1] === 'km' ? (mRound / 1000).toFixed(2) : mRound.toFixed(1)
                        if (duplicateMeasurementResultNode?.current) duplicateMeasurementResultNode.current.innerText = measurementParts.join(' ')
                      })
                      setWatchHandler(watchHandler)
                    } else if (state === 'measured') {
                      // TODO: Why is watchHandler undefined short after being set on the state as a fine object?
                      // watchHandler.remove()
                    }
                  })
                }
              }}
            ></Button>
            <Button
              id="area"
              className="esri-widget--button esri-interactive esri-icon-measure-area"
              disabled={activeTool === 'area'}
              title={defaultMessages.areaMeasurementTool}
              onClick={() => {
                if (measurementWidget) {
                  measurementWidget.clear()
                  measurementWidget.activeTool = 'area'
                  setActiveTool('area')
                }
              }}
            ></Button>
            <Button
              id='position'
              className='esri-widget--button esri-interactive esri-icon-map-pin'
              disabled={activeTool === 'position'}
              size="default"
              title={defaultMessages.positionTool}
              onClick={() => {
                if (activeTool !== 'position' && measurementWidget) {
                  measurementWidget.clear()
                  measurementWidget.activeTool = undefined
                  setActiveTool('position')
                }
              }}
            ></Button>
            <Button
              id="clear"
              className="esri-widget--button esri-interactive esri-icon-trash"
              disabled={activeTool === 'none'}
              title={defaultMessages.clearMeasurements}
              onClick={() => {
                if (measurementWidget) {
                  measurementWidget.clear()
                  setActiveTool('none')
                }
              }}
            ></Button>
          </div>

          <div id="measurementWidget" ref={measurementWidgetNode} />
          { // this whole block implements the Position tool
          activeTool === 'position' && <div id="measurementPosition" className="esri-widget esri-component esri-measurement-position" ref={measurementPositionNode}>
            <div id="markerLatitude" className="esri-measurement-position-coordinate">
              <h5><FormattedMessage id="latitude" defaultMessage={defaultMessages.latitude} /></h5>
              <p className='esri-measurement-position-coordinate-number'>{getFormattedLatitude()}</p>
            </div>
            <div id="markerLongitude" className="esri-measurement-position-coordinate">
              <h5><FormattedMessage id="longitude" defaultMessage={defaultMessages.longitude} /></h5>
              <p className='esri-measurement-position-coordinate-number'>{getFormattedLongitude()}</p>
            </div>
            <div className="esri-measurement-selectsrs">
              <Label centric className='esri-measurement-selectsrs-radio'>
                <Radio
                  checked={srs === allowedSrs.EPSG25832}
                  id="LS310" value="25832"
                  onChange={() => { setSrs(allowedSrs.EPSG25832) }}
                />{' '}
                <FormattedMessage id="srs25832" defaultMessage={defaultMessages.srs25832} />
              </Label>
              <Label centric className='esri-measurement-selectsrs-radio'>
                <Radio
                  checked={srs === allowedSrs.EPSG8395}
                  id="LS320" value="8395"
                  onChange={() => { setSrs(allowedSrs.EPSG8395) }}
                />{' '}
                <FormattedMessage id="srs8395" defaultMessage={defaultMessages.srs8395} />
              </Label>
              <Label centric className='esri-measurement-selectsrs-radio'>
                <Radio
                  checked={srs === allowedSrs.EPSG4326}
                  id="GRAD" value="4326"
                  onChange={() => { setSrs(allowedSrs.EPSG4326) }}
                />{' '}
                <FormattedMessage id="srs4326" defaultMessage={defaultMessages.srs4326} />
              </Label>
              <Label centric className='esri-measurement-selectsrs-radio'>
                <Radio
                  checked={srs === allowedSrs.EPSG0}
                  id="DMS" value="0"
                  onChange={() => { setSrs(allowedSrs.EPSG0) }}
                />{' '}
                <FormattedMessage id="srs0" defaultMessage={defaultMessages.srs0} />
              </Label>
            </div>
          </div>}

          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={onActiveViewChange} />
        </div>
  )
}
