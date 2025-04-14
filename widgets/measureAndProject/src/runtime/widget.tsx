import { React, type AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import { useEffect, useRef, useState } from 'react'
import Measurement from '@arcgis/core/widgets/Measurement.js'
import { type Point } from 'esri/geometry'

import './measureAndProject.css'
import { Label, Radio } from 'jimu-ui'

enum allowedSrs {
  EPSG25832 = 25832,
  EPSG8395 = 8395,
  EPSG4326 = 4326,
  EPSG0 = 0
}

export default function (props: AllWidgetProps<unknown>) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [measurementWidget, setMeasurementWidget] = useState<Measurement>(undefined)
  const [screenPoint, setScreenPoint] = useState<Point>(undefined)
  const [activeTool, setActiveTool] = useState<string>(undefined)
  const [srs, setSrs] = useState<allowedSrs>(25832)
  const measurementWidgetNode = useRef(null)
  const measurementPositionNode = useRef(null)

  useEffect(() => {
    if (jimuMapView) {
      const measurement = new Measurement({
        view: jimuMapView.view,
        container: measurementWidgetNode.current
      })
      setMeasurementWidget(measurement)

      jimuMapView.view.on('pointer-move', (event: any) => {
        const screenPoint = jimuMapView.view.toMap({
          x: event.x,
          y: event.y
        })
        setScreenPoint(screenPoint)
      })
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
                }
              }}
            ></button>
            <button
              id="area"
              className="esri-widget--button esri-interactive esri-icon-map-pin"
              title={defaultMessages.positionTool}
              onClick={() => {
                if (measurementWidget) {
                  measurementWidget.clear()
                  measurementWidget.activeTool = undefined
                  setActiveTool('position')
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
              srs === allowedSrs.EPSG4326
                ? screenPoint?.latitude.toFixed(2)
                : srs === allowedSrs.EPSG25832
                  ? 'IMPLEMENT PROJECTION'
                  : 'IMPLEMENT'}</p>
            </div>
            <div id="markerLongitude" className="esri-measurement-position-number">
              <h5><FormattedMessage id="longitude" defaultMessage={defaultMessages.longitude} /></h5>
              <p>{
              srs === allowedSrs.EPSG4326
                ? screenPoint?.longitude.toFixed(2)
                : srs === allowedSrs.EPSG25832
                  ? 'IMPLEMENT PROJECTION'
                  : 'IMPLEMENT'}</p>
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
