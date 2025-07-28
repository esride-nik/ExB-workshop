import { React, type AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Radio, Button } from 'jimu-ui'
import defaultMessages from './translations/default'
import { useEffect, useRef, useState } from 'react'
import Measurement from '@arcgis/core/widgets/Measurement.js'
import * as projection from '@arcgis/core/geometry/projection.js'
import * as reactiveUtils from 'esri/core/reactiveUtils.js'
import Graphic from 'esri/Graphic'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import * as coordinateFormatter from '@arcgis/core/geometry/coordinateFormatter.js'
import locationPointSymbol from './locationPointSymbol'
import { MeterValueOption } from '../config'
import { allowedSrs, formatMeasurementStringArea, formatMeasurementStringDistance, getFormattedLatitude, getFormattedLongitude } from './measureAndProjectUtils'
import { type Point } from 'esri/geometry'

import './measureAndProject.css'

interface MeasurementValue {
  length: number
  perimeter: number
  area: number
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
  const [customMeasurementGraphicsLayer, setCustomMeasurementGraphicsLayer] = useState<GraphicsLayer>(undefined)
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
    const roundedLengthString = formatMeasurementStringDistance(mLengthRound, fractionDigits, props.locale)
    setRoundedLengthString(roundedLengthString)
    if (measurementWidget.activeTool === 'area') {
      const roundedAreaString = formatMeasurementStringArea(mAreaRound, fractionDigits, props.locale)
      setRoundedAreaString(roundedAreaString)
    }
  }, [measurementValue])

  // update the measurement display in the widget
  useEffect(() => {
    if (!duplicateLengthResultNode?.current) return
    duplicateLengthResultNode.current.innerText = roundedLengthString
  }, [duplicateLengthResultNode, roundedLengthString])

  useEffect(() => {
    if (!duplicateAreaResultNode?.current) return
    duplicateAreaResultNode.current.innerText = roundedAreaString
  }, [duplicateAreaResultNode, roundedAreaString])

  // react to clickPoint change:
  // location tool: draw point
  // TODO Other tools: draw measurement graphics
  useEffect(() => {
    if (!clickPoint || !customMeasurementGraphicsLayer) return
    if (activeTool === 'location') {
      customMeasurementGraphicsLayer.removeAll()
      const locationPointGraphic = new Graphic({
        geometry: clickPoint,
        symbol: locationPointSymbol
      })
      customMeasurementGraphicsLayer.add(locationPointGraphic)
    }
  }, [activeTool, clickPoint, customMeasurementGraphicsLayer])

  // when state and active tool change:
  // reset the measurement widget and related variables
  // sync measurement value, mouse position and click point to React state
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
      measurementLayer.visible = false
    }
  }, [activeTool, measurementWidgetState])

  // when jimuMapView is available:
  // initialize the measurement widget
  // sync measurementWidget state to React state
  // setup mouse position tracking
  // add GraphicsLayer for custom graphics
  useEffect(() => {
    if (jimuMapView) {
      // init Measurement widget
      const measurement = new Measurement({
        view: jimuMapView.view,
        container: measurementWidgetNode.current,
        linearUnit: 'meters',
        areaUnit: 'square-meters'
      })
      // sync measurementWidget state to React state
      measurement.when(() => {
        reactiveUtils.watch(
          () => measurement.viewModel.state,
          () => {
            setMeasurementWidgetState(measurement.viewModel.state)
          }
        )

        // sync measurement value to React state.
        // It's okay to do this right in the beginning, even if no viewModel is active at the start. The watcher will work when it becomes active and measurement values are being updated.
        reactiveUtils.watch(
          () => measurement?.viewModel?.activeViewModel?.measurement,
          () => {
            setMeasurementValue(measurement?.viewModel?.activeViewModel?.measurement as unknown as MeasurementValue)
          }
        )
      })
      setMeasurementWidget(measurement)

      // sync mouse position to React state
      jimuMapView.view.on('pointer-move', (event: __esri.ViewPointerMoveEvent) => {
        const mouseMapPoint = jimuMapView.view.toMap({
          x: event.x,
          y: event.y
        })
        setMouseMapPoint(mouseMapPoint)
      })

      // sync click point to React state
      jimuMapView.view.on('click', (event: __esri.ViewClickEvent) => {
        const clickPoint = jimuMapView.view.toMap({
          x: event.x,
          y: event.y
        })
        setClickPoint(clickPoint)
      })

      // add GraphicsLayer for custom graphics
      const customMeasurementGraphics = new GraphicsLayer({
        id: 'customMeasurementGraphics',
        title: 'Custom measurement GraphicsLayer',
        listMode: 'hide'
      })
      jimuMapView.view.map.add(customMeasurementGraphics)
      setCustomMeasurementGraphicsLayer(customMeasurementGraphics)

      // in case of lost WebGL context
      reactiveUtils.when(
        () => jimuMapView.view.fatalError,
        () => { jimuMapView.view.tryFatalErrorRecovery() }
      )
    }
  }, [jimuMapView])

  // catch the map view from the settings page
  const onActiveViewChange = async (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  // reset the measurement widget and related variables. used when switching tools or clearing measurements.
  const resetMeasurementWidget = () => {
    // remove graphics
    customMeasurementGraphicsLayer?.removeAll()
    measurementWidget.clear()
    // reset DOM refs
    originalLengthResultNode.current = undefined
    originalAreaResultNode.current = undefined
    duplicateLengthResultNode.current = undefined
    duplicateAreaResultNode.current = undefined
  }

  const isConfigured = () => {
    return props.useMapWidgetIds?.length > 0
  }

  if (!isConfigured()) {
    return <h5><FormattedMessage id="cfgDataSources" defaultMessage={defaultMessages.cfgDataSources} /></h5>
  }
  return (
        <div className="widget-measure-and-project"
          style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
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
                  <p>{getFormattedLatitude(srs, mouseMapPoint)}</p>
                  {clickPoint && <p>{getFormattedLatitude(srs, clickPoint)}</p>}
                </div>
                <div id="longitude" className="esri-measurement-location-coordinate">
                  <h5><FormattedMessage id="longitude" defaultMessage={defaultMessages.longitude} /></h5>
                  <p>{getFormattedLongitude(srs, mouseMapPoint)}</p>
                  {clickPoint && <p>{getFormattedLongitude(srs, clickPoint)}</p>}
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
