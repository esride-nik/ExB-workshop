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
import { Button, NumericInput } from 'jimu-ui';
import LineSymbolMarker from 'esri/symbols/LineSymbolMarker';
import { Polyline } from 'esri/geometry';
import geometryEngine from 'esri/geometry/geometryEngine';
import SpatialReference from 'esri/geometry/SpatialReference';
import SimpleLineSymbol from 'esri/symbols/SimpleLineSymbol';
import SimpleMarkerSymbol from 'esri/symbols/SimpleMarkerSymbol';
import SimpleRenderer from 'esri/renderers/SimpleRenderer';
interface State {
    center: __esri.Point;
    angle: number;
    inputValid: boolean;
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State> {
    mastStandortLayer: GraphicsLayer;

    state: State = {
        center: null,
        angle: null,
        inputValid: false
    };
    mapView: __esri.MapView | __esri.SceneView;

    constructor(props: any) {
        super(props);
    }

    isConfigured = () => {
        return this.props.useMapWidgetIds?.length === 1;
    };

    componentDidMount() {
        this.mastStandortLayer = new GraphicsLayer({
            listMode: 'show',
        });

        // this.setState({
        //     center: new Point({
        //         x: 8.6,
        //         y: 52.4,
        //         spatialReference: SpatialReference.WGS84
        //     }),
        //     angle: 20
        // });
        // this.checkInputValidity();
    }

    // handleMapClick = (mapClick: any) => {
    //     console.log('mapClick', mapClick);

    //     const pointGraphic = new Graphic({
    //         geometry: mapClick.mapPoint as Point,
    //     });
    //     console.log('pointGraphic', pointGraphic);
    // };

    getArrowMarkerSym() {
        return {
            type: "simple-marker",
            path: "M 50,0 100,150 0,150 50,0 50,150 55,150 55,300 45,300 45,150 50,150 50,600 z",
            color: [0, 0, 255, 1.0],
            outline: {
                color: [0, 0, 255, 1.0],
                width: 0.1
            },
            size: 150,
            angle: this.state.angle
        }
    }

    getPointSym() {
        return {
            type: "simple-marker",
            style: "square",
            color: "blue",
            size: "8px",  // pixels
            outline: {
                color: [255, 255, 0],
                width: 3  // points
            }
        }
    }

    getPolySym() {
        return {
            type: "simple-fill",  // autocasts as new SimpleFillSymbol()
            color: [0, 0, 255, 0.3],
            style: "solid",
            outline: this.getLineSym()
        };
    }

    getLineSym() {
        return new SimpleLineSymbol({
            color: [0, 0, 255, 1.0],
            width: 1.5
        });
    }

    drawMast = async () => {
        if (!this.state.angle || !this.state.center) return;
        // jimuMapView.view.on('click', this.handleMapClick);

        this.mastStandortLayer.graphics.removeAll();
        this.mapView.map.remove(this.mastStandortLayer);

        const wmCenter = webMercatorUtils.geographicToWebMercator(this.state.center) as Point;
        const wmDistBufferRadius = geometryEngine.geodesicBuffer(wmCenter, this.props.config.radiusKm, 'kilometers') as Polygon;
        const wmDistBufferLine = {
            type: "polyline",
            paths: wmDistBufferRadius.rings,
            spatialReference: wmDistBufferRadius.spatialReference
        } as unknown as Polyline;
        const wmCutline = {
            type: "polyline",
            paths: [[
                [wmCenter.x, wmCenter.y],
                [wmCenter.x, wmCenter.y + 1000000],
            ]],
            spatialReference: wmCenter.spatialReference
        } as unknown as Polyline;

        const cutLines = geometryEngine.cut(wmCutline, wmDistBufferLine);
        const innerLine = cutLines[1] as Polyline;
        let angleRing = [[wmCenter.x, wmCenter.y]];

        // fixer Öffnungswinkel 120°
        for (let a = -60; a <= 60; a += 0.1) {
            const innerLineRotated = geometryEngine.rotate(innerLine, -a, wmCenter) as Polyline;
            angleRing.push([innerLineRotated.paths[0][1][0], innerLineRotated.paths[0][1][1]]);
        }
        angleRing.push([wmCenter.x, wmCenter.y]);

        const anglePolygon = new Polygon({
            rings: [angleRing],
            spatialReference: wmCenter.spatialReference
        })

        const anglePolygonRotated = geometryEngine.rotate(anglePolygon, -this.state.angle, wmCenter);

        this.mastStandortLayer.graphics.addMany([
            new Graphic({
                geometry: anglePolygonRotated,
                symbol: this.getPolySym()
            }),
            new Graphic({
                geometry: this.state.center,
                symbol: this.getArrowMarkerSym()
            })
        ])

        this.mapView.goTo(anglePolygonRotated);
        this.mapView.map.add(this.mastStandortLayer);
    }

    onActiveViewChange = (jimuMapView: JimuMapView) => {
        if (!jimuMapView) return;
        this.mapView = jimuMapView.view;
    };

    checkInputValidity = () => {
        const valid = this.state.center?.x !== undefined
            && this.state.center?.y !== undefined
            && this.state.angle !== undefined;
        this.setState({
            inputValid: valid
        })
    }

    setX = (x: number) => {
        this.setState({
            center: new Point({
                x: x,
                y: this.state.center?.y
            })
        })
        this.checkInputValidity();
    }

    setY = (y: number) => {
        this.setState({
            center: new Point({
                x: this.state.center?.x,
                y: y
            })
        })
        this.checkInputValidity();
    }

    setAngle = (angle: number) => {
        this.setState({
            angle
        })
        this.checkInputValidity();
    }

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
                            /></td>
                        </tr>
                        <tr>
                            <td scope="row">Y</td>
                            <td><NumericInput
                                defaultValue={this.state.center?.y}
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
                    </tbody>
                </table>

                <Button onClick={this.drawMast} disabled={!this.state.inputValid}>
                    <FormattedMessage
                        id={defaultMessages.drawMast}
                        defaultMessage={defaultMessages.drawMast}
                    />
                </Button>
            </div>
        );
    }
}
