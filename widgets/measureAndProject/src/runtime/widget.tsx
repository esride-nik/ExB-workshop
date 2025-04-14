import { React, type AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import { useEffect, useRef, useState } from 'react'
import Measurement from '@arcgis/core/widgets/Measurement.js'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js'

import './measureAndProject.css'

export default function (props: AllWidgetProps<unknown>) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [measurementWidget, setMeasurementWidget] = useState<Measurement>(undefined)
  const [linearUnit, setLinearUnit] = useState<__esri.SystemOrLengthUnit>(undefined)
  const [areaUnit, setAreaUnit] = useState<__esri.SystemOrAreaUnit>(undefined)
  const [activeTool, setActiveTool] = useState<string>(undefined)
  const measurementWidgetNode = useRef(null)

  useEffect(() => {
    if (jimuMapView) {
      const measurement = new Measurement({
        view: jimuMapView.view,
        // activeWidget: 'distance',
        container: measurementWidgetNode.current
      })
      setMeasurementWidget(measurement)
      setLinearUnit(measurement.linearUnit)
      setAreaUnit(measurement.areaUnit)
    }
  }, [jimuMapView])

  useEffect(() => {
    if (measurementWidget) {
      setLinearUnit(measurementWidget.linearUnit)
      setAreaUnit(measurementWidget.areaUnit)

      // TODO: needed?
      reactiveUtils.watch(() => measurementWidget.activeTool, (newValue: any) => {
        setActiveTool(newValue)
      })
    }
  }, [measurementWidget])

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
                }
              }}
            ></button>
          </div>

          <div id="measurementWidget" ref={measurementWidgetNode} />

          <div id="selectsrs" style={{ visibility: 'hidden' }}>
            <div style={{ marginLeft: '30px' }}>
              <input type="radio" id="LS310" name="etrs" value="25832" checked />
              <label id="LS310_Label" htmlFor="LS310">LS310 in Meter (ETRS 89)</label><br />
              <input type="radio" id="LS320" name="etrs" value="8395" />
              <label id="LS320_Label" htmlFor="LS320"> LS320 in Meter (nur gültig in Hamburg)</label><br />
              <input type="radio" id="GRAD" name="etrs" value="4326" />
              <label htmlFor="GRAD"> Dezimalgrad</label><br />
              <input type="radio" id="DMS" name="etrs" value="0" />
              <label htmlFor="DMS"> Grad, Minute, Sekunde</label>
            </div>
          </div>

          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={onActiveViewChange} />
        </div>
  )
}
