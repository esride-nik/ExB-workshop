import { React, type AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import { useState } from 'react'

export default function (props: AllWidgetProps<unknown>) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)

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
        <div
            className="widget-measure-and-project"
            style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>

            <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={onActiveViewChange} />
        </div>
  )
}
