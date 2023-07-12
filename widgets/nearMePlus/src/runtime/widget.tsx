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
import { React, AllWidgetProps, FormattedMessage, DataSourceManager, DataSource, SqlQueryParams, DataRecord, FeatureLayerQueryParams, MessageManager, DataRecordsSelectionChangeMessage } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView, FeatureLayerDataSource } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import Sketch from 'esri/widgets/Sketch'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import geometryEngine from 'esri/geometry/geometryEngine'
import Graphic from 'esri/Graphic'
import { Geometry, Polygon } from 'esri/geometry'
import { SimpleFillSymbol } from 'esri/symbols'
import Slider from 'esri/widgets/Slider'
import FeatureLayerView from 'esri/views/layers/FeatureLayerView'
import { useCallback, useMemo } from 'react'

const { useState, useRef, useEffect } = React

export default function ({
  useMapWidgetIds
}: AllWidgetProps<{}>) {
  const apiSketchWidgetContainer = useRef<HTMLDivElement>()
  const apiSliderWidgetContainer = useRef<HTMLDivElement>()
  const flDs = useRef<FeatureLayerDataSource>()
  const flDv = useRef<FeatureLayerDataSource[]>() // DataView
  const dsManager = useRef<DataSourceManager>()
  const featureLayerView = useRef<FeatureLayerView>()
  const sketchGraphicsLayer = useRef<GraphicsLayer>()
  const filterGeometry = useRef<Geometry>()
  const bufferDistance = useRef<number>()
  const featureFilter = useRef<__esri.FeatureFilter>()

  bufferDistance.current = 30
  const selectLayerId = '1892651cc25-layer-3' // Baumkataster

  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [sketchWidget, setSketchWidget] = useState<Sketch>(null)

  sketchGraphicsLayer.current = new GraphicsLayer({ id: 'sketchGraphicsLayer' })

  const bufferGraphic = useMemo(() => {
    return new Graphic({
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
  }, [])
  sketchGraphicsLayer.current.add(bufferGraphic)

  const getFlView = useCallback(async () => {
    const fl = jimuMapView.view.map.findLayerById(selectLayerId)
    featureLayerView.current = await jimuMapView.view.whenLayerView(fl) as FeatureLayerView
  }, [jimuMapView])

  const updateFilter = useCallback(() => {
    featureFilter.current = {
      geometry: filterGeometry,
      spatialRelationship: 'intersects',
      distance: bufferDistance,
      units: 'meters'
    } as unknown as __esri.FeatureFilter
    // set effect on excluded features
    // make them gray and transparent
    if (featureLayerView) {
      featureLayerView.current.featureEffect = {
        filter: featureFilter.current,
        excludedEffect: 'grayscale(100%) opacity(30%)'
      } as unknown as __esri.FeatureEffect
    }
  }, [])

  const executeAttributiveQuery = useCallback(async (buffer: __esri.Geometry, ds: FeatureLayerDataSource, getAll: boolean = false): Promise<void> => {
    // query features within buffer => attributive query
    const flvResults = await featureLayerView.current.queryFeatures({
      geometry: bufferGraphic.geometry,
      spatialRelationship: 'contains'
    })
    console.log('records selected', flvResults.features)

    if (flvResults.features.length > 0) {
      const objectIdStrings = flvResults.features.map((f: Graphic) => f.getObjectId().toString())
      const objectIds = flvResults.features.map((f: Graphic) => f.getObjectId())

      // TODO: idea: add 'OR 1=1' to definitely load the geometries in the buffer but also keep everything else on the map => selection not transferred to other widgets anymore
      const objectIdsWhere = getAll ? '1=1' : `OBJECTID = ${objectIds.join(' OR OBJECTID = ')}`// OR 1=1`
      console.log('objectIdsWhere', objectIdsWhere)
      console.log('useMapWidgetIds', useMapWidgetIds[0])

      // TODO: selection works with previous load, but this also applies a definition expression => it's not what we want! :(
      const queryResult = await ds.load({
        page: 1, // if 0 is used here, the query to the service will contain 'resultOffset: -100' and FAIL :(
        pageSize: 100,
        where: objectIdsWhere
      } as SqlQueryParams, {
        widgetId: useMapWidgetIds[0]
      })
      console.log('Status loaded', ds.getStatus(), queryResult)

      // TODO: Doesn't seem to do anything.
      // ds.updateQueryParams({
      //   page: 1, // if 0 is used here, the query to the service will contain 'resultOffset: -100' and FAIL :(
      //   pageSize: 100,
      //   where: objectIdsWhere
      // } as SqlQueryParams, useMapWidgetIds[0])
      // console.log('Count', ds.count, ds.getCountStatus())

      // this causes the features to appear selected on the map. nothing else.
      ds.selectRecordsByIds(objectIdStrings) // mysterious from the docs: "when the selected records are not loaded, we can add them in"

      // TODO: Doesn't seem to do anything.
      // ds.updateSelectionInfo(objectIdStrings, ds, false)

      // TODO: What is this message for? Doesn't seem to notify anyone when I don't perform the previous load.
      // const records = ds.getSelectedRecords()
      // console.log('records', records)
      // MessageManager.getInstance().publishMessage(
      //   new DataRecordsSelectionChangeMessage(useMapWidgetIds[0], records)
      // )
    }
  }, [bufferGraphic, useMapWidgetIds])

  const executeSpatialQuery = useCallback(async (buffer: __esri.Geometry, ds: FeatureLayerDataSource): Promise<void> => {
    // TODO: BUG? geometry parameter on QueryableDataSource does not work!
    const queryResult = await ds.query({
      page: 1, // if 0 is used here, the query to the service will contain 'resultOffset: -100' and FAIL :(
      pageSize: 100,
      geometry: buffer,
      geometryType: 'esriGeometryPolygon',
      returnGeometry: true
    } as FeatureLayerQueryParams)
    console.log('Status loaded', ds.getStatus(), queryResult)

    const drIds = queryResult.records.map((d: DataRecord) => d.getId())
    console.log('drIds', drIds)

    // this causes the features to appear selected on the map. nothing else.
    ds.selectRecordsByIds(drIds) // mysterious from the docs: "when the selected records are not loaded, we can add them in"
    ds.updateSelectionInfo(drIds, ds, false)
  }, [])

  const updateSelection = useCallback(async (): Promise<void> => {
    if (bufferGraphic?.geometry !== undefined) {
      flDs.current.clearSelection()
      await executeAttributiveQuery(bufferGraphic.geometry, flDs.current, true)
      // TODO: BUG? executeSpatialQuery does not work because geometry parameter on QueryParams does not work! Same when pushing in the DataView instead of DataSource.
      // await executeSpatialQuery(bufferGraphic.geometry, flDs.current)
      await executeAttributiveQuery(bufferGraphic.geometry, flDs.current)
    } else {
      flDs.current.clearSelection()
    }
  }, [bufferGraphic, executeAttributiveQuery])

  // update the buffer graphic if user is filtering by distance
  const updateBuffer = useCallback((distance: number, unit: __esri.LinearUnits): void => {
    if (distance > 0 && filterGeometry.current !== undefined) {
      bufferGraphic.geometry = geometryEngine.geodesicBuffer(filterGeometry.current, distance, unit) as Polygon
      updateFilter()
      updateSelection()
    } else {
      bufferGraphic.geometry = null
      featureFilter.current = null
    }
  }, [bufferGraphic, updateFilter, updateSelection])

  const initSketch = useCallback(() => {
    if (!sketchWidget) {
      const container = document.createElement('div')
      apiSketchWidgetContainer.current.appendChild(container)

      const sketch = new Sketch({
        layer: sketchGraphicsLayer.current,
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
          filterGeometry.current = evt.graphic.geometry as Geometry
          updateBuffer(bufferDistance.current, 'meters')
        }
      })

      jimuMapView.view.map.add(sketchGraphicsLayer.current)
    }
  }, [bufferDistance, jimuMapView, sketchWidget, updateBuffer])

  const initSlider = useCallback(() => {
    const container = document.createElement('div')
    apiSliderWidgetContainer.current.appendChild(container)
    const distanceNum = new Slider({
      container: apiSliderWidgetContainer.current,
      min: 0,
      max: 1000,
      values: [bufferDistance.current],
      steps: 1,
      visibleElements: {
        rangeLabels: true,
        labels: true
      }
    })

    distanceNum.on('thumb-drag', async (evt: __esri.SliderThumbDragEvent) => {
      if (evt.state === 'stop' && featureLayerView && bufferGraphic.geometry !== null) {
        updateSelection()
      }
    })

    // get user entered values from distance related options
    const distanceVariablesChanged = (): void => {
      bufferDistance.current = distanceNum.values[0]
      updateBuffer(bufferDistance.current, 'meters')
    }

    // listen to change and input events on UI components
    distanceNum.on('thumb-drag', distanceVariablesChanged)
  }, [bufferGraphic, updateBuffer, updateSelection])

  useEffect(() => {
    if (jimuMapView && apiSketchWidgetContainer.current) {
      initSketch()
      initSlider()
      getFlView()

      console.log('getting instance of DataSourceManager', DataSourceManager)
      dsManager.current = DataSourceManager.getInstance()

      console.log('dsManager', dsManager)
      const dss = dsManager.current.getDataSourcesAsArray()
      const myDs = dss.filter((d: DataSource) => d.jimuChildId === selectLayerId)
      console.log('dss', myDs, dss.map((d: DataSource) => [d.jimuChildId, d.id, d]))
      if (myDs.length > 0) {
        // selectLayerDs.current = dsManager.current.getDataSource(myDs[0].id)
        flDs.current = dsManager.current.getDataSource(myDs[0].id) as FeatureLayerDataSource
        console.log('Setting queryableLayerDs', flDs.current)
        flDv.current = flDs.current.getDataViews()
        console.log('queryableLayerDs dsv', flDv.current)
      }

      return () => {
        if (sketchWidget) {
          sketchWidget.destroy()
          setSketchWidget(null)
        }
      }
    }
  }, [apiSketchWidgetContainer, apiSliderWidgetContainer, jimuMapView, sketchWidget, sketchGraphicsLayer, initSketch, initSlider, getFlView])

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

    <div ref={apiSketchWidgetContainer} />
    <div ref={apiSliderWidgetContainer} />
  </div>
}
