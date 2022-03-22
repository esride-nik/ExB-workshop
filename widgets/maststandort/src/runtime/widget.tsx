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

    drawMast = () => {
        if (!this.state.angle || !this.state.center) return;
        // jimuMapView.view.on('click', this.handleMapClick);

        const wmCenter = webMercatorUtils.geographicToWebMercator(this.state.center);
        // const offsetWmCenter = geometryEngine.offset(wmCenter, this.props.config.radiusKm, 'kilometers');

        const distBufferRadius = geometryEngine.geodesicBuffer(wmCenter, this.props.config.radiusKm, 'kilometers') as Polygon;
        // const distBufferRadius = geometryEngine.buffer(wmCenter, this.props.config.radiusKm, 'kilometers') as Polygon;
        // const distPointRadius = geometryEngine.offset(this.state.center, this.props.config.radiusKm) as Point;
        const offsetWmCenter = geometryEngine.offset(distBufferRadius, this.props.config.radiusKm, 'kilometers');

        // First create a line geometry (this is the Keystone pipeline)
        const cutline = {
            type: "polyline", // autocasts as new Polyline()
            paths: [
                [this.state.center.x, this.state.center.y],
                [this.state.center.x, 90],
            ],
            spatialReference: SpatialReference.WGS84
        } as unknown as Polyline;
        const outerPoint = geometryEngine.intersect(distBufferRadius, cutline) as Point;

        this.helperLayer.graphics.addMany([
            new Graphic({
                geometry: this.state.center,
                symbol: this.getPointSym()
            }),
            new Graphic({
                geometry: offsetWmCenter,
                symbol: this.getPointSym()
            }),
            new Graphic({
                geometry: cutline,
                symbol: this.getArrowSym()
            }),
            new Graphic({
                geometry: distBufferRadius,
                symbol: this.getFillSym()
            }),
        ])
        
        this.mapView.goTo(distBufferRadius);

        // // First create a line geometry (this is the Keystone pipeline)
        // const polyline = {
        //     type: "polyline", // autocasts as new Polyline()
        //     paths: [
        //         [this.state.center.x, this.state.center.y],
        //         [outerPoint.x, outerPoint.y],
        //     ],
        //     spatialReference: SpatialReference.WGS84
        // } as unknown as Polyline;


        // // const logoSym = {
        // //     type: 'picture-marker',
        // //     url:
        // //         'data:image/svg+xml;base64,' +
        // //         'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDYuMjcyNSAxNDYuMjcyNSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNlMTFmMjY7fS5jbHMtMntmaWxsOiNmZmY7fS5jbHMtM3tmaWxsOm5vbmU7fTwvc3R5bGU+PC9kZWZzPjxnIGlkPSJMYXllcl8yIiBkYXRhLW5hbWU9IkxheWVyIDIiPjxnIGlkPSJhcnR3b3JrIj48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMTcuMDIwNiwyOS4yNTIySDI5LjI1NDl2ODcuNzY1Nmg4Ny43NjU3VjI5LjI1MjJaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNjcuNjUyNSw5Mi4zMzQ2YTIuNzQ1NSwyLjc0NTUsMCwwLDEtMi42MDItMy42MUw3Ni4wMjEyLDU1LjgxMmEyLjc0MjksMi43NDI5LDAsMCwxLDUuMjA0MSwxLjczNTZMNzAuMjU0Niw5MC40NkEyLjc0MjksMi43NDI5LDAsMCwxLDY3LjY1MjUsOTIuMzM0NloiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik01MS4xOTY1LDkyLjMzNDZhMi43NDU2LDIuNzQ1NiwwLDAsMS0yLjYwMjEtMy42MUw1OS41NjUxLDU1LjgxMmEyLjc0MywyLjc0MywwLDAsMSw1LjIwNDIsMS43MzU2TDUzLjc5ODUsOTAuNDZBMi43NDI5LDIuNzQyOSwwLDAsMSw1MS4xOTY1LDkyLjMzNDZaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNODQuMTA4Niw5Mi4zMzQ2YTIuNzQ1NiwyLjc0NTYsMCwwLDEtMi42MDIxLTMuNjFMOTIuNDc3Miw1NS44MTJhMi43NDMsMi43NDMsMCwwLDEsNS4yMDQyLDEuNzM1Nkw4Ni43MTA3LDkwLjQ2QTIuNzQzLDIuNzQzLDAsMCwxLDg0LjEwODYsOTIuMzM0NloiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHdpZHRoPSIxNDYuMjcyNSIgaGVpZ2h0PSIxNDYuMjcyNSIvPjwvZz48L2c+PC9zdmc+',
        // //     contentType: 'image/svg',
        // //     width: 25,
        // //     height: 25,
        // // } as unknown as PictureMarkerSymbol;
        // const hslPointArrow = new Graphic({
        //     geometry: polyline,
        //     symbol: this.getArrowSym() //logoSym,
        // });
        // console.log('arrowSym', hslPointArrow);
        // this.mastStandortLayer.graphics.add(hslPointArrow);
        // this.mapView.map.add(this.mastStandortLayer);






        this.mapView.map.add(this.helperLayer);


        // } else {
        //     this.mastStandortLayer.graphics.removeAll();
        //     this.mapView.map.remove(this.mastStandortLayer);
        // }
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
