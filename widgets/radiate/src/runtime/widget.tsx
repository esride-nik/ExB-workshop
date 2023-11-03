/** @jsx jsx */
import { type AllWidgetProps, FormattedMessage, jsx, BaseWidget } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import defaultMessages from './translations/default'
import { type IMConfig } from '../config'

import webMercatorUtils from 'esri/geometry/support/webMercatorUtils'
import Point from 'esri/geometry/Point'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import Graphic from 'esri/Graphic'
import Polygon from 'esri/geometry/Polygon'
import { Button, NumericInput } from 'jimu-ui'
import { type Polyline } from 'esri/geometry'
import geometryEngine from 'esri/geometry/geometryEngine'
import SpatialReference from 'esri/geometry/SpatialReference'
import SimpleLineSymbol from 'esri/symbols/SimpleLineSymbol'
import Color from 'esri/Color'
import type SimpleMarkerSymbol from 'esri/symbols/SimpleMarkerSymbol'
import FeatureLayer from 'esri/layers/FeatureLayer'
import type UniqueValueRenderer from 'esri/renderers/UniqueValueRenderer'
interface State {
  x: number
  y: number
  angle: number
  color: string
  inputValid: boolean
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State> {
  mastStandortLayer: GraphicsLayer
  mapView: __esri.MapView | __esri.SceneView
  hslPolyFeatureLayer: FeatureLayer

  state: State = {
    x: null,
    y: null,
    angle: null,
    color: '#fff',
    inputValid: false
  }

  isConfigured = () => {
    return this.props.useMapWidgetIds?.length === 1
  }

  componentDidMount () {
    this.mastStandortLayer = new GraphicsLayer({
      listMode: 'show'
    })
    this.hslPolyFeatureLayer = new FeatureLayer({
      source: [],
      objectIdField: 'ObjectID',
      title: defaultMessages.abstrahlwinkel
    })

    this.setState({
      x: 6,
      y: 48,
      angle: 50,
      color: '#fff'
    }, this.checkInputValidity)
  }

  getArrowMarkerSym (color: string) {
    const fillColor = new Color(color)
    return {
      type: 'simple-marker',
      path: 'M 50,0 100,150 0,150 50,0 50,150 55,150 55,300 45,300 45,150 50,150 50,600 z',
      color: this.state.color,
      outline: {
        color: [fillColor.r, fillColor.g, fillColor.b, 1.0],
        width: 0.1
      },
      size: 150,
      angle: this.state.angle
    }
  }

  getPointSym (size: number) {
    return {
      type: 'simple-marker',
      style: 'square',
      color: 'blue',
      size: size / 4 + 'px', // pixels
      outline: {
        color: [255, 255, 0],
        width: 3 // points
      }
    } as unknown as SimpleMarkerSymbol
  }

  getPolySym (color: string) {
    const fillColor = new Color(color)
    return {
      type: 'simple-fill',
      color: [fillColor.r, fillColor.g, fillColor.b, 0.3],
      style: 'solid',
      outline: this.getLineSym()
    }
  }

  getLineSym () {
    return new SimpleLineSymbol({
      color: this.state.color,
      width: 1.5
    })
  }

  drawMast = async () => {
    if (!this.state.inputValid) return
    // jimuMapView.view.on('click', this.handleMapClick);

    this.mastStandortLayer.graphics.removeAll()
    this.mapView.map.remove(this.mastStandortLayer)

    const center = new Point({
      x: this.state.x,
      y: this.state.y,
      spatialReference: SpatialReference.WGS84
    })
    const wmCenter = webMercatorUtils.geographicToWebMercator(center) as Point
    const wmDistBufferRadius = geometryEngine.geodesicBuffer(wmCenter, this.props.config.radiusKm, 'kilometers') as Polygon
    const wmDistBufferLine = {
      type: 'polyline',
      paths: wmDistBufferRadius.rings,
      spatialReference: wmDistBufferRadius.spatialReference
    } as unknown as Polyline
    const wmCutline = {
      type: 'polyline',
      paths: [[
        [wmCenter.x, wmCenter.y],
        [wmCenter.x, wmCenter.y + 1000000]
      ]],
      spatialReference: wmCenter.spatialReference
    } as unknown as Polyline

    const cutLines = geometryEngine.cut(wmCutline, wmDistBufferLine)
    const innerLine = cutLines[1] as Polyline
    const angleRing = [[wmCenter.x, wmCenter.y]]

    // fixer Öffnungswinkel 120°
    for (let a = -60; a <= 60; a += 0.1) {
      const innerLineRotated = geometryEngine.rotate(innerLine, -a, wmCenter) as Polyline
      angleRing.push([innerLineRotated.paths[0][1][0], innerLineRotated.paths[0][1][1]])
    }
    angleRing.push([wmCenter.x, wmCenter.y])

    const anglePolygon = new Polygon({
      rings: [angleRing],
      spatialReference: wmCenter.spatialReference
    })

    const anglePolygonRotated = geometryEngine.rotate(anglePolygon, -this.state.angle, wmCenter)
    const sampleGraphics = this.getSamplePoints()

    this.fillHslFeatureLayer(anglePolygonRotated)

    this.mastStandortLayer.graphics.addMany([
      ...sampleGraphics,
      new Graphic({
        geometry: wmCenter,
        symbol: this.getArrowMarkerSym(this.state.color)
      })
    ])

    this.mapView.goTo(anglePolygonRotated)
    this.mapView.map.add(this.hslPolyFeatureLayer)
    this.mapView.map.add(this.mastStandortLayer)
  }

  onActiveViewChange = (jimuMapView: JimuMapView) => {
    if (!jimuMapView) return
    this.mapView = jimuMapView.view
  }

  checkInputValidity = () => {
    const valid = this.state.x !== null &&
            this.state.y !== null &&
            this.state.color?.length > 0 &&
            this.state.angle !== null
    this.setState({
      inputValid: valid
    })
  }

  setX = (x: number) => {
    this.setState({
      x
    }, this.checkInputValidity)
  }

  setY = (y: number) => {
    this.setState({
      y
    }, this.checkInputValidity)
  }

  setAngle = (angle: number) => {
    this.setState({
      angle
    }, this.checkInputValidity)
  }

  setColor = (colorPicker: any) => {
    this.setState({
      color: colorPicker?.target?.value
    }, this.checkInputValidity)
  }

  private fillHslFeatureLayer (anglePolygonRotated: __esri.Geometry) {
    this.hslPolyFeatureLayer.source.add(new Graphic({
      geometry: anglePolygonRotated,
      attributes: {
        name: 'feature1',
        ObjectID: 0
      }
    }) as unknown as Graphic)

    const renderer = {
      type: 'unique-value',
      field: 'name',
      defaultSymbol: this.getPolySym(this.state.color),
      uniqueValueInfos: [{
        value: 'feature1',
        symbol: this.getPolySym(this.state.color)
      }]
    } as unknown as UniqueValueRenderer
    this.hslPolyFeatureLayer.renderer = renderer
  }

  private getSamplePoints () {
    return this.sampleFeatures.map((sampleFeature: any) => {
      sampleFeature.geometry.spatialReference = SpatialReference.WebMercator
      sampleFeature.geometry.type = 'point'
      sampleFeature.symbol = this.getPointSym(parseInt(sampleFeature.attributes.signal) * -1)
      return sampleFeature as unknown as Graphic
    })
  }

  render () {
    if (!this.isConfigured()) {
      return <FormattedMessage id="selectAMap" defaultMessage={defaultMessages.selectAMap} />
    }

    return (
            <div className="custom-widget p-3 m-4 surface-1">
                <h3>
                    <FormattedMessage id="maststandort" defaultMessage={defaultMessages.maststandort} />
                </h3>

                {{}.hasOwnProperty.call(this.props, 'useMapWidgetIds') &&
                    this.props.useMapWidgetIds?.length === 1 && (
                        <JimuMapViewComponent
                            useMapWidgetId={this.props.useMapWidgetIds?.[0]}
                            onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>
                )}

                <table className="table table-striped">
                    <tbody>
                        <tr>
                            <td scope="row">X</td>
                            <td><NumericInput
                                defaultValue={this.state.x}
                                onChange={this.setX}
                            /></td>
                        </tr>
                        <tr>
                            <td scope="row">Y</td>
                            <td><NumericInput
                                defaultValue={this.state.y}
                                onChange={this.setY}
                            /></td>
                        </tr>
                        <tr>
                            <td scope="row"><FormattedMessage id="abstrahlwinkel" defaultMessage={defaultMessages.abstrahlwinkel} /></td>
                            <td><NumericInput
                                defaultValue={this.state.angle}
                                onChange={this.setAngle}
                            /></td>
                        </tr>
                        <tr>
                            <td scope="row"><FormattedMessage id="favcolor" defaultMessage={defaultMessages.favcolor} /></td>
                            <td><input type="color" id="favcolor" name="favcolor" value={this.state.color} onChange={this.setColor}></input></td>
                        </tr>
                    </tbody>
                </table>

                <Button onClick={this.drawMast} disabled={!this.state.inputValid}>
                    <FormattedMessage
                        id={defaultMessages.drawMast}
                        defaultMessage={defaultMessages.drawMast}
                    />
                </Button>

            </div>
    )
  }

  sampleFeatures = [
    {
      attributes: {
        OBJECTID: 1,
        id: 29070514,
        timestamp: 1578556800000,
        geo_n: 49.5795,
        geo_e: 7.6843,
        signal: -82,
        fkcell: 75648,
        source_id: 1,
        max_sig: -73,
        signal_quality: 10
      },
      geometry:
          {
            x: 855417.63185425557,
            y: 6373763.3239450436
          }
    },
    {
      attributes: {
        OBJECTID: 2,
        id: 29070555,
        timestamp: 1578556800000,
        geo_n: 49.5791,
        geo_e: 7.685,
        signal: -83,
        fkcell: 75648,
        source_id: 1,
        max_sig: -67,
        signal_quality: 17
      },
      geometry:
          {
            x: 855484.8585853033,
            y: 6373694.0121365078
          }
    },
    {
      attributes: {
        OBJECTID: 3,
        id: 29070576,
        timestamp: 1578556800000,
        geo_n: 49.5791,
        geo_e: 7.6856,
        signal: -81,
        fkcell: 75648,
        source_id: 1,
        max_sig: -70,
        signal_quality: 22
      },
      geometry:
          {
            x: 855561.63574942283,
            y: 6373693.39871009
          }
    },
    {
      attributes: {
        OBJECTID: 4,
        id: 29070755,
        timestamp: 1578556800000,
        geo_n: 49.5783,
        geo_e: 7.6874,
        signal: -88,
        fkcell: 75648,
        source_id: 1,
        max_sig: -74,
        signal_quality: 6
      },
      geometry:
          {
            x: 855762.883466343,
            y: 6373557.1190677416
          }
    },
    {
      attributes: {
        OBJECTID: 5,
        id: 29070804,
        timestamp: 1578556800000,
        geo_n: 49.5783,
        geo_e: 7.6881,
        signal: -87,
        fkcell: 75648,
        source_id: 1,
        max_sig: -75,
        signal_quality: 0
      },
      geometry:
          {
            x: 855831.32079685177,
            y: 6373556.0170471165
          }
    },
    {
      attributes: {
        OBJECTID: 6,
        id: 29070853,
        timestamp: 1578556800000,
        geo_n: 49.5787,
        geo_e: 7.6869,
        signal: -85,
        fkcell: 75648,
        source_id: 1,
        max_sig: -70,
        signal_quality: 0
      },
      geometry:
          {
            x: 855697.66059744917,
            y: 6373625.9644842539
          }
    },
    {
      attributes: {
        OBJECTID: 7,
        id: 29071158,
        timestamp: 1578556800000,
        geo_n: 49.5783,
        geo_e: 7.6807,
        signal: -74,
        fkcell: 75648,
        source_id: 1,
        max_sig: -66,
        signal_quality: 0
      },
      geometry:
          {
            x: 855006.71610282164,
            y: 6373556.946528282
          }
    },
    {
      attributes: {
        OBJECTID: 8,
        id: 29071205,
        timestamp: 1578556800000,
        geo_n: 49.5779,
        geo_e: 7.68,
        signal: -74,
        fkcell: 75648,
        source_id: 1,
        max_sig: -68,
        signal_quality: 6
      },
      geometry:
          {
            x: 854931.46691003512,
            y: 6373486.9321972737
          }
    },
    {
      attributes: {
        OBJECTID: 9,
        id: 29071245,
        timestamp: 1578556800000,
        geo_n: 49.5775,
        geo_e: 7.68,
        signal: -74,
        fkcell: 75648,
        source_id: 1,
        max_sig: -64,
        signal_quality: 0
      },
      geometry:
          {
            x: 854929.64817219193,
            y: 6373420.0323508233
          }
    }
  ]
}
