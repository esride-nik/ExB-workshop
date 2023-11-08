import { React, type AllWidgetProps, FormattedMessage, DataSourceComponent, type FeatureLayerQueryParams, type DataSource } from 'jimu-core'
import { useDropzone } from 'react-dropzone'
import { gpx } from '@tmcw/togeojson'
import { JimuMapViewComponent, type JimuMapView, type FeatureLayerDataSource } from 'jimu-arcgis'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import Graphic from 'esri/Graphic'
import geometryEngine from 'esri/geometry/geometryEngine'
import type Polygon from 'esri/geometry/Polygon'
import Polyline from 'esri/geometry/Polyline'
import type Geometry from 'esri/geometry/Geometry'
import webMercatorUtils from 'esri/geometry/support/webMercatorUtils'
import defaultMessages from './translations/default'
import { useState } from 'react'

const { useCallback } = React

export default function (props: AllWidgetProps<unknown>) {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(undefined)
  const [flDataSource, setFlDataSource] = useState<FeatureLayerDataSource>(undefined)
  let gpxLayer: GraphicsLayer
  const queryParams = {
    where: '1=1',
    outFields: ['*'],
    pageSize: 10
  } as FeatureLayerQueryParams

  const isConfigured = () => {
    return props.useDataSourcesEnabled && props.useDataSources?.length > 0 && props.useMapWidgetIds?.length > 0
  }

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => {
        console.log('file reading was aborted')
      }
      reader.onerror = () => {
        console.log('file reading has failed')
      }

      reader.readAsText(file)
      reader.onloadend = () => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        parseGpx(reader.result.toString())
      }
    })
  }, [jimuMapView, flDataSource])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const parseGpx = (gpxText: string) => {
    const geoJson = gpx(new DOMParser().parseFromString(gpxText, 'text/xml'))
    console.log('geoJson', geoJson)
    const esriFeatures: Graphic[] = geoJson?.features
      .filter((feature: any) => feature.geometry.type === 'LineString')
      .map((feature: any) => {
        return new Graphic({
          geometry: new Polyline({
            hasZ: true,
            hasM: false,
            paths: feature.geometry.coordinates,
            spatialReference: { wkid: 4326 }
          }),
          symbol: {
            type: 'simple-line',
            width: 1,
            color: [255, 0, 255, 1],
            style: 'solid',
            cap: 'round',
            join: 'round'
          } as unknown as __esri.SimpleLineSymbol,
          attributes: feature.properties
        })
      })
    addTrackToMap(esriFeatures)
  }

  const addTrackToMap = (esriFeatures: Graphic[]) => {
    gpxLayer = new GraphicsLayer({
      listMode: 'show',
      id: 'gpxLineString'
    })
    gpxLayer.addMany(esriFeatures)
    if (jimuMapView) {
      jimuMapView.view.map.add(gpxLayer)
      jimuMapView.view.goTo(esriFeatures)
    }

    // productive version: please verify array contents!
    createBuffer(
      esriFeatures.map((graphic: Graphic) => webMercatorUtils.geographicToWebMercator(graphic.geometry))
    )
  }

  const createBuffer = async (inputGeometries: Geometry[]) => {
    const buffers = geometryEngine.buffer(inputGeometries, 50, 'meters', true) as Polygon[]
    const oneBuffer = buffers.length > 0 ? buffers[0] : null
    if (oneBuffer) {
      const polygonSymbol = {
        type: 'simple-fill',
        color: [51, 51, 204, 0.9],
        style: 'solid',
        outline: {
          color: 'white',
          width: 0.1
        }
      }
      const bufferGraphic = new Graphic({
        geometry: oneBuffer,
        symbol: polygonSymbol
      })
      gpxLayer.add(bufferGraphic)

      const fl = flDataSource.layer
      const flQuery = fl.createQuery()
      flQuery.geometry = bufferGraphic.geometry
      flQuery.spatialRelationship = 'contains'
      flQuery.outStatistics = [
        {
          statisticType: 'count',
          onStatisticField: 'gattung',
          outStatisticFieldName: 'gattung_count'
        } as unknown as __esri.StatisticDefinition
      ]
      flQuery.groupByFieldsForStatistics = ['gattung']
      const flResult = await fl.queryFeatures(flQuery)
      console.log(flResult, flResult.features.length)
    }
  }

  const onActiveViewChange = async (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  const setDataSource = (ds: DataSource) => {
    setFlDataSource(ds as FeatureLayerDataSource)
    console.log(ds.id)
  }

  if (!isConfigured()) {
    return <FormattedMessage id="cfgDataSources" defaultMessage={defaultMessages.cfgDataSources} />
  }
  const dropzoneStyle = {
    border: '1px solid #ddd',
    padding: '20px',
    background: '#eee'
  }
  return (
        <div
            className="widget-gpx-upload"
            style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
            <h3><FormattedMessage id="dropIt" defaultMessage={defaultMessages.dropIt} /></h3>

            <div {...getRootProps()}>
                <input {...getInputProps()} />
                {isDragActive
                  ? (
                    <p className="dropzone" style={dropzoneStyle}>
                        Drop the files here ...
                    </p>
                    )
                  : (
                    <p className="dropzone" style={dropzoneStyle}>
                        Drag 'n' drop some files here, or click to select files
                    </p>
                    )}
            </div>

            <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={onActiveViewChange} />
            <DataSourceComponent useDataSource={props.useDataSources?.[0]} query={queryParams} widgetId={props.id} queryCount onDataSourceCreated={setDataSource} />
        </div>
  )
}
