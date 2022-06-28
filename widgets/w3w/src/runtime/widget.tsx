/** @jsx jsx */
import { AllWidgetProps, FormattedMessage, jsx, BaseWidget, css } from 'jimu-core'
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

import what3words, { ApiVersion, What3wordsService, LocationGeoJsonResponse, axiosTransport, GridSectionGeoJsonResponse } from '@what3words/api'
import { Extent } from 'esri/geometry'
import geodesicUtils from 'esri/geometry/support/geodesicUtils'
import FeatureLayer from 'esri/layers/FeatureLayer'
import Color from 'esri/Color'

interface State {
  center: __esri.Point
  extent: Extent
  zoom: number
  w3wAddress: LocationGeoJsonResponse
  w3wPoint: Point
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State> {
  zoomWatch: __esri.WatchHandle
  centerWatch: __esri.WatchHandle
  stationaryWatch: __esri.WatchHandle
  extentWatch: __esri.WatchHandle
  w3wLayer: GraphicsLayer
  w3wGridLayer: FeatureLayer
  view: __esri.MapView | __esri.SceneView
  w3wService: What3wordsService

  // hard-coded options
  format: 'json' | 'geojson' = 'geojson'
  showGridZoomThreshold = 18
  w3wZoomBufferRadiusMeters = 100

  state: State = {
    center: null,
    extent: null,
    zoom: null,
    w3wAddress: null,
    w3wPoint: null
  }

  isConfigured = () => {
    return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1
  }

  componentDidMount () {
    const w3wConfig: {
      host: string
      apiVersion: ApiVersion
    } = {
      host: 'https://api.what3words.com',
      apiVersion: ApiVersion.Version3
    }
    this.w3wService = what3words(this.props.config.w3wApiKey, w3wConfig, { transport: axiosTransport() })
  }

  componentWillUnmount () {
    if (this.zoomWatch) {
      this.zoomWatch.remove()
      this.zoomWatch = null
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

  refreshAndZoom = async () => {
    this.refreshW3wGraphics()
    if (this.props.config.zoomToW3wSquare) {
      this.zoomToW3w()
    }
  }

  handleMapClick = async (mapClick: any) => {
    if (!this.props.config.useMapMidpoint) {
      await this.updateW3wAddress(mapClick.mapPoint as Point)
      this.fillW3wGridLayer()
      const hitTestResult = await this.view.hitTest(mapClick.mapPoint as Point)
      console.log('hitTestResult', hitTestResult)
    }
  }

  async stationaryWatchHandler (stationary: boolean, view: __esri.MapView | __esri.SceneView) {
    if (this.props.config.useMapMidpoint && stationary && this.state.center) {
      await this.updateW3wAddress(this.state.center)
    }
    if (stationary) {
      if (this.view.zoom >= this.showGridZoomThreshold && !this.compareExtents(this.view.extent, this.state.extent)) {
        this.setState({
          extent: this.view.extent
        }, this.fillW3wGridLayer)
      } else if (this.view.zoom < this.showGridZoomThreshold && this.w3wGridLayer) {
        this.w3wGridLayer.visible = false
      }
    }
  }

  compareExtents (oneExtent: Extent, anotherExtent: Extent): boolean {
    return oneExtent?.xmin === anotherExtent?.xmin && oneExtent?.xmax === anotherExtent?.xmax && oneExtent?.ymin === anotherExtent?.ymin && oneExtent?.ymax === anotherExtent?.ymax && oneExtent?.spatialReference.wkid === anotherExtent?.spatialReference.wkid
  }

  onActiveViewChange = (jimuMapView: JimuMapView) => {
    if (!jimuMapView) return
    this.view = jimuMapView.view

    this.w3wLayer = new GraphicsLayer({
      listMode: 'hide',
      id: 'w3wLayer'
    })
    this.view.map.add(this.w3wLayer)

    this.view.map.add(this.w3wGridLayer, this.view.map.layers.findIndex((item: __esri.Layer, index: number) => this.w3wLayer.id === item.id) - 1)

    this.view.on('click', this.handleMapClick)

    if (!this.stationaryWatch) {
      this.stationaryWatch = this.view.watch('stationary', (stationary) =>
        this.stationaryWatchHandler(stationary, this.view)
      )
    }
    if (!this.zoomWatch) {
      this.zoomWatch = this.view.watch('zoom', (zoom) => {
        this.setState({
          zoom
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
      }) as GridSectionGeoJsonResponse

      const w3wGridLines = this.getW3wGridLineGraphics(w3wGrid, wgs84Extent)

      const renderer = this.getRenderer(new Color([255, 0, 0, 0.8]))

      this.view.map.remove(this.w3wGridLayer)
      this.w3wGridLayer?.destroy()
      this.w3wGridLayer = new FeatureLayer({
        visible: true,
        objectIdField: 'id',
        fields: [
          {
            name: 'id',
            type: 'integer'
          },
          {
            name: 'value',
            type: 'double'
          },
          {
            name: 'norm',
            type: 'double'
          }
        ],
        id: 'w3wGridLayer',
        source: w3wGridLines,
        renderer
      })

      // add w3wGridLayer under w3wLayer
      this.view.map.add(this.w3wGridLayer, this.view.map.layers.findIndex((item: __esri.Layer, index: number) => this.w3wLayer.id === item.id) - 1)
    } else {
      this.w3wGridLayer?.destroy()
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

    // using a callback because setState is async!
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
        color: this.getW3wColorRgba(1),
        width: '2px',
        style: 'short-dot'
      } as unknown as __esri.Symbol
    })
    this.w3wLayer.graphics.add(w3wGraphic)
  }

  private readonly zoomToW3w = async () => {
    const w3wPoint = webMercatorUtils.geographicToWebMercator(this.state.w3wPoint)
    const w3wBuffer = geometryEngine.buffer(w3wPoint, this.w3wZoomBufferRadiusMeters, 'meters')

    await this.view.goTo({
      target: w3wBuffer
    })
  }

  private getW3wGridLineGraphics (w3wGrid: GridSectionGeoJsonResponse, wgs84Extent: __esri.Extent) {
    // "as any" is a workaround, because the GridSectionGeoJsonResponse is wrong: features prop is missing
    return (w3wGrid as any).features[0].geometry.coordinates.map((coordinate: any, index: number) => {
      let value = 1
      let norm = 1
      if (this.state.w3wPoint) {
        const gridCenterPoint = this.state.w3wPoint
        const rangeCenterToXmin = Math.abs(gridCenterPoint.x - wgs84Extent.xmin)
        const rangeCenterToXmax = Math.abs(gridCenterPoint.x - wgs84Extent.xmax)
        const rangeCenterToYmin = Math.abs(gridCenterPoint.y - wgs84Extent.ymin)
        const rangeCenterToYmax = Math.abs(gridCenterPoint.y - wgs84Extent.ymax)
        const isVertical = coordinate[0][0] === coordinate[1][0]

        if (isVertical) {
          // 1st member of a coordinate is X
          if (coordinate[0][0] <= gridCenterPoint.x) {
            // line is west of gridCenterPoint
            const gcpRange = Math.abs(coordinate[0][0] - wgs84Extent.xmin)
            value = rangeCenterToXmin - gcpRange
            norm = rangeCenterToXmin
          } else {
            // line is wast of gridCenterPoint
            const gcpRange = Math.abs(coordinate[0][0] - wgs84Extent.xmax)
            value = rangeCenterToXmax - gcpRange
            norm = rangeCenterToXmax
          }
        } else {
          // 2nd member of a coordinate is Y
          if (coordinate[0][1] <= gridCenterPoint.y) {
            // line is south of gridCenterPoint
            const gcpRange = Math.abs(coordinate[0][1] - wgs84Extent.ymin)
            value = rangeCenterToYmin - gcpRange
            norm = rangeCenterToYmin
          } else {
            // line is north of gridCenterPoint
            const gcpRange = Math.abs(coordinate[0][1] - wgs84Extent.ymax)
            value = rangeCenterToYmax - gcpRange
            norm = rangeCenterToYmax
          }
        }
      }

      return new Graphic({
        attributes: {
          id: index,
          value: value * 10000,
          norm: norm * 10000
        },
        geometry: {
          type: 'polyline',
          spatialReference: {
            wkid: 4326
          },
          paths: coordinate
        } as unknown as __esri.geometry.Polyline
      })
    })
  }

  private getRenderer (color: __esri.Color) {
    const defaultSym = {
      type: 'simple-line',
      width: '0.5px'
    }
    const renderer = {
      type: 'simple',
      symbol: defaultSym,
      label: 'w3wGrid',
      visualVariables: [
        {
          type: 'color',
          field: 'value',
          normalizationField: 'norm',
          legendOptions: {
            showLegend: false
          },
          stops: [
            {
              value: 0,
              color: 'rgba(230, 230, 230, 0.5)'
            },
            {
              value: 0.8,
              color: 'rgba(200, 100, 100, 0.6)'
            },
            {
              value: 1,
              color: this.getW3wColorRgba(0.8)
            }
          ]
        }
      ]
    } as unknown as __esri.SimpleRenderer
    return renderer
  }

  private getW3wColorRgba (opacity: number) {
    return `rgba(225, 31, 38, ${opacity})`
  }

  render () {
    const style = css`
      .w3wBlock {
        display:block;
        white-space:nowrap;
        overflow:hidden;
      }
      .w3wRed {
        color:#e11f26;
      }
      .w3wInfo {
        background:#00456b;
        width:100%;
        color:#fff;
      }
      .w3wInfoProp {
        display:inline-block;
        margin-right:20px;
      }
      .w3wInfoFirstCol {
        display:inline-block;
        margin-right:5px;
      }
      .float-right {
        float:right;
      }
      .w3wBtn {
        background:#00456b;
        color:#fff;
      }
      .w3wBtn:hover {
        background:#fff;
        color:#e11f26;
      }
    `

    if (!this.isConfigured()) {
      return 'Select a map'
    }

    return (
            <div className="custom-widget p-1" css={style}>
              {this.state.w3wAddress?.properties?.words && this.props.config.showZoomButton && (
                <Button onClick={this.zoomToW3w} className="esri-icon-zoom-in-magnifying-glass float-right w3wBtn" />
              )}

              <h3 className="w3wBlock">
                  <span className='w3wRed'>///</span>{this.state.w3wAddress?.properties?.words && (<FormattedMessage id={this.state.w3wAddress?.properties?.words ?? '.'} defaultMessage={this.state.w3wAddress?.properties?.words ?? '.'} />)}
              </h3>

              {{}.hasOwnProperty.call(this.props, 'useMapWidgetIds') &&
                  this.props.useMapWidgetIds &&
                  this.props.useMapWidgetIds.length === 1 && (
                      <JimuMapViewComponent
                          useMapWidgetId={this.props.useMapWidgetIds?.[0]}
                          onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>
              )}

              {this.props.config.showCoordinates &&
                <div className="w3wInfo">
                  <div className="w3wInfoProp"><span className='w3wRed w3wInfoFirstCol'>{defaultMessages.x}</span><span>{this.state.w3wPoint && this.state.w3wPoint.x}</span></div>
                  <div className="w3wInfoProp"><span className='w3wRed w3wInfoFirstCol'>{defaultMessages.y}</span><span>{this.state.w3wPoint && this.state.w3wPoint.y}</span></div>
                </div>
              }
            </div>
    )
  }
}
