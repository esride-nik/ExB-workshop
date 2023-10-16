import {
  React,
  type AllWidgetProps,
  FormattedMessage,
  type DataSource,
  DataSourceComponent,
  type FeatureLayerQueryParams
} from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView, type FeatureLayerDataSource } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import Sketch from 'esri/widgets/Sketch'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import geometryEngine from 'esri/geometry/geometryEngine'
import Graphic from 'esri/Graphic'
import { type Geometry, type Polygon } from 'esri/geometry'
import { type SimpleFillSymbol } from 'esri/symbols'
import Slider from 'esri/widgets/Slider'
import type FeatureLayerView from 'esri/views/layers/FeatureLayerView'

const { useState, useRef, useEffect } = React

export default function (props: AllWidgetProps<unknown>) {
  const apiSketchWidgetContainer = useRef<HTMLDivElement>()
  const apiSliderWidgetContainer = useRef<HTMLDivElement>()
  const distanceNum = useRef<Slider>()
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [sketchWidget, setSketchWidget] = useState<Sketch>(undefined)
  const [flDataSource, setFlDataSource] = useState<FeatureLayerDataSource>(undefined)
  const queryParams = {
    where: '1=1',
    outFields: ['*'],
    pageSize: 10
  } as FeatureLayerQueryParams

  let bufferDistance = 100
  let featureFilter: __esri.FeatureFilter = null
  let featureLayerView: FeatureLayerView = null

  const sketchGraphicsLayer = new GraphicsLayer({ id: 'sketchGraphicsLayer' })
  let filterGeometry: Geometry = null
  const bufferGraphic = new Graphic({
    geometry: null,
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

  useEffect(() => {
    if (jimuMapView && apiSketchWidgetContainer.current) {
      initSketch()
      initSlider()
    }

    if (!featureLayerView && flDataSource && jimuMapView) {
      const layerId = flDataSource.layer?.id
      getFlView(layerId)
    }
  }, [jimuMapView, flDataSource])

  const getFlView = async (layerId: string) => {
    const fl = jimuMapView.view.map.findLayerById(layerId)
    featureLayerView = (await jimuMapView.view.whenLayerView(fl)) as FeatureLayerView
  }

  const executeAttributiveQuery = async () => {
    // if (flDataSource && featureLayerView) {

    const flvResults = await featureLayerView?.queryFeatures({
      geometry: bufferGraphic.geometry,
      spatialRelationship: 'contains'
    })

    featureLayerView?.highlight(flvResults.features)

    //   const dsResult = await flDataSource.query({
    //     where: `objectid in (${flvResults.features.map((r: Graphic) => r.getObjectId()).join(',')})`
    //   })
    //   console.log('dsResult', dsResult)
    //   const records = dsResult?.records as FeatureDataRecord[]

    //   if (records.length > 0) {
    //     flDataSource.selectRecordsByIds(records.map((r: any) => r.getId()), records)
    //   } else {
    //     flDataSource.clearSelection()
    //   }
    //   console.log('records selected', records)
    // } else {
    //   console.warn('Data source not available or layer not in map.')
    // }
  }

  const initSketch = () => {
    if (!sketchWidget) {
      const container = document.createElement('div')
      apiSketchWidgetContainer.current.appendChild(container)

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

      sketch.on('create', async (evt: __esri.SketchCreateEvent) => {
        if (evt.state === 'complete') {
          filterGeometry = evt.graphic.geometry as Geometry
          updateBuffer(bufferDistance, 'meters')
          executeAttributiveQuery()
        }
      })
      setSketchWidget(sketch)

      jimuMapView.view.map.add(sketchGraphicsLayer)
    } else {
      requestAnimationFrame(() => {
        apiSketchWidgetContainer.current.style.display = ''
      })
    }
  }

  const initSlider = () => {
    if (!distanceNum.current) {
      const container = document.createElement('div')
      apiSliderWidgetContainer.current.appendChild(container)
      requestAnimationFrame(() => {
        apiSliderWidgetContainer.current.style.height = '70px'
      })
      distanceNum.current = new Slider({
        container: apiSliderWidgetContainer.current,
        min: 0,
        max: 1000,
        values: [bufferDistance],
        steps: 1,
        visibleElements: {
          rangeLabels: true,
          labels: true
        }
      })

      distanceNum.current?.on('thumb-drag', (evt: __esri.SliderThumbDragEvent) => {
        if (evt.state === 'stop' && featureLayerView) {
          executeAttributiveQuery()
        }
      })

      // get user entered values from distance related options
      const distanceVariablesChanged = (): void => {
        bufferDistance = distanceNum.current.values[0]
        updateBuffer(bufferDistance, 'meters')
      }

      // listen to change and input events on UI components
      distanceNum.current.on('thumb-drag', distanceVariablesChanged)
    } else {
      requestAnimationFrame(() => {
        apiSliderWidgetContainer.current.style.display = ''
      })
    }
  }

  // update the buffer graphic if user is filtering by distance
  const updateBuffer = (distance: number, unit: __esri.LinearUnits): void => {
    if (distance > 0 && filterGeometry) {
      bufferGraphic.geometry = geometryEngine.geodesicBuffer(filterGeometry, distance, unit) as Polygon
      // updateFilter()
    } else {
      bufferGraphic.geometry = null
      // updateFilter()
    }
  }

  // const updateFilter = () => {
  //   featureFilter = {
  //     geometry: filterGeometry,
  //     spatialRelationship: 'intersects',
  //     distance: bufferDistance,
  //     units: 'meters'
  //   } as unknown as __esri.FeatureFilter
  //   // set effect on excluded features
  //   // make them gray and transparent
  //   if (featureLayerView) {
  //     featureLayerView.featureEffect = {
  //       filter: featureFilter,
  //       excludedEffect: 'grayscale(100%) opacity(30%)'
  //     } as unknown as __esri.FeatureEffect
  //   }
  // }

  const onActiveViewChange = (jmv: JimuMapView) => {
    // if we have a "previous" map where the widget was already added, we're hiding the old widget until it is shown again from via useEffect with the new settings.
    // (ex: case where two Maps in single Experience page and user is switching between them in the Settings)
    if (sketchWidget) {
      requestAnimationFrame(() => {
        apiSketchWidgetContainer.current.style.display = 'none'
      })
    }
    if (distanceNum.current) {
      requestAnimationFrame(() => {
        apiSliderWidgetContainer.current.style.display = 'none'
      })
    }

    if (jmv) {
      setJimuMapView(jmv)
    } else {
      setJimuMapView(undefined)
    }
  }

  const setDataSource = (ds: DataSource) => {
    setFlDataSource(ds as FeatureLayerDataSource)
    console.log(ds.id)
  }

  const dsConfigured = !!(props.useDataSources && props.useDataSources.length > 0)
  const mapConfigured = !!(props.useMapWidgetIds && props.useMapWidgetIds.length > 0)

  return (
        <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            {!mapConfigured && (
                <h3>
                    <FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} />
                </h3>
            )}
            {!dsConfigured && (
                <h3>
                    <FormattedMessage id="pleaseSelectDs" defaultMessage={defaultMessages.pleaseSelectDs} />
                </h3>
            )}

            <div ref={apiSketchWidgetContainer} />
            <div ref={apiSliderWidgetContainer} />

            <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={onActiveViewChange} />

            <DataSourceComponent
                useDataSource={props.useDataSources?.[0]}
                query={queryParams}
                widgetId={props.id}
                queryCount
                onDataSourceCreated={setDataSource}
            />
        </div>
  )
}
