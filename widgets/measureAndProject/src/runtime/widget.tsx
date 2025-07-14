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
import locationPointSymbol from './locationPointSymbol'
import { MeterValueOption } from '../config'

interface MeasurementValue {
  length: number
  perimeter: number
  area: number
}

enum allowedSrs {
  EPSG25832 = 25832,
  EPSG8395 = 8395,
  EPSG4326 = 4326,
  EPSG0 = 0
}

export default function (props: AllWidgetProps<any>): React.JSX.Element {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [measurementWidget, setMeasurementWidget] = useState<Measurement>(undefined)
  const [measurementWidgetState, setMeasurementWidgetState] = useState<string>(undefined)
  const [measurementValue, setMeasurementValue] = useState<MeasurementValue>(undefined)
  const [mouseMapPoint, setMouseMapPoint] = useState<Point>(undefined)
  const [clickPoint, setClickPoint] = useState<Point>(undefined)
  const [activeTool, setActiveTool] = useState<string>(undefined)
  const [srs, setSrs] = useState<allowedSrs>(25832)
  const [distanceAreaTextGraphicsLayer, setDistanceAreaTextGraphicsLayer] = useState<GraphicsLayer>(undefined)
  const [locationPointGraphicsLayer, setLocationPointGraphicsLayer] = useState<GraphicsLayer>(undefined)
  const [roundedLengthString, setRoundedLengthString] = useState<string>('')
  const [roundedAreaString, setRoundedAreaString] = useState<string>('')
  const measurementWidgetNode = useRef(null)
  const measurementLocationNode = useRef(null)
  const originalLengthResultNode = useRef(null)
  const originalAreaResultNode = useRef(null)
  const duplicateLengthResultNode = useRef(null)
  const duplicateAreaResultNode = useRef(null)

  useEffect(() => {
    projection.load()
    coordinateFormatter.load()
  }, [])

  // TODO: text symbol switches back to original value when the map is clicked. Find a solution!
  // // when the roundedValueString updates, update the measurement display on the map
  // useEffect(() => {
  //   if (!measurementPointGraphicsLayer || !jimuMapView) return

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

  useEffect(() => {
    if (!measurementValue) return

    const lengthToolAtPos = activeTool === 'distance' ? 0 : 1

    if (!originalLengthResultNode.current &&
      document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')?.length > lengthToolAtPos &&
      document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[lengthToolAtPos] !== undefined) {
      originalLengthResultNode.current = (document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[lengthToolAtPos] as HTMLElement)
      duplicateLengthResultNode.current = originalLengthResultNode.current.cloneNode(true) as HTMLElement
      duplicateLengthResultNode.current.className = 'esri-measurement-widget-content__measurement-item__value-rounded'
      originalLengthResultNode.current.parentNode.insertBefore(duplicateLengthResultNode.current, originalLengthResultNode.current.nextSibling)
    }
    if (activeTool === 'area' && !originalAreaResultNode.current &&
      document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')?.length > 0 &&
      document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] !== undefined) {
      originalAreaResultNode.current = (document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] as HTMLElement)
      duplicateAreaResultNode.current = originalAreaResultNode.current.cloneNode(true) as HTMLElement
      duplicateAreaResultNode.current.className = 'esri-measurement-widget-content__measurement-item__value-rounded'
      originalAreaResultNode.current.parentNode.insertBefore(duplicateAreaResultNode.current, originalAreaResultNode.current.nextSibling)
    }

    let mLengthRound = activeTool === 'distance' ? measurementValue.length : measurementValue.perimeter
    let mAreaRound = activeTool === 'distance' ? undefined : measurementValue.area
    // decimalPlacesRounded = round the value to 0.0 or 0.5
    if (props.config?.meterValueOption as MeterValueOption === MeterValueOption.decimalPlacesRoundedTo05) {
      // m.length and m.perimeter always contain meters, m.area contains square meters
      mLengthRound = activeTool === 'distance' ? (Math.round(measurementValue.length * 2) / 2) : (Math.round(measurementValue.perimeter * 2) / 2)
      mAreaRound = activeTool === 'distance' ? undefined : (Math.round(measurementValue.area * 2) / 2)
    }

    // round the value and format the string
    const fractionDigits = props.config?.meterValueOption === MeterValueOption.twoDecimalPlaces
      ? 2
      : props.config?.meterValueOption === MeterValueOption.noDecimalPlaces
        ? 0
        : 1 // 1 decimal place decimalPlacesRoundedTo05 and oneDecimalPlace
    const roundedLengthString = formatMeasurementStringDistance(mLengthRound, fractionDigits)
    setRoundedLengthString(roundedLengthString)
    if (measurementWidget.activeTool === 'area') {
      const roundedAreaString = formatMeasurementStringArea(mAreaRound, fractionDigits)
      setRoundedAreaString(roundedAreaString)
    }
  }, [measurementValue])

  // when the roundedValueString updates, update the measurement display on the map
  useEffect(() => {
    // TODO: distinguish for area / remove label
    updateMeasurementValueOnMap()
  }, [distanceAreaTextGraphicsLayer, roundedLengthString])

  // update the measurement display in the widget
  useEffect(() => {
    if (!duplicateLengthResultNode?.current) return
    duplicateLengthResultNode.current.innerText = roundedLengthString
  }, [duplicateLengthResultNode, roundedLengthString])
  useEffect(() => {
    if (!duplicateAreaResultNode?.current) return
    duplicateAreaResultNode.current.innerText = roundedAreaString
  }, [duplicateAreaResultNode, roundedAreaString])

  // get the original measurement display node and create a duplicate to show the rounded value. We're not using the original node because this would cause a flicker effect.
  useEffect(() => {
    // reset stuff when starting / restarting measurement
    if (measurementWidgetState === 'ready') {
      originalLengthResultNode.current = undefined
      originalAreaResultNode.current = undefined
      duplicateLengthResultNode.current = undefined
      duplicateAreaResultNode.current = undefined

      // Get the measurementLayer from the activeWidget, as soon as a tool is activated. The measurementLayer is needed to hide the point graphic with text symbol that contains the original (un-rounded) measurement value.
      const tool = (measurementWidget.viewModel.activeViewModel as any).tool
      const measurementLayer = tool._measurementLayer as GraphicsLayer
      // ToDo: if hiding text is too complicated: hide the whole measurementLayer and draw lines manually
      // measurementLayer.visible = false
      setDistanceAreaTextGraphicsLayer(measurementLayer)
    }

    // observe and round value while measuring
    if (measurementWidgetState === 'measuring' &&
        (activeTool === 'distance' || activeTool === 'area')) {
      (measurementWidget.viewModel.activeViewModel as any).watch('measurement', (m: MeasurementValue) => {
        setMeasurementValue(m)
      })
    }
  }, [activeTool, measurementWidgetState])

  // setup watchers for display updates and value rounding
  useEffect(() => {
    if (!measurementWidget) return

    measurementWidget.viewModel.watch('state', async (state: string) => {
      setMeasurementWidgetState(state)
    })
  }, [measurementWidget])

  useEffect(() => {
    if (!clickPoint || !locationPointGraphicsLayer) return
    if (activeTool === 'location') {
      locationPointGraphicsLayer.removeAll()
      const locationPointGraphic = new Graphic({
        geometry: clickPoint,
        symbol: locationPointSymbol
      })
      locationPointGraphicsLayer.add(locationPointGraphic)
    }
  }, [activeTool, clickPoint, locationPointGraphicsLayer])

  // when jimuMapView is available, initialize the measurement widget and setup mouse position tracking
  useEffect(() => {
    if (jimuMapView) {
      // init Measurement widget
      const measurement = new Measurement({
        view: jimuMapView.view,
        container: measurementWidgetNode.current,
        linearUnit: 'meters',
        areaUnit: 'square-meters'
      })
      setMeasurementWidget(measurement)

      // add GraphicsLayer for location tool
      const locationPointGraphicsLayer = new GraphicsLayer({
        id: 'measurementPointGraphicsLayer',
        title: 'Measurement Point Graphics Layer',
        listMode: 'hide'
      })
      jimuMapView.view.map.add(locationPointGraphicsLayer)
      setLocationPointGraphicsLayer(locationPointGraphicsLayer)

      // get current mouse position on map as map coordinates
      jimuMapView.view.on('pointer-move', (event: __esri.ViewPointerMoveEvent) => {
        const mouseMapPoint = jimuMapView.view.toMap({
          x: event.x,
          y: event.y
        })
        setMouseMapPoint(mouseMapPoint)
      })

      // get click point as map coordinates. To be used by location tool.
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
    (roundedMeasurementPointGraphic.symbol as __esri.TextSymbol).text = roundedLengthString

    // remove original graphic and add the rounded one
    distanceAreaTextGraphicsLayer.remove(measurementPointGraphic)
    distanceAreaTextGraphicsLayer.add(roundedMeasurementPointGraphic)
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

  const getFormattedLatitude = (point: Point): string => {
    return srs === allowedSrs.EPSG4326 // decimal degrees
      ? formatPointAsDecimalDegrees(point)?.y.toFixed(6)
      : srs === allowedSrs.EPSG25832 // LS310
        ? projectPoint(point, allowedSrs.EPSG25832)?.y.toFixed(2)
        : srs === allowedSrs.EPSG8395 // LS320
          ? projectPoint(point, allowedSrs.EPSG8395)?.y.toFixed(2)
          : getDmsLatitude(point) // degrees minutes seconds latitude
  }

  const getFormattedLongitude = (point: Point): string => {
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

  const formatMeasurementStringDistance = (mRound: number, fractionDigits: number): string => {
    mRound = mRound > 3000 ? mRound / 1000 : mRound
    const unit = mRound >= 3 ? 'km' : 'm'
    const numberFormat = new Intl.NumberFormat(props.locale, { style: 'decimal', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }) // format as meters including the unit (because it's in the standard) in local number format
    return `${numberFormat.format(mRound)} ${unit}`
  }

  const formatMeasurementStringArea = (mRound: number, fractionDigits: number): string => {
    mRound = mRound > 3000000 ? mRound / 1000000 : mRound
    const unit = mRound >= 3 ? 'km²' : 'm²'
    const numberFormat = new Intl.NumberFormat(props.locale, { style: 'decimal', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }) // format as decimal in local number format
    return `${numberFormat.format(mRound)} ${unit}`
  }

  const resetMeasurementWidget = () => {
    locationPointGraphicsLayer?.removeAll()
    measurementWidget.clear()
    originalLengthResultNode.current = undefined
    originalAreaResultNode.current = undefined
    duplicateLengthResultNode.current = undefined
    duplicateAreaResultNode.current = undefined
  }

  if (!isConfigured()) {
    return <h5><FormattedMessage id="cfgDataSources" defaultMessage={defaultMessages.cfgDataSources} /></h5>
  }
  return (
        <div className="widget-measure-and-project"
          style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
{measurementWidgetState}
          <div id="toolbarDiv" className="esri-component esri-widget measurement-toolbar">
            { props.config?.distanceMeasurementEnabled &&
              <Button
                id="distance"
                className="esri-widget--button esri-interactive esri-icon-measure-line"
                disabled={activeTool === 'distance'}
                title={defaultMessages.distanceMeasurementTool}
                onClick={() => {
                  if (measurementWidget) {
                    resetMeasurementWidget()
                    measurementWidget.activeTool = 'distance'
                    setActiveTool('distance')
                  }
                }}
              ></Button>
            }
            { props.config?.areaMeasurementEnabled &&
              <Button
                id="area"
                className="esri-widget--button esri-interactive esri-icon-measure-area"
                disabled={activeTool === 'area'}
                title={defaultMessages.areaMeasurementTool}
                onClick={() => {
                  if (measurementWidget) {
                    resetMeasurementWidget()
                    measurementWidget.activeTool = 'area'
                    setActiveTool('area')
                  }
                }}
              ></Button>
            }
            { props.config?.locationMeasurementEnabled &&
              <Button
                id='location'
                className='esri-widget--button esri-interactive esri-icon-map-pin'
                disabled={activeTool === 'location'}
                size="default"
                title={defaultMessages.locationTool}
                onClick={() => {
                  if (activeTool !== 'location' && measurementWidget) {
                    resetMeasurementWidget()
                    measurementWidget.activeTool = undefined
                    setActiveTool('location')
                  }
                }}
              ></Button>
          }
            <Button
              id="clear"
              className="esri-widget--button esri-interactive esri-icon-trash"
              disabled={activeTool === 'none'}
              title={defaultMessages.clearMeasurements}
              onClick={() => {
                if (measurementWidget) {
                  resetMeasurementWidget()
                  measurementWidget.activeTool = undefined
                  setActiveTool('none')
                }
              }}
            ></Button>
          </div>

          <div className="measurement-widget-space">
            <div id="measurementWidget" ref={measurementWidgetNode} />
            { // this whole block implements the Location tool
            activeTool === 'location' && <div id="locationTool" className="esri-widget esri-component esri-measurement-location" ref={measurementLocationNode}>
              <div id="coordinates">
                <div id="coordinateIcon" className="esri-measurement-location-coordinate-icon">
                  <h5></h5>
                  <p><calcite-icon icon="arrow-bold-left" class="coordinate-icon-mouse" /></p>
                  {clickPoint && <p><calcite-icon icon="pin-tear-f" class="coordinate-icon-location" /></p>}
                </div>
                <div id="latitude" className="esri-measurement-location-coordinate">
                  <h5><FormattedMessage id="latitude" defaultMessage={defaultMessages.latitude} /></h5>
                  <p>{getFormattedLatitude(mouseMapPoint)}</p>
                  {clickPoint && <p>{getFormattedLatitude(clickPoint)}</p>}
                </div>
                <div id="longitude" className="esri-measurement-location-coordinate">
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
          </div>

          <div className="text-blocks">
            {props.config?.headerText &&
              <div className="esri-widget esri-component esri-measurement-header">
                {props.config.headerText}
              </div>
            }
            {props.config?.disclaimerText &&
              <div className="esri-widget esri-component esri-measurement-disclaimer-text" style={{ whiteSpace: 'pre-wrap' }}>
                {props.config.disclaimerText}
              </div>
            }
          </div>
          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={onActiveViewChange} />
        </div>
  )
}
