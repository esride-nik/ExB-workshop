import { React, AllWidgetProps } from 'jimu-core'
import { useDropzone } from 'react-dropzone'
import { gpx } from '@tmcw/togeojson'

import defaultMessages from './translations/default'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'

import GraphicsLayer from 'esri/layers/GraphicsLayer'
import Graphic from 'esri/Graphic'
import geometryEngine from 'esri/geometry/geometryEngine'
import Polygon from 'esri/geometry/Polygon'
import Polyline from 'esri/geometry/Polyline'
import Geometry from 'esri/geometry/Geometry'
import webMercatorUtils from 'esri/geometry/support/webMercatorUtils'

const { useCallback } = React

/**
 * This widget will show features from a configured feature layer
 */
// export default function Widget (props: AllWidgetProps<{ Config }>) {
export default function ({
  useMapWidgetIds
}: AllWidgetProps<{}>) {
  let jimuMapView: JimuMapView
  let gpxLayer: GraphicsLayer

  const isConfigured = () => {
    return useMapWidgetIds && useMapWidgetIds.length === 1
  }

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')

      reader.readAsText(file)
      reader.onloadend = () => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        parseGpx(reader.result.toString())
      }
    })
  }, [])

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
          attributes: feature.properties
        })
      })
    addTrackToMap(esriFeatures)
  }

  const addTrackToMap = (esriFeatures: Graphic[]) => {
    gpxLayer = new GraphicsLayer({
      listMode: 'hide'
    })
    gpxLayer.addMany(esriFeatures)
    if (jimuMapView) {
      jimuMapView.view.map.add(gpxLayer)
      jimuMapView.view.goTo(esriFeatures)
    }

    // produktiv bitte Array-Inhalt verifizieren
    createBuffer(esriFeatures.map((graphic: Graphic) => webMercatorUtils.geographicToWebMercator(graphic.geometry)))
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
          width: 1
        }
      }
      const bufferGraphic = new Graphic({
        geometry: oneBuffer,
        symbol: polygonSymbol
      })
      gpxLayer.add(bufferGraphic)
    }
  }

  const onActiveViewChange = (jmv: JimuMapView) => {
    if (jmv) {
      jimuMapView = jmv
    }
  }

  if (!isConfigured()) {
    return 'Select a map'
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
            <h3>Drop this</h3>

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

            <JimuMapViewComponent
              useMapWidgetId={useMapWidgetIds?.[0]}
              onActiveViewChange={onActiveViewChange}
            />
        </div>
  )
}
