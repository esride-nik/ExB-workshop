/**
  Licensing

  Copyright 2022 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'

import LineOfSight from 'esri/widgets/LineOfSight'
// import LineOfSightViewModel from 'esri/widgets/LineOfSight/LineOfSightViewModel'

import defaultMessages from './translations/default'

const { useState, useRef, useEffect } = React

export default function ({
  useMapWidgetIds
}: AllWidgetProps<{}>) {
  const apiWidgetContainer = useRef<HTMLDivElement>()

  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [losWidget, setLosWidget] = useState<LineOfSight>(null)

  useEffect(() => {
    if (jimuMapView && apiWidgetContainer.current) {
      if (!losWidget) {
        // since the widget replaces the container, we must create a new DOM node
        // so when we destroy we will not remove the "ref" DOM node
        const container = document.createElement('div')
        apiWidgetContainer.current.appendChild(container)

        const lineOfSight = new LineOfSight({
          view: jimuMapView.view as __esri.SceneView,
          container: container
        })
        setLosWidget(lineOfSight)
      }

      // const vm = new LineOfSightViewModel({
      //   view: jimuMapView.view as __esri.SceneView
      // })
    }

    return () => {
      if (losWidget) {
        losWidget.destroy()
        setLosWidget(null)
      }
    }
  }, [apiWidgetContainer, jimuMapView])

  const onActiveViewChange = (jmv: JimuMapView) => {
    if (jimuMapView && losWidget) {
      // we have a "previous" map where we added the widget
      // (ex: case where two Maps in single Experience page and user is switching
      // between them in the Settings) - we must destroy the old widget in this case.
      losWidget.destroy()
      setLosWidget(null)
    }

    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  const isConfigured = useMapWidgetIds && useMapWidgetIds.length === 1

  return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    {!isConfigured && <h3><FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} /></h3>}
    <h3>
      <FormattedMessage id="widgetDemonstrates" defaultMessage={defaultMessages.widgetDemonstrates} />
    </h3>

    <JimuMapViewComponent
      useMapWidgetId={useMapWidgetIds?.[0]}
      onActiveViewChange={onActiveViewChange}
    />

    <hr />
    <h4><FormattedMessage id="thisUsesViewModel" defaultMessage={defaultMessages.thisUsesViewModel} /></h4>
    {/* <div>
      <FormattedMessage id="layerTitle" defaultMessage={defaultMessages.layerTitle} />: {layerInfo && layerInfo.title}
    </div> */}

    <hr />

    <h4><FormattedMessage id="thisShowsLegendWidget" defaultMessage={defaultMessages.thisShowsLegendWidget} /></h4>
    <div ref={apiWidgetContainer} />
  </div>
}
