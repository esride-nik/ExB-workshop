import { React, type AllWidgetProps, FormattedMessage, DataSourceManager, type DataSource, DataSourceTypes } from 'jimu-core'
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

export default function ({
  useMapWidgetIds
}: AllWidgetProps<{}>) {
  const apiSketchWidgetContainer = useRef<HTMLDivElement>()
  const apiSliderWidgetContainer = useRef<HTMLDivElement>()
  const distanceNum = useRef<Slider>()
  const dsManager = useRef<DataSourceManager>()
  const selectLayerDs = useRef<DataSource>()

  // const selectLayer = '1892651cc25-layer-3' // Baumkataster
  const [layerDataSourceId, setLayerDataSourceId] = useState(undefined)
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [sketchWidget, setSketchWidget] = useState<Sketch>(undefined)
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

      console.log('getting instance of DataSourceManager', DataSourceManager)
      dsManager.current = DataSourceManager.getInstance()

      console.log('dsManager', dsManager)

      // undocumented method getDataSourcesAsArray() => https://developers.arcgis.com/experience-builder/api-reference/jimu-core/DataSourceManager
      const dss = dsManager.current.getDataSourcesAsArray()
      console.log(dss)

      // breaking change: in 1.11, DataSource had a jimuChildId prop, that could be compared with a static layerId
      // const myDs = dss.filter((d: DataSource) => d.jimuChildId === selectLayerId)

      // TODO: data sources not ready when useEffect is executed :/
      selectLayerDs.current = dsManager.current.getDataSource(layerDataSourceId)
      console.log('selectLayerDs', selectLayerDs.current)

      return () => {
        if (sketchWidget) {
          sketchWidget.destroy()
          setSketchWidget(null)
        }
      }
    }
  }, [jimuMapView])

  const getFlView = async () => {
    const fl = jimuMapView.view.map.findLayerById(layerDataSourceId)
    featureLayerView = await jimuMapView.view.whenLayerView(fl) as FeatureLayerView
  }

  const executeAttributiveQuery = async () => {
    setQuerying(true)
    const flvResults = await featureLayerView.queryFeatures({
      geometry: bufferGraphic.geometry,
      spatialRelationship: 'contains'
    })
    setQuerying(false)

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

      jimuMapView.view.map.add(sketchGraphicsLayer)
    }
  }

  const initSlider = () => {
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
  }

  // update the buffer graphic if user is filtering by distance
  const updateBuffer = (distance: number, unit: __esri.LinearUnits): void => {
    if (distance > 0 && filterGeometry) {
      bufferGraphic.geometry = geometryEngine.geodesicBuffer(filterGeometry, distance, unit) as Polygon
      updateFilter()
    } else {
      bufferGraphic.geometry = null
      updateFilter()
    }
  }

  const updateFilter = () => {
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
    if (jimuMapView && sketchWidget) {
      // we have a "previous" map where we added the widget
      // (ex: case where two Maps in single Experience page and user is switching
      // between them in the Settings) - we must destroy the old widget in this case.
      sketchWidget.destroy()
      setSketchWidget(null)
    }

    if (jmv) {
      const jimuLayerViews = jmv.jimuLayerViews
      // TODO takin first layer
      const layerDataSourceId = jimuLayerViews[Object.keys(jimuLayerViews)[0]].layerDataSourceId

      if (layerDataSourceId === undefined) {
        jmv = null
        return
      }

      setLayerDataSourceId(layerDataSourceId)
      setJimuMapView(jmv)
    } else {
      setLayerDataSourceId(undefined)
      setJimuMapView(undefined)
    }
  }

  const isConfigured = useMapWidgetIds && useMapWidgetIds.length === 1

  return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    {!isConfigured && <h3><FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} /></h3>}

    <JimuMapViewComponent
      useMapWidgetId={useMapWidgetIds?.[0]}
      onActiveViewChange={onActiveViewChange}
    />

    <div ref={apiSketchWidgetContainer} />
    {/* <div>{querying ? 'QUERYING' : 'NOT QUERYING'}</div> */}
    <div ref={apiSliderWidgetContainer} />
  </div>
}
