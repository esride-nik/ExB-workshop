/** @jsx jsx */
import { React, AllWidgetProps, FormattedMessage, jsx, BaseWidget } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import defaultMessages from './translations/default';
import { IMConfig } from '../config';

import webMercatorUtils from 'esri/geometry/support/webMercatorUtils';
import Point from 'esri/geometry/Point';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import Graphic from 'esri/Graphic';
import PictureMarkerSymbol from 'esri/symbols/PictureMarkerSymbol';
import Polygon from 'esri/geometry/Polygon';
import { NumericInput } from 'jimu-ui';
import LineSymbolMarker from 'esri/symbols/LineSymbolMarker';
import { Polyline } from 'esri/geometry';
import geometryEngine from 'esri/geometry/geometryEngine';
import SpatialReference from 'esri/geometry/SpatialReference';
import geometryEngineAsync from 'esri/geometry/geometryEngineAsync';
interface State {
    center: __esri.Point;
    angle: number;
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State> {
    mastStandortLayer: GraphicsLayer;

    state: State = {
        center: new Point({
            x: 8.6,
            y: 52.4,
            spatialReference: SpatialReference.WGS84
        }),
        angle: 20,
    };

    // state: State = {
    //     center: null,
    //     angle: null,
    // };
    mapView: __esri.MapView | __esri.SceneView;
    helperLayer: GraphicsLayer;

    constructor(props: any) {
        super(props);
    }

    isConfigured = () => {
        return this.props.useMapWidgetIds?.length === 1;
    };

    componentDidMount() {
        this.mastStandortLayer = new GraphicsLayer({
            listMode: 'hide',
        });
        this.helperLayer = new GraphicsLayer({
            listMode: 'hide',
        });
    }

    // handleMapClick = (mapClick: any) => {
    //     console.log('mapClick', mapClick);

    //     const pointGraphic = new Graphic({
    //         geometry: mapClick.mapPoint as Point,
    //     });
    //     console.log('pointGraphic', pointGraphic);
    // };


    getArrowSym() {
        return new LineSymbolMarker({
            color: "blue",
            placement: "begin-end",
            style: "arrow"
        });
    }

    getPointSym() {
        return {
            type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
            style: "square",
            color: "blue",
            size: "8px",  // pixels
            outline: {  // autocasts as new SimpleLineSymbol()
                color: [255, 255, 0],
                width: 3  // points
            }
        }
    }

    getFillSym() {
        return {
            type: "simple-fill",  // autocasts as new SimpleFillSymbol()
            color: [51, 51, 204, 0.9],
            style: "solid",
            outline: {  // autocasts as new SimpleLineSymbol()
                color: "white",
                width: 1
            }
        };
    }

    drawMast = async () => {
        if (!this.state.angle || !this.state.center) return;
        // jimuMapView.view.on('click', this.handleMapClick);

        this.mastStandortLayer.graphics.removeAll();
        this.mapView.map.remove(this.mastStandortLayer);
        this.helperLayer.graphics.removeAll();
        this.mapView.map.remove(this.helperLayer);

        const wmCenter = webMercatorUtils.geographicToWebMercator(this.state.center) as Point;
        const wmDistBufferRadius = geometryEngine.geodesicBuffer(wmCenter, this.props.config.radiusKm, 'kilometers') as Polygon;
        const wmDistBufferLine = {
            type: "polyline",
            paths: wmDistBufferRadius.rings,
            spatialReference: wmDistBufferRadius.spatialReference
        } as unknown as Polyline;
        const cutline = {
            type: "polyline",
            paths: [[
                [wmCenter.x, wmCenter.y],
                [wmCenter.x, wmCenter.y + 1000000],
            ]],
            spatialReference: wmCenter.spatialReference
        } as unknown as Polyline;

        // console.log('cutline length', cutline, geometryEngine.geodesicLength(cutline))
        // console.log('wmDistBufferLine length', wmDistBufferLine, geometryEngine.geodesicLength(wmDistBufferLine))
        // console.log('crosses', geometryEngine.crosses(cutline, wmDistBufferLine));
        const cutLines = geometryEngine.cut(cutline, wmDistBufferLine);
        const innerLine = cutLines[1] as Polyline;
        let angleRing = [[wmCenter.x, wmCenter.y]];

        // fixer Öffnungswinkel 120°
        for (let a = -60; a <= 60; a += 0.1) {
            const innerLineRotated = geometryEngine.rotate(innerLine, -a, wmCenter) as Polyline;
            angleRing.push([innerLineRotated.paths[0][1][0], innerLineRotated.paths[0][1][1]]);
        }
        angleRing.push([wmCenter.x, wmCenter.y]);
        const angleRingLine = {
            type: "polyline",
            paths: angleRing,
            spatialReference: wmCenter.spatialReference
        } as unknown as Polyline;

        // this.state.angle

        this.helperLayer.graphics.addMany([
            new Graphic({
                geometry: this.state.center,
                symbol: this.getPointSym()
            }),
            new Graphic({
                geometry: angleRingLine,
                symbol: this.getArrowSym()
            }),
            // new Graphic({
            //     geometry: cutLines[1],
            //     symbol: this.getArrowSym()
            // }),
        ])

        this.mapView.goTo(wmDistBufferRadius);

        this.mapView.map.add(this.helperLayer);


        // const hslPointArrow = new Graphic({
        //     geometry: polyline,
        //     symbol: this.getArrowSym() //logoSym,
        // });
        // console.log('arrowSym', hslPointArrow);
        // this.mastStandortLayer.graphics.add(hslPointArrow);
        // this.mapView.map.add(this.mastStandortLayer);

    }

    onActiveViewChange = (jimuMapView: JimuMapView) => {
        if (!jimuMapView) return;
        this.mapView = jimuMapView.view;
    };

    setX = (x: number) => this.setState({
        center: new Point({
            x: x,
            y: this.state.center?.y
        })
    })

    setY = (y: number) => this.setState({
        center: new Point({
            x: this.state.center?.x,
            y: y
        })
    })

    setAngle = (angle: number) => this.setState({
        angle
    })

    render() {
        if (!this.isConfigured()) {
            return <FormattedMessage id="selectAMap" defaultMessage={defaultMessages.selectAMap} />;
        }

        return (
            <div className="custom-widget p-3 m-4 surface-1">
                <h3>
                    <FormattedMessage id="maststandort" defaultMessage={defaultMessages.maststandort} />
                </h3>

                {this.props.hasOwnProperty('useMapWidgetIds') &&
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
                                defaultValue={this.state.center?.x}
                                onChange={this.setX}
                                onAcceptValue={this.drawMast}
                            /></td>
                        </tr>
                        <tr>
                            <td scope="row">Y</td>
                            <td><NumericInput
                                defaultValue={this.state.center?.y}
                                onChange={this.setY}
                                onAcceptValue={this.drawMast}
                            /></td>
                        </tr>
                        <tr>
                            <td scope="row"><FormattedMessage id="abstrahlwinkel" defaultMessage={defaultMessages.abstrahlwinkel} /></td>
                            <td><NumericInput
                                defaultValue={this.state.angle}
                                onChange={this.setAngle}
                                onAcceptValue={this.drawMast}
                            /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
