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
import { React, AllWidgetProps, FormattedMessage, DataSourceManager, DataSource, QueriableDataSource, SqlQueryParams, DataRecord } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
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
import FeatureSet from 'esri/rest/support/FeatureSet'

const { useState, useRef, useEffect } = React

export default function ({
  useMapWidgetIds
}: AllWidgetProps<{}>) {
  const apiSketchWidgetContainer = useRef<HTMLDivElement>()
  const apiSliderWidgetContainer = useRef<HTMLDivElement>()
  const selectLayerDs = useRef<DataSource>()
  const queryableLayerDs = useRef<QueriableDataSource>()
  const dsManager = useRef<DataSourceManager>()
  const featureLayerView = useRef<FeatureLayerView>()
  const sketchGraphicsLayer = useRef<GraphicsLayer>()
  const filterGeometry = useRef<Geometry>()
  const bufferDistance = useRef<number>()
  const featureFilter = useRef<__esri.FeatureFilter>()
  // DataSourceView
  const dsv = useRef<QueriableDataSource[]>()

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

  const executeQueryStuff = useCallback(async (flvResults: FeatureSet, ds: QueriableDataSource): Promise<DataRecord[]> => {
    const objectIdStrings = flvResults.features.map((f: Graphic) => f.getObjectId().toString())
    const objectIds = flvResults.features.map((f: Graphic) => f.getObjectId())
    const objectIdsWhere = `OBJECTID = ${objectIds.join(' OR OBJECTID = ')}`
    console.log('objectIdsWhere', objectIdsWhere)
    console.log('useMapWidgetIds', useMapWidgetIds[0])

    ds.updateQueryParams({
      where: objectIdsWhere
    } as SqlQueryParams, useMapWidgetIds[0])
    console.log('getRealQueryParams', ds.getRealQueryParams({
      page: 1, // if 0 is used here, the query to the service will contain 'resultOffset: -100' and FAIL :(
      pageSize: 100
    }, 'query'))

    const queryResult = await ds.query({
      page: 1, // if 0 is used here, the query to the service will contain 'resultOffset: -100' and FAIL :(
      pageSize: 100
    }, {
      widgetId: useMapWidgetIds[0]
    })
    console.log('Status loaded', ds.getStatus(), queryResult.records)

    const drIds = queryResult.records.map((d: DataRecord) => d.getId())
    console.log('drIds', drIds)
    ds.selectRecordsByIds(drIds)
    ds.updateSelectionInfo(drIds, ds, true)

    return queryResult.records
  }, [useMapWidgetIds])

  const updateSelection = useCallback(async (): Promise<void> => {
    // query features within buffer
    const flvResults = await featureLayerView.current.queryFeatures({
      geometry: bufferGraphic.geometry,
      spatialRelationship: 'contains'
    })
    console.log('records selected', flvResults.features)

    if (flvResults.features.length > 0) {
      const r = await executeQueryStuff(flvResults, queryableLayerDs.current)
      console.log('r', r)
      // TODO: after app reload, features appear selected

      // const dataRecord = await dsv.current[0].loadById(objectIdStrings[0])
      // while (dsv.current[0].getStatus() !== 'LOADED') {
      //   console.log('Status check', dsv.current[0].getStatus())
      // }
      // console.log('Status loaded', dsv.current[0].getStatus(), dataRecord)

      // dsv.current[0].selectRecordsByIds(objectIdStrings)
      // dsv.current[0].updateSelectionInfo(objectIdStrings, queryableLayerDs.current, true)
    } else {
      // selectLayerDs.current.clearSelection()
      queryableLayerDs.current.clearSelection()
    }
  }, [bufferGraphic, executeQueryStuff])

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
        queryableLayerDs.current = dsManager.current.getDataSource(myDs[0].id) as QueriableDataSource
        console.log('Setting queryableLayerDs', queryableLayerDs.current)
        dsv.current = queryableLayerDs.current.getDataViews()
        console.log('queryableLayerDs dsv', dsv.current)
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
