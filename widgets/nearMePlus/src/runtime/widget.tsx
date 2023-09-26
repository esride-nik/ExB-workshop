import { React, type AllWidgetProps, FormattedMessage, type DataSourceManager, type DataSource, DataSourceTypes, type IMDataSourceInfo, DataSourceComponent, type QueryParams } from 'jimu-core'
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
import Query from 'esri/rest/support/Query'
import type FeatureLayer from 'esri/layers/FeatureLayer'

const { useState, useRef, useEffect } = React

export default function (props: AllWidgetProps<unknown>) {
  const apiSketchWidgetContainer = useRef<HTMLDivElement>()
  const apiSliderWidgetContainer = useRef<HTMLDivElement>()
  const distanceNum = useRef<Slider>()
  const dsManager = useRef<DataSourceManager>()
  const selectLayerDs = useRef<DataSource>()

  // const selectLayer = '1892651cc25-layer-3' // Baumkataster
  const [layerDataSourceId, setLayerDataSourceId] = useState(undefined)
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [sketchWidget, setSketchWidget] = useState<Sketch>(undefined)
  const [queryParams, setQueryParams] = useState<QueryParams>(undefined)
  const [querying, setQuerying] = useState(false)

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
      getFlView()
    }
  }, [jimuMapView])

  const getFlView = async () => {
    // TODO: bad hack? is there a better way to connect data source and layer?
    const layerId = props.useDataSources[0].dataSourceId.substring(props.useDataSources[0].rootDataSourceId.length+1);
    const fl = jimuMapView.view.map.findLayerById(layerId)
    featureLayerView = await jimuMapView.view.whenLayerView(fl) as FeatureLayerView
  }

  const executeAttributiveQuery = async () => {
    console.log('executeAttributiveQuery', bufferGraphic)
    setQuerying(true)
    setQueryParams({
      geometry: bufferGraphic.geometry,
      spatialRelationship: 'contains'
    } as QueryParams)
    const flvResults = await featureLayerView.queryFeatures({
      geometry: bufferGraphic.geometry,
      spatialRelationship: 'contains'
    })

    const dsResult = await (selectLayerDs.current as FeatureLayerDataSource).query({
      where: `objectid in (${flvResults.features.map((r: Graphic) => r.getObjectId()).join(',')})`
    })
    console.log('dsResult', dsResult)
    const records = dsResult?.records

    if (records.length > 0) {
      selectLayerDs.current.selectRecordsByIds(records.map((r: any) => r.getId()), records)
    } else {
      selectLayerDs.current.clearSelection()
    }
    console.log('records selected', records)
    setQuerying(false)
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

      sketch.on('create', (evt: __esri.SketchCreateEvent) => {
        if (evt.state === 'complete') {
          console.log('CREATE', evt)
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

      distanceNum.current.on('thumb-drag', async (evt: __esri.SliderThumbDragEvent) => {
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
    console.log('UPDATE BUFFER', distance)
    if (distance > 0 && filterGeometry) {
      bufferGraphic.geometry = geometryEngine.geodesicBuffer(filterGeometry, distance, unit) as Polygon
      updateFilter()
    } else {
      bufferGraphic.geometry = null
      updateFilter()
    }
  }

  const updateFilter = () => {
    console.log('UPDATE FILTER', filterGeometry)
    featureFilter = {
      geometry: filterGeometry,
      spatialRelationship: 'intersects',
      distance: bufferDistance,
      units: 'meters'
    } as unknown as __esri.FeatureFilter
    // set effect on excluded features
    // make them gray and transparent
    if (featureLayerView) {
      featureLayerView.featureEffect = {
        filter: featureFilter,
        excludedEffect: 'grayscale(100%) opacity(30%)'
      } as unknown as __esri.FeatureEffect
    }
  }

  const onActiveViewChange = (jmv: JimuMapView) => {
    // we have a "previous" map where we added the widget
    // (ex: case where two Maps in single Experience page and user is switching
    // between them in the Settings) - we must destroy the old widget in this case.
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

  const dataRender = (ds: DataSource, info: IMDataSourceInfo) => {
    return <div>
    {
      ds && ds.getRecords().map(r => <div>{r.getId()}</div>)
    }
    </div>
  }

  const dsConfigured = !!((props.useDataSources && props.useDataSources.length > 0))
  const mapConfigured = !!((props.useMapWidgetIds && props.useMapWidgetIds.length > 0))

  return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    {!mapConfigured && <h3><FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} /></h3>}
    {!dsConfigured && <h3><FormattedMessage id="pleaseSelectDs" defaultMessage={defaultMessages.pleaseSelectDs} /></h3>}

    <JimuMapViewComponent
      useMapWidgetId={props.useMapWidgetIds?.[0]}
      onActiveViewChange={onActiveViewChange}
    />

    <DataSourceComponent useDataSource={props.useDataSources[0]} query={queryParams} widgetId={props.id} queryCount>
      {dataRender}
    </DataSourceComponent>

    <div ref={apiSketchWidgetContainer} />
    {/* <div>{querying ? 'QUERYING' : 'NOT QUERYING'}</div> */}
    <div ref={apiSliderWidgetContainer} />
  </div>
}
