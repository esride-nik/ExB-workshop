/** @jsx jsx */
import { AllWidgetProps, FormattedMessage, jsx, BaseWidget } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import { IMConfig } from '../config'

import webMercatorUtils from 'esri/geometry/support/webMercatorUtils'
import Point from 'esri/geometry/Point'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import Graphic from 'esri/Graphic'
import PictureMarkerSymbol from 'esri/symbols/PictureMarkerSymbol'
import Polygon from 'esri/geometry/Polygon'
import { Button } from 'jimu-ui'
import geometryEngine from 'esri/geometry/geometryEngine'

import what3words, { ApiVersion, What3wordsService, LocationGeoJsonResponse, axiosTransport } from '@what3words/api'
import { Extent } from 'esri/geometry'
import geodesicUtils from 'esri/geometry/support/geodesicUtils'
import GeoJSONLayer from 'esri/layers/GeoJSONLayer'

interface State {
  extent: __esri.Extent
  center: __esri.Point
  w3wAddress: LocationGeoJsonResponse
  w3wPoint: Point
  query: any
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State> {
  extentWatch: __esri.WatchHandle
  centerWatch: __esri.WatchHandle
  stationaryWatch: __esri.WatchHandle
  w3wLayer: GraphicsLayer
  w3wGridLayer: GeoJSONLayer
  view: __esri.MapView | __esri.SceneView
  w3wService: What3wordsService

  // hard-coded w3w options
  format: 'json' | 'geojson' = 'geojson'

  state: State = {
    extent: null,
    center: null,
    w3wAddress: null,
    w3wPoint: null,
    query: null
  }

  isConfigured = () => {
    return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1
  }

  componentDidMount () {
    const config: {
      host: string
      apiVersion: ApiVersion
    } = {
      host: 'https://api.what3words.com',
      apiVersion: ApiVersion.Version3
    }
    this.w3wService = what3words(this.props.config.w3wApiKey, config, { transport: axiosTransport() })
  }

  componentWillUnmount () {
    if (this.extentWatch) {
      this.extentWatch.remove()
      this.extentWatch = null
    }
    if (this.centerWatch) {
      this.centerWatch.remove()
      this.centerWatch = null
    }
    if (this.stationaryWatch) {
      this.stationaryWatch.remove()
      this.stationaryWatch = null
    }
  }

  refreshW3wGraphics = () => {
    this.w3wLayer.graphics.removeAll()
    if (this.props.config.showW3wLogo) {
      this.drawW3wLogo()
    }
    if (this.props.config.showW3wText) {
      this.drawW3wText()
    }
    if (this.props.config.showW3wSquare) {
      this.drawW3wSquare()
    }
  }

  updateRefreshAndZoom = async (point: Point) => {
    await this.updateW3wAddress(point)
  }

  refreshAndZoom = async () => {
    this.refreshW3wGraphics()
    if (this.props.config.zoomToW3wSquare) {
      this.zoomToW3w()
    }
  }

  handleMapClick = async (mapClick: any) => {
    this.fillW3wGridLayer()
    if (!this.props.config.useMapMidpoint) {
      await this.updateRefreshAndZoom(mapClick.mapPoint as Point)
    }
  }

  async stationaryWatchHandler (stationary: boolean, view: __esri.MapView | __esri.SceneView) {
    if (this.props.config.useMapMidpoint && stationary && this.state.center) {
      await this.updateRefreshAndZoom(this.state.center)
    }
  }

  onActiveViewChange = (jimuMapView: JimuMapView) => {
    if (!jimuMapView) return
    this.view = jimuMapView.view

    this.w3wLayer = new GraphicsLayer({
      listMode: 'hide'
    })
    this.view.map.add(this.w3wLayer)

    this.view.on('click', this.handleMapClick)

    if (!this.stationaryWatch) {
      this.stationaryWatch = this.view.watch('stationary', (stationary) =>
        this.stationaryWatchHandler(stationary, this.view)
      )
    }
    if (!this.extentWatch) {
      this.extentWatch = this.view.watch('extent', (extent) => {
        this.setState({
          extent
        })
      })
    }
    if (!this.centerWatch) {
      this.centerWatch = this.view.watch('center', (center) => {
        this.setState({
          center
        })
      })
    }
  }

  private readonly getW3wAddress = async (point: Point): Promise<LocationGeoJsonResponse> => {
    let geoPoint: Point
    if (point.spatialReference.isWebMercator) {
      geoPoint = webMercatorUtils.webMercatorToGeographic(point) as Point
      if (!geoPoint) return
    } else {
      if (!point.spatialReference.isWGS84) return
      geoPoint = point
    }

    const w3wAddressCollection = await this.w3wService.convertTo3wa({
      coordinates: {
        lat: geoPoint.y,
        lng: geoPoint.x
      },
      format: this.format,
      language: this.props.config.w3wLanguage ?? 'en'
    }) as LocationGeoJsonResponse

    // The return type is wrong in the definitions. It's a FeatureCollection containing the array "features": LocationGeoJsonResponse[] | LocationJsonResponse[]
    return (w3wAddressCollection as any).features[0]
  }

  // TODO: call this when exceeding a certain zoom level
  private readonly fillW3wGridLayer = async () => {
    const wgs84Extent = webMercatorUtils.webMercatorToGeographic(this.view.extent) as Extent
    const diagonalDistance = geodesicUtils.geodesicDistance(new Point({
      y: wgs84Extent.ymax,
      x: wgs84Extent.xmax
    }), new Point({
      y: wgs84Extent.ymin,
      x: wgs84Extent.xmin
    }), 'kilometers')

    if (diagonalDistance.distance <= 0.5) {
      const w3wGrid = await this.w3wService.gridSection({
        boundingBox: {
          northeast: {
            lat: wgs84Extent.ymax,
            lng: wgs84Extent.xmax
          },
          southwest: {
            lat: wgs84Extent.ymin,
            lng: wgs84Extent.xmin
          }
        },
        format: this.format
      })

      // create a new blob from geojson featurecollection
      const blob = new Blob([JSON.stringify(w3wGrid)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      // TODO: refresh graphics instead of creating new layer? take graphics out when zooming out? grey symbology, fading out to the sides?
      this.w3wGridLayer = new GeoJSONLayer({
        url
      })
      // TODO: add grid layer behind w3w graphics
      this.view.map.add(this.w3wGridLayer)
    }
  }

  private readonly updateW3wAddress= async (point: Point): Promise<void> => {
    const w3wAddress = await this.getW3wAddress(point)
    const w3wPoint = new Point({
      x: w3wAddress.geometry.coordinates[0],
      y: w3wAddress.geometry.coordinates[1],
      spatialReference: {
        wkid: 4326
      }
    })

    // remember that setState is async!
    this.setState({
      w3wAddress,
      w3wPoint
    }, this.refreshAndZoom)
  }

  private readonly drawW3wText = () => {
    const textSym = {
      type: 'text',
      text: this.state.w3wAddress.properties.words,
      font: { size: 12 },
      horizontalAlignment: 'left',
      kerning: true,
      rotated: false,
      color: [225, 31, 38, 1],
      xoffset: 10,
      yoffset: -4
    }
    const w3wtext = new Graphic({
      geometry: this.state.w3wPoint,
      symbol: textSym
    })
    this.w3wLayer.graphics.add(w3wtext)
  }

  private readonly drawW3wLogo = () => {
    const logoSym = {
      type: 'picture-marker',
      url: 'data:image/svg+xml;base64,' +
        'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDYuMjcyNSAxNDYuMjcyNSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNlMTFmMjY7fS5jbHMtMntmaWxsOiNmZmY7fS5jbHMtM3tmaWxsOm5vbmU7fTwvc3R5bGU+PC9kZWZzPjxnIGlkPSJMYXllcl8yIiBkYXRhLW5hbWU9IkxheWVyIDIiPjxnIGlkPSJhcnR3b3JrIj48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMTcuMDIwNiwyOS4yNTIySDI5LjI1NDl2ODcuNzY1Nmg4Ny43NjU3VjI5LjI1MjJaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNjcuNjUyNSw5Mi4zMzQ2YTIuNzQ1NSwyLjc0NTUsMCwwLDEtMi42MDItMy42MUw3Ni4wMjEyLDU1LjgxMmEyLjc0MjksMi43NDI5LDAsMCwxLDUuMjA0MSwxLjczNTZMNzAuMjU0Niw5MC40NkEyLjc0MjksMi43NDI5LDAsMCwxLDY3LjY1MjUsOTIuMzM0NloiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik01MS4xOTY1LDkyLjMzNDZhMi43NDU2LDIuNzQ1NiwwLDAsMS0yLjYwMjEtMy42MUw1OS41NjUxLDU1LjgxMmEyLjc0MywyLjc0MywwLDAsMSw1LjIwNDIsMS43MzU2TDUzLjc5ODUsOTAuNDZBMi43NDI5LDIuNzQyOSwwLDAsMSw1MS4xOTY1LDkyLjMzNDZaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNODQuMTA4Niw5Mi4zMzQ2YTIuNzQ1NiwyLjc0NTYsMCwwLDEtMi42MDIxLTMuNjFMOTIuNDc3Miw1NS44MTJhMi43NDMsMi43NDMsMCwwLDEsNS4yMDQyLDEuNzM1Nkw4Ni43MTA3LDkwLjQ2QTIuNzQzLDIuNzQzLDAsMCwxLDg0LjEwODYsOTIuMzM0NloiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHdpZHRoPSIxNDYuMjcyNSIgaGVpZ2h0PSIxNDYuMjcyNSIvPjwvZz48L2c+PC9zdmc+',
      contentType: 'image/svg',
      width: 25,
      height: 25
    } as unknown as PictureMarkerSymbol
    const w3wlogo = new Graphic({
      geometry: this.state.w3wPoint,
      symbol: logoSym
    })
    this.w3wLayer.graphics.add(w3wlogo)
  }

  private readonly drawW3wSquare = () => {
    const east = this.state.w3wAddress.bbox[0]
    const north = this.state.w3wAddress.bbox[1]
    const west = this.state.w3wAddress.bbox[2]
    const south = this.state.w3wAddress.bbox[3]
    const w3wGraphic = new Graphic({
      geometry: new Polygon({
        rings: [
          [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
            [west, north]
          ]
        ],
        spatialReference: {
          wkid: 4326
        }
      }),
      symbol: {
        type: 'simple-line',
        color: [225, 31, 38, 1],
        width: '2px',
        style: 'short-dot'
      } as unknown as __esri.Symbol
    })
    this.w3wLayer.graphics.add(w3wGraphic)
  }

  private readonly zoomToW3w = async () => {
    const w3wPoint = webMercatorUtils.geographicToWebMercator(this.state.w3wPoint)
    const w3wBuffer = geometryEngine.buffer(w3wPoint, 1, 'kilometers')

    await this.view.goTo({
      target: w3wBuffer
    })
    this.fillW3wGridLayer()
  }

  render () {
    if (!this.isConfigured()) {
      return 'Select a map'
    }

    return (
            <div className="custom-widget p-3 m-4 surface-1">
                <h3>
                    <FormattedMessage id="w3w" defaultMessage={defaultMessages.w3w} />
                </h3>

                {{}.hasOwnProperty.call(this.props, 'useMapWidgetIds') &&
                    this.props.useMapWidgetIds &&
                    this.props.useMapWidgetIds.length === 1 && (
                        <JimuMapViewComponent
                            useMapWidgetId={this.props.useMapWidgetIds?.[0]}
                            onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>
                )}

                <table className="table table-striped">
                    <tbody>
                        <tr>
                            <td scope="row">X</td>
                            <td>{this.state.center && this.state.center.x}</td>
                        </tr>
                        <tr>
                            <td scope="row">Y</td>
                            <td>{this.state.center && this.state.center.y}</td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <FormattedMessage id="centerLabel" />
                            </th>
                            <td>{this.state.w3wAddress?.properties?.words}</td>
                        </tr>
                        <tr>
                            <td colSpan={2}><Button onClick={this.zoomToW3w}>Zoom</Button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
    )
  }
}
