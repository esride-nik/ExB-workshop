import { React, AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import { Point } from 'esri/geometry'
import Graphic from 'esri/Graphic'
import LineOfSight from 'esri/widgets/LineOfSight'
import LineOfSightTarget from 'esri/widgets/LineOfSight/LineOfSightTarget'

const { useState, useRef, useEffect } = React

export default function Widget (props: AllWidgetProps<{}>) {
  const apiWidgetContainer = useRef<HTMLDivElement>()
  let features: Graphic[] = []

  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [losWidget, setLosWidget] = useState<LineOfSight>(null)

  const setIntersectionMarkers = (lineOfSightWidget: LineOfSight) => {
    // an inverted cone marks the intersection that occludes the view
    const intersectionSymbol = {
      type: 'point-3d',
      symbolLayers: [{
        type: 'object',
        resource: { primitive: 'inverted-cone' },
        material: { color: [255, 100, 100] },
        height: 10,
        depth: 10,
        width: 10,
        anchor: 'relative',
        anchorPosition: { x: 0, y: 0, z: -0.7 }
      }]
    }
    jimuMapView.view.graphics.removeAll()
    lineOfSightWidget.viewModel?.targets.forEach((target) => {
      if (target.intersectedLocation) {
        const graphic = new Graphic({
          symbol: intersectionSymbol as __esri.SymbolProperties,
          geometry: target.intersectedLocation
        })
        jimuMapView.view.graphics.add(graphic)
      }
    })
  }

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

        // watch when observer location changes
        lineOfSight.viewModel.watch('observer', () => {
          setIntersectionMarkers(lineOfSight)
        })

        // watch when a new target is added or removed
        lineOfSight.viewModel.targets.on('change', (event) => {
          event.added.forEach((target) => {
            setIntersectionMarkers(lineOfSight)
            // for each target watch when the intersection changes
            target.watch('intersectedLocation', setIntersectionMarkers)
          })
          event.removed.forEach(() => {
            // remove intersection markers for removed targets (remove with right click on target)
            setIntersectionMarkers(lineOfSight)
          })
        })
      }
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

  const isConfigured = props.useMapWidgetIds && props.useMapWidgetIds.length === 1

  features = props?.mutableStateProps?.results?.features
  if (features?.length > 0) {
    const observerPoint = features[0].geometry as Point
    // observerPoint.z -= 100
    losWidget.viewModel.observer = observerPoint
    losWidget.viewModel.targets.addMany(features.map((f: Graphic) => {
      return {
        location: f.geometry as Point
      } as unknown as LineOfSightTarget
    }))
  }

  return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    {!isConfigured && <h3><FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} /></h3>}
    <h3>
      <FormattedMessage id="widgetDemonstrates" defaultMessage={defaultMessages.widgetDemonstrates} />
    </h3>

    <JimuMapViewComponent
      useMapWidgetId={props.useMapWidgetIds?.[0]}
      onActiveViewChange={onActiveViewChange}
    />

    <div ref={apiWidgetContainer} />
  </div>
}
