import { React, type AllWidgetProps, FormattedMessage, type DataSource, DataSourceComponent, type FeatureLayerQueryParams, DataSourceManager } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView, type FeatureLayerDataSource, type FeatureDataRecord } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import Sketch from 'esri/widgets/Sketch'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import * as geometryEngine from 'esri/geometry/geometryEngine'
import Graphic from 'esri/Graphic'
import { type Geometry, type Polygon } from 'esri/geometry'
import { type SimpleFillSymbol } from 'esri/symbols'
import Slider from 'esri/widgets/Slider'
import type FeatureLayerView from 'esri/views/layers/FeatureLayerView'
import { type AlternativeSelectProps } from '../setting/setting'
import * as reactiveUtils from 'esri/core/reactiveUtils'

const { useState, useRef, useEffect } = React

export default function (props: AllWidgetProps<AlternativeSelectProps>) {
  const apiSketchWidgetContainer = useRef<HTMLDivElement>()
  const apiSliderWidgetContainer = useRef<HTMLDivElement>()
  const sketchGraphicsLayer = useRef<GraphicsLayer>()
  const bufferGraphicsLayer = useRef<GraphicsLayer>()
  const bufferGraphic = useRef<Graphic>()
  const filterGeometry = useRef<Geometry>()

  const distanceNum = useRef<Slider>()
  const [featureLayerDataSource, setFeatureLayerDataSource] = useState<FeatureLayerDataSource>(undefined)
  const [featureLayerView, setFeatureLayerView] = useState<FeatureLayerView>(undefined)
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [sketchWidget, setSketchWidget] = useState<Sketch>(undefined)
  const queryParams = {
    where: '1=1',
    outFields: ['*'],
    pageSize: 10
  } as FeatureLayerQueryParams

  let bufferDistance = 100
  let featureFilter: __esri.FeatureFilter = null

  useEffect(() => {
    if (!featureLayerView && featureLayerDataSource) {
      // featureLayerView has to be set first, because it's used in updateFilter(), which is called from updateBuffer(), which is called from initSketch()
      const getFlView = async (layerId: string) => {
        const fl = jimuMapView?.view.map.findLayerById(layerId)
        const flView = await jimuMapView?.view.whenLayerView(fl) as FeatureLayerView
        console.log('setFeatureLayerView')
        setFeatureLayerView(flView) // this will trigger useEffect again, but this time with featureLayerView set
      }
      const layerId = featureLayerDataSource.layer?.id
      getFlView(layerId)
    } else if (jimuMapView && featureLayerDataSource) {
      // we have a featureLayerView and the other dependencies, so we can initialize the UI
      initSketch()
      initSlider()
    }
  }, [jimuMapView, featureLayerDataSource, featureLayerView])

  const executeAttributiveQuery = async () => {
    const featureLayerDataSource = DataSourceManager.getInstance().getDataSource(props.useDataSources?.[0]?.dataSourceId) as FeatureLayerDataSource
    const fl = featureLayerDataSource.layer
    const flvResults = await fl.queryObjectIds({
      geometry: bufferGraphic.current?.geometry,
      spatialRelationship: 'contains'
    })
    const whereClause = `objectid in (${flvResults.map((id: number) => id.toString()).join(',')})`
    const dsResult = await featureLayerDataSource.query({
      where: whereClause
    })
    const records = dsResult?.records as FeatureDataRecord[]

    if (records.length > 0) {
      featureLayerDataSource.selectRecordsByIds(records.map((r: any) => r.getId()), records)
    } else {
      featureLayerDataSource.clearSelection()
    }
  }

  const clearSketch = () => {
    filterGeometry.current = null
    bufferGraphic.current.geometry = null
    updateFilter()
  }

  const initSketch = () => {
    const container = document.createElement('div')
    apiSketchWidgetContainer.current.appendChild(container)

    sketchGraphicsLayer.current = new GraphicsLayer({ id: 'sketchGraphicsLayer' })
    jimuMapView.view.map.add(sketchGraphicsLayer.current)

    const sketch = new Sketch({
      layer: sketchGraphicsLayer.current,
      view: jimuMapView.view,
      container: container,
      creationMode: 'update',
      availableCreateTools: ['point', 'polyline'],
      visibleElements: {
        undoRedoMenu: false,
        selectionTools: {
          'lasso-selection': false,
          'rectangle-selection': false
        },
        settingsMenu: false,
        snappingControls: false,
        duplicateButton: false
      },
      defaultUpdateOptions: {
        tool: 'move',
        toggleToolOnClick: false
      }
    })

    sketch.on('create', (evt: __esri.SketchCreateEvent) => {
      if (evt.state === 'start') {
        sketchGraphicsLayer.current.removeAll()
      } else if (evt.state === 'complete') {
        filterGeometry.current = evt.graphic.geometry as Geometry
        updateBuffer(bufferDistance, 'meters')
        executeAttributiveQuery()
      }
    })

    sketch.on('delete', (evt: __esri.SketchDeleteEvent) => {
      clearSketch()
    })

    sketch.on('update', (evt: __esri.SketchUpdateEvent) => {
      console.log('udpate', evt, evt.state, evt.tool)
      // TODO: move sketch and buffer graphics
      // filterGeometry.current.set( evt.graphics[0].geometry
    })

    // reactiveUtils.watch(() => sketch.activeTool, (activeTool) => {
    //   console.log('activeTool', activeTool, sketch.state)
    //   // if (!activeTool && sketch.state === 'ready') {
    //   //   clearSketch()
    //   // }
    // })

    // reactiveUtils.watch(() => featureLayerDataSource.layer., (numberOfSelectedRecords) => {
    //   console.log('numberOfSelectedRecords', numberOfSelectedRecords)
    //   // if (!activeTool && sketch.state === 'ready') {
    //   //   clearSketch()
    //   // }
    // })

    setSketchWidget(sketch)

    bufferGraphicsLayer.current = new GraphicsLayer({ id: 'bufferGraphicsLayer' })
    jimuMapView.view.map.add(bufferGraphicsLayer.current)
    bufferGraphic.current = new Graphic({
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
    bufferGraphicsLayer.current.add(bufferGraphic.current)
  }

  const initSlider = () => {
    const container = document.createElement('div')
    apiSliderWidgetContainer.current.appendChild(container)
    requestAnimationFrame(() => {
      apiSliderWidgetContainer.current.style.height = '70px'
    })
    distanceNum.current = new Slider({
      container: apiSliderWidgetContainer.current,
      min: 0,
      max: props.config.radius,
      values: [bufferDistance],
      steps: 1,
      visibleElements: {
        rangeLabels: true,
        labels: true
      }
    })

    // listen to change and input events on UI components
    distanceNum.current.on('thumb-drag', async (evt: __esri.SliderThumbDragEvent) => {
      bufferDistance = distanceNum.current.values[0]
      updateBuffer(bufferDistance, 'meters')
      if (evt.state === 'stop') {
        executeAttributiveQuery()
      }
    })
  }

  // update the buffer graphic if user is filtering by distance
  const updateBuffer = (distance: number, unit: __esri.LinearUnits): void => {
    // TODO: clean up buffer when removing the Sketch graphic
    if (distance > 0 && filterGeometry) {
      bufferGraphic.current.geometry = geometryEngine.geodesicBuffer(filterGeometry.current, distance, unit) as Polygon
      updateFilter()
    } else {
      bufferGraphic.current.geometry = null
      updateFilter()
    }
  }

  const updateFilter = () => {
    featureFilter = {
      geometry: filterGeometry.current,
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
    // TODO: try this out with multiple maps on the same page
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

    setJimuMapView(jmv)
  }

  const onDataSourceCreated = (ds: DataSource) => {
    setFeatureLayerDataSource(ds as FeatureLayerDataSource)
  }

  const dsConfigured = !!((props.useDataSources && props.useDataSources.length > 0))
  const mapConfigured = !!((props.useMapWidgetIds && props.useMapWidgetIds.length > 0))

  return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    {!mapConfigured && <h3><FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} /></h3>}
    {!dsConfigured && <h3><FormattedMessage id="pleaseSelectDs" defaultMessage={defaultMessages.pleaseSelectDs} /></h3>}

    <div ref={apiSketchWidgetContainer} />
    <div ref={apiSliderWidgetContainer} />

    <JimuMapViewComponent
      useMapWidgetId={props.useMapWidgetIds?.[0]}
      onActiveViewChange={onActiveViewChange}
    />

    <DataSourceComponent useDataSource={props.useDataSources?.[0]} query={queryParams} widgetId={props.id} queryCount onDataSourceCreated={onDataSourceCreated} />
  </div>
}
