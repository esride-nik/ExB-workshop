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

// import ActiveLayerInfo from 'esri/widgets/Legend/support/ActiveLayerInfo'

import defaultMessages from './translations/default'
import Sketch from 'esri/widgets/Sketch'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import geometryEngine from 'esri/geometry/geometryEngine'
import Graphic from 'esri/Graphic'
import { Polygon } from 'esri/geometry'
import { SimpleFillSymbol } from 'esri/symbols'

const { useState, useRef, useEffect } = React

export default function ({
  useMapWidgetIds
}: AllWidgetProps<{}>) {
  const apiWidgetContainer = useRef<HTMLDivElement>()

  // const [layerInfo, setLayerInfo] = useState<ActiveLayerInfo>(null)
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [sketchWidget, setSketchWidget] = useState<Sketch>(null)

  const sketchGraphicsLayer = new GraphicsLayer({ id: 'sketchGraphicsLayer' })

  useEffect(() => {
    if (jimuMapView && apiWidgetContainer.current) {
      if (!sketchWidget) {
        const container = document.createElement('div')
        apiWidgetContainer.current.appendChild(container)

        const sketch = new Sketch({
          layer: sketchGraphicsLayer,
          view: jimuMapView.view,
          container: container,
          // graphic will be selected as soon as it is created
          creationMode: 'update',
          availableCreateTools: ['point', 'polyline'],
          visibleElements: {
            undoRedoMenu: false,
            selectionTools: {
              'lasso-selection': false,
              'rectangle-selection': false
            },
            settingsMenu: false,
            snappingControls: false
          }
        })

        sketch.on('create', (evt: __esri.SketchCreateEvent) => {
          if (evt.state === 'complete') {
            console.log('CREATE', evt)
            const bufferGeometry = geometryEngine.geodesicBuffer(evt.graphic.geometry, 50, 'meters', true) as Polygon
            const bufferGraphic = new Graphic({
              geometry: bufferGeometry,
              symbol: {
                type: 'simple-fill',
                color: [51, 51, 204, 0.4],
                style: 'solid',
                outline: {
                  color: 'white',
                  width: 1
                }
              } as unknown as SimpleFillSymbol
            })
            sketchGraphicsLayer.add(bufferGraphic)
          }
        })

        sketch.on('update', (evt: __esri.SketchCreateEvent) => {
          console.log('UPDATE', evt)
        })

        jimuMapView.view.map.add(sketchGraphicsLayer)

        // jimuMapView.view.ui.add(sketch, 'top-right')
      }

      return () => {
        if (sketchWidget) {
          sketchWidget.destroy()
          setSketchWidget(null)
        }
      }
    }
  }, [apiWidgetContainer, jimuMapView, sketchWidget])

  const onActiveViewChange = (jmv: JimuMapView) => {
    if (jimuMapView && sketchWidget) {
      // we have a "previous" map where we added the widget
      // (ex: case where two Maps in single Experience page and user is switching
      // between them in the Settings) - we must destroy the old widget in this case.
      sketchWidget.destroy()
      setSketchWidget(null)
    }

    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  const isConfigured = useMapWidgetIds && useMapWidgetIds.length === 1

  return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    {!isConfigured && <h3><FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} /></h3>}

    <JimuMapViewComponent
      useMapWidgetId={useMapWidgetIds?.[0]}
      onActiveViewChange={onActiveViewChange}
    />

    <div ref={apiWidgetContainer} />
  </div>
}
