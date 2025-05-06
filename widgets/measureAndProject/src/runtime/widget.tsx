import { React, type AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Radio } from 'jimu-ui'
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
  const measurementWidgetNode = useRef(null)
  const measurementPositionNode = useRef(null)

  useEffect(() => {
    projection.load()
    coordinateFormatter.load()
  }, [])

  useEffect(() => {
    if (jimuMapView) {
      const measurement = new Measurement({
        view: jimuMapView.view,
        container: measurementWidgetNode.current
      })
      setMeasurementWidget(measurement)

      jimuMapView.view.on('pointer-move', (event: any) => {
        const mouseMapPoint = jimuMapView.view.toMap({
          x: event.x,
          y: event.y
        })
        setMouseMapPoint(mouseMapPoint)
      })

      // in case of lost WebGL context
      reactiveUtils.when(
        () => jimuMapView.view.fatalError,
        () => { jimuMapView.view.tryFatalErrorRecovery() }
      )
    }
  }, [jimuMapView])

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
            <button
              id="distance"
              className="esri-widget--button esri-interactive esri-icon-measure-line"
              title={defaultMessages.distanceMeasurementTool}
              onClick={() => {
                if (measurementWidget) {
                  measurementWidget.clear()
                  measurementWidget.activeTool = 'distance'
                  setActiveTool('distance')
                  measurementWidget.viewModel.watch('state', (state: string) => {
                    if (state === 'measuring') {
                      // TODO: Question: the WAB widget had a dropdown to select km/m => the ExB widget shows meters < 3000m and km above. is this whole effort even necessary?
                      // TODO: extract to function
                      (measurementWidget.viewModel.activeViewModel as any).watch('measurement', (m: string) => {
                        if (!document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] || !m) return

                        const element = document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] as HTMLElement
                        let duplicate
                        if (!document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value-rounded')[0]) {
                          duplicate = element.cloneNode(true) as HTMLElement
                          duplicate.className = 'esri-measurement-widget-content__measurement-item__value-rounded'
                          element.parentNode.insertBefore(duplicate, element.nextSibling)
                        } else {
                          duplicate = document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value-rounded')[0] as HTMLElement
                        }

                        const mRound = (Math.round(m.length * 2) / 2)
                        const measurementInnerText = element.innerText
                        const measurementParts = measurementInnerText.split(/ /)
                        measurementParts[0] = measurementParts[1] === 'km' ? (mRound / 1000).toFixed(2) : mRound.toFixed(1)
                        duplicate.innerText = measurementParts.join(' ')
                      })
                    } else if (state === 'measured') {
                      // TODO: rounded result has been calculated in "measuring" => correct here
                      const measurementInnerText = (document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] as HTMLElement)?.innerText
                      const measurementParts = measurementInnerText.split(/ /)
                      const measurementValue = parseFloat(measurementParts[0])
                      const measurementValueRound = (Math.round(measurementValue * 2) / 2).toFixed(1)
                      measurementParts[0] = measurementValueRound;
                      (document.getElementsByClassName('esri-measurement-widget-content__measurement-item__value')[0] as HTMLElement).innerText = measurementParts.join(' ')
                    } else {
                      console.log('distance ' + measurementWidget.viewModel.state, document.getElementsByClassName('esri-measurement-widget-content__measurement'))
                    }
                  })
                }
              }}
            ></button>
            <button
              id="area"
              className="esri-widget--button esri-interactive esri-icon-measure-area"
              title={defaultMessages.areaMeasurementTool}
              onClick={() => {
                if (measurementWidget) {
                  measurementWidget.clear()
                  measurementWidget.activeTool = 'area'
                  setActiveTool('area')
                  console.log('area', document.getElementsByClassName('esri-measurement-widget-content__measurement'))
                  // TODO: round result
                }
              }}
            ></button>
            <button
              id="position"
              className="esri-widget--button esri-interactive esri-icon-map-pin"
              title={defaultMessages.positionTool}
              onClick={() => {
                if (measurementWidget) {
                  measurementWidget.clear()
                  measurementWidget.activeTool = undefined
                  setActiveTool('position')
                  console.log('position', document.getElementsByClassName('esri-measurement-widget-content__measurement'))
                  // TODO: draw point on GraphicsLayer on click event
                }
              }}
            ></button>
            <button
              id="clear"
              className="esri-widget--button esri-interactive esri-icon-trash"
              title={defaultMessages.clearMeasurements}
              onClick={() => {
                if (measurementWidget) {
                  measurementWidget.clear()
                  setActiveTool('none')
                }
              }}
            ></button>
          </div>

          <div id="measurementWidget" ref={measurementWidgetNode} />
          { activeTool === 'position' && <div id="measurementPosition" className="esri-widget esri-component esri-measurement-position" ref={measurementPositionNode}>
            <div id="markerLatitude" className="esri-measurement-position-number">
              <h5><FormattedMessage id="latitude" defaultMessage={defaultMessages.latitude} /></h5>
              <p>{
              srs === allowedSrs.EPSG4326 // decimal degrees
                ? formatPointAsDecimalDegrees(mouseMapPoint)?.y.toFixed(2)
                : srs === allowedSrs.EPSG25832 // LS310
                  ? projectPoint(mouseMapPoint, allowedSrs.EPSG25832)?.y.toFixed(2)
                  : srs === allowedSrs.EPSG8395 // LS320
                    ? projectPoint(mouseMapPoint, allowedSrs.EPSG8395)?.y.toFixed(2)
                    : formatPointAsDms(mouseMapPoint)?.split('N')[0]?.concat('N') // degrees minutes seconds
                }</p>
            </div>
            <div id="markerLongitude" className="esri-measurement-position-number">
              <h5><FormattedMessage id="longitude" defaultMessage={defaultMessages.longitude} /></h5>
              <p>{
              srs === allowedSrs.EPSG4326 // decimal degrees
                ? formatPointAsDecimalDegrees(mouseMapPoint)?.x.toFixed(2)
                : srs === allowedSrs.EPSG25832 // LS310
                  ? projectPoint(mouseMapPoint, allowedSrs.EPSG25832)?.x.toFixed(2)
                  : srs === allowedSrs.EPSG8395 // LS320
                    ? `3${projectPoint(mouseMapPoint, allowedSrs.EPSG8395)?.x.toFixed(2)}`
                    : formatPointAsDms(mouseMapPoint)?.split('N ')[1] // degrees minutes seconds
                }</p>
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
