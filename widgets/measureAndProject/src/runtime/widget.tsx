import { React, type AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Radio, Button } from 'jimu-ui'
import defaultMessages from './translations/default'
import { useEffect, useRef, useState } from 'react'
import Measurement from '@arcgis/core/widgets/Measurement.js'
import * as projection from '@arcgis/core/geometry/projection.js'
import { SpatialReference, type Point } from 'esri/geometry'
import * as reactiveUtils from 'esri/core/reactiveUtils.js'
import Graphic from 'esri/Graphic'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import * as coordinateFormatter from '@arcgis/core/geometry/coordinateFormatter.js'
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils.js'

import './measureAndProject.css'
import positionPointSymbol from './positionPointSymbol'

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
  const [clickPoint, setClickPoint] = useState<Point>(undefined)
  const [activeTool, setActiveTool] = useState<string>(undefined)
  const [srs, setSrs] = useState<allowedSrs>(25832)
  const [distanceAreaTextGraphicsLayer, setDistanceAreaTextGraphicsLayer] = useState<GraphicsLayer>(undefined)
  const [positionPointGraphicsLayer, setPositionPointGraphicsLayer] = useState<GraphicsLayer>(undefined)
  const [roundedValueString, setRoundedValueString] = useState<string>('')
  const measurementWidgetNode = useRef(null)
  const measurementPositionNode = useRef(null)
  const originalMeasurementResultNode = useRef(null)
  const duplicateMeasurementResultNode = useRef(null)

  useEffect(() => {
    projection.load()
    coordinateFormatter.load()
  }, [])

  // TODO: text symbol switches back to original value when the map is clicked. Find a solution!
  // // when the roundedValueString updates, update the measurement display on the map
  // useEffect(() => {
  //   if (!measurementPointGraphicsLayer || !jimuMapView) return

  //   // TODO: text symbol switches back to original value when the map is clicked. But all of these event handlers don't do the trick. What's the event?
  //   // jimuMapView.view.on('click', () => {
  //   //   updateMeasurementValueOnMap()
  //   // })
  //   // jimuMapView.view.on('pointer-down', () => {
  //   //   updateMeasurementValueOnMap()
  //   // })
  //   // jimuMapView.view.on('pointer-up', () => {
  //   //   updateMeasurementValueOnMap()
  //   // })
  // }, [jimuMapView, measurementPointGraphicsLayer])

  // when the roundedValueString updates, update the measurement display on the map
  useEffect(() => {
    updateMeasurementValueOnMap()
  }, [distanceAreaTextGraphicsLayer, roundedValueString])

  // when the roundedValueString updates, update the measurement display in the widget
  useEffect(() => {
    if (!duplicateMeasurementResultNode?.current) return
    duplicateMeasurementResultNode.current.innerText = roundedValueString
  }, [duplicateMeasurementResultNode, roundedValueString])

  // setup watchers for display updates and value rounding
  useEffect(() => {
    if (!measurementWidget) return

    measurementWidget.viewModel.watch('state', async (state: string) => {
      // reset stuff when starting / restarting measurement
      if (state === 'ready') {
        // reset node ref when starting new workflow to recreate result box after it's been removed
        originalMeasurementResultNode.current = undefined
        duplicateMeasurementResultNode.current = undefined

        // Get the measurementLayer from the activeWidget, as soon as a tool is activated. The measurementLayer is needed to hide the point graphic with text symbol that contains the original (un-rounded) measurement value.
        const tool = (measurementWidget.viewModel.activeViewModel as any).tool
        const measurementLayer = tool._measurementLayer as GraphicsLayer
        setDistanceAreaTextGraphicsLayer(measurementLayer)
      }

      // observe and round value while measuring
      if ((measurementWidget.activeTool === 'distance' || measurementWidget.activeTool === 'area') && state === 'measuring') {
        (measurementWidget.viewModel.activeViewModel as any).watch('measurement', (m: any) => {
          if (!originalMeasurementResultNode?.current || !m) return

          // TODO: this is going to be configurable by Settings
          // no need to distinguish by unit: m.length always contains meters, although the widget automatically displays km if m > 3000
          const mRound = measurementWidget.activeTool === 'distance' ? (Math.round(m.length * 2) / 2) : (Math.round(m.area * 2) / 2)
          const measurementInnerText = originalMeasurementResultNode?.current?.innerText
          const measurementParts = measurementInnerText.split(/ /)

          const roundedValueString = measurementWidget.activeTool === 'distance'
            ? formatMeasurementStringDistance(measurementParts, mRound)
            : formatMeasurementStringArea(measurementParts, mRound)
          setRoundedValueString(roundedValueString)
        })
      }
    })
  }, [measurementWidget])

  useEffect(() => {
    if (!clickPoint || !positionPointGraphicsLayer) return
    if (activeTool === 'position') {
      positionPointGraphicsLayer.removeAll()
      const positionPointGraphic = new Graphic({
        geometry: clickPoint,
        symbol: positionPointSymbol
      })
      positionPointGraphicsLayer.add(positionPointGraphic)
    }
  }, [activeTool, clickPoint, positionPointGraphicsLayer])

  // when jimuMapView is available, initialize the measurement widget and setup mouse position tracking
  useEffect(() => {
    if (jimuMapView) {
      // init Measurement widget
      const measurement = new Measurement({
        view: jimuMapView.view,
        container: measurementWidgetNode.current
      })
      setMeasurementWidget(measurement)

      // add GraphicsLayer for position tool
      const positionPointGraphicsLayer = new GraphicsLayer({
        id: 'measurementPointGraphicsLayer',
        title: 'Measurement Point Graphics Layer',
        listMode: 'hide'
      })
      jimuMapView.view.map.add(positionPointGraphicsLayer)
      setPositionPointGraphicsLayer(positionPointGraphicsLayer)

      // get current mouse position on map as map coordinates
      jimuMapView.view.on('pointer-move', (event: __esri.ViewPointerMoveEvent) => {
        fillMeasurementResultNodeRefs()
        const mouseMapPoint = jimuMapView.view.toMap({
          x: event.x,
          y: event.y
        })
        setMouseMapPoint(mouseMapPoint)
      })

      // get click position as map coordinates. To be used by position tool.
      jimuMapView.view.on('click', (event: __esri.ViewClickEvent) => {
        const clickPoint = jimuMapView.view.toMap({
          x: event.x,
          y: event.y
        })
        setClickPoint(clickPoint)
      })

      // in case of lost WebGL context
      reactiveUtils.when(
        () => jimuMapView.view.fatalError,
        () => { jimuMapView.view.tryFatalErrorRecovery() }
      )
    }
  }, [jimuMapView])

  // exchange the map graphic with the original value with a clone that contains the rounded value
  const updateMeasurementValueOnMap = () => {
    if (!distanceAreaTextGraphicsLayer || distanceAreaTextGraphicsLayer.graphics.length === 0) return

    // get the text graphic from the layer on every value update because it also affects the graphic position
    const measurementPointGraphics = distanceAreaTextGraphicsLayer.graphics.toArray().filter((g: Graphic) => g.geometry.type === 'point')
    if (measurementPointGraphics.length === 0) return
    const measurementPointGraphic = measurementPointGraphics[0]

    // make a deep copy of the graphic before changing the symbol of the original one
    const roundedMeasurementPointGraphic = measurementPointGraphic.clone();
    (roundedMeasurementPointGraphic.symbol as __esri.TextSymbol).text = roundedValueString

    // remove original graphic and add the rounded one
    distanceAreaTextGraphicsLayer.remove(measurementPointGraphic)
    distanceAreaTextGraphicsLayer.add(roundedMeasurementPointGraphic)
  }

  // get the original measurement display node and create a duplicate to show the rounded value. We're not using the original node because this would cause a flicker effect.
  const fillMeasurementResultNodeRefs = () => {
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

  // catching the map view from settings
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

  const getFormattedLatitude = (point: Point): string => {
    return srs === allowedSrs.EPSG4326 // decimal degrees
      ? formatPointAsDecimalDegrees(point)?.y.toFixed(2)
      : srs === allowedSrs.EPSG25832 // LS310
        ? projectPoint(point, allowedSrs.EPSG25832)?.y.toFixed(2)
        : srs === allowedSrs.EPSG8395 // LS320
          ? projectPoint(point, allowedSrs.EPSG8395)?.y.toFixed(2)
          : getDmsLatitude(point) // degrees minutes seconds latitude
  }

  const getFormattedLongitude = (point: Point): string => {
    return srs === allowedSrs.EPSG4326 // decimal degrees
      ? formatPointAsDecimalDegrees(point)?.x.toFixed(2)
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

  const formatMeasurementStringDistance = (measurementParts: any, mRound: number): string => {
    if (measurementParts[1] === 'm') {
      const numberFormat = new Intl.NumberFormat(props.locale, { style: 'unit', unit: 'meter', minimumFractionDigits: 1 }) // format as meters including the unit (because it's in the standard) in local number format
      measurementParts[0] = numberFormat.format(mRound)
      delete measurementParts[1] // remove the unit
    }
    return measurementParts.join(' ')
  }

  const formatMeasurementStringArea = (measurementParts: any, mRound: number): string => {
    if (measurementParts[1] === 'm²') {
      const numberFormat = new Intl.NumberFormat(props.locale, { style: 'decimal', minimumFractionDigits: 1 }) // format as decimal in local number format
      measurementParts[0] = numberFormat.format(mRound)
    }
    return measurementParts.join(' ')
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
                  originalMeasurementResultNode.current = undefined
                  measurementWidget.activeTool = 'distance'
                  setActiveTool('distance')
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
                  originalMeasurementResultNode.current = undefined
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
                  originalMeasurementResultNode.current = undefined
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
                  originalMeasurementResultNode.current = undefined
                  measurementWidget.activeTool = undefined
                  setActiveTool('none')
                }
              }}
            ></Button>
          </div>

          <div id="measurementWidget" ref={measurementWidgetNode} />
          { // this whole block implements the Position tool
          activeTool === 'position' && <div id="positionTool" className="esri-widget esri-component esri-measurement-position" ref={measurementPositionNode}>
            <div id="coordinates">
              <div id="coordinateIcon" className="esri-measurement-position-coordinate-icon">
                <h5></h5>
                <p><calcite-icon icon="arrow-bold-left" class="coordinate-icon-mouse" /></p>
                {clickPoint && <p><calcite-icon icon="pin-tear-f" class="coordinate-icon-position" /></p>}
              </div>
              <div id="latitude" className="esri-measurement-position-coordinate">
                <h5><FormattedMessage id="latitude" defaultMessage={defaultMessages.latitude} /></h5>
                <p>{getFormattedLatitude(mouseMapPoint)}</p>
                {clickPoint && <p>{getFormattedLatitude(clickPoint)}</p>}
              </div>
              <div id="longitude" className="esri-measurement-position-coordinate">
                <h5><FormattedMessage id="longitude" defaultMessage={defaultMessages.longitude} /></h5>
                <p>{getFormattedLongitude(mouseMapPoint)}</p>
                {clickPoint && <p>{getFormattedLongitude(clickPoint)}</p>}
              </div>
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
