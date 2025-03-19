import { React, type AllWidgetProps, FormattedMessage, DataSourceComponent, type FeatureLayerQueryParams, DataSourceManager, DataSourceStatus, type DataRecord } from 'jimu-core'
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
  let gpxLayer: GraphicsLayer

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
  }, [jimuMapView])

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
      listMode: 'hide',
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

      setSourceRecordsToOutputDs(bufferGraphic.geometry)
    }
  }

  const onActiveViewChange = async (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  const onDataSourceCreated = () => {
    setSourceRecordsToOutputDs()
  }

  const onCreateDataSourceFailed = () => {
    setSourceRecordsToOutputDs()
  }

  const getOutputDataSource = () => {
    return DataSourceManager.getInstance().getDataSource(props.outputDataSources?.[0])
  }
  const getOriginDataSource = () => {
    // TODO: Modify to support multiple origin data sources
    return DataSourceManager.getInstance().getDataSource(props.useDataSources?.[0]?.dataSourceId)
  }

  const setSourceRecordsToOutputDs = async (queryGeometry: Geometry = undefined) => {
    // TODO: something with the output DS doesn't work in ExB 1.15
    /**
     * Just like using other data sources, to use an output data source, widget should use it through `DataSourceComponent`, the framework will create the data source instance on the fly.
     * No output data source instance means there isn't any widgets using the output data source,
     * in this case, no need to set source to the output data source.
     */
    if (!getOutputDataSource()) {
      return
    }

    /**
     * Need origin data source instance to get source records.
     * If do not have origin data source instance, set status of output data source to not ready, which indicates output data source is not ready to do query.
     */
    if (!getOriginDataSource()) {
      getOutputDataSource().setStatus(DataSourceStatus.NotReady)
      getOutputDataSource().setCountStatus(DataSourceStatus.NotReady)
      return
    }

    let dataRecords: DataRecord[] = []
    if (queryGeometry) {
      const flQP: FeatureLayerQueryParams = {
        geometry: queryGeometry,
        spatialRel: 'esriSpatialRelContains'
      }

      const featureLayerDs = getOriginDataSource() as FeatureLayerDataSource
      const res = await featureLayerDs.query(flQP)
      dataRecords = res.records
    }

    /**
       * Set source to the output data source.
       * Output data source can use the source to do query, to load records and so on.
       * If use the source to load records,
       * will save the loaded records to output data source instance and widget can get these records by `outputDs.getRecords()`.
       */
    getOutputDataSource()?.setSourceRecords(dataRecords)
    /**
       * Status of output data source is not ready by default, set it to unloaded to let other widgets know output data source is ready to do query.
       */
    getOutputDataSource()?.setStatus(DataSourceStatus.Unloaded)
    getOutputDataSource()?.setCountStatus(DataSourceStatus.Unloaded)
  }

  if (!isConfigured()) {
    return <h5><FormattedMessage id="cfgDataSources" defaultMessage={defaultMessages.cfgDataSources} /></h5>
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

            <DataSourceComponent
              useDataSource={props.useDataSources[0]}
              widgetId={props.id}
              onDataSourceCreated={onDataSourceCreated}
              onCreateDataSourceFailed={onCreateDataSourceFailed}
            />
        </div>
  )
}
