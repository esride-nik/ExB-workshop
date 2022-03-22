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

const w3wApi = require('@what3words/api');

interface State {
    center: __esri.Point;
    angle: number;
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State> {
    w3wLayer: GraphicsLayer;

    state: State = {
        center: null,
        angle: null,
    };
    mapView: __esri.MapView | __esri.SceneView;

    constructor(props: any) {
        super(props);
    }

    isConfigured = () => {
        return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1;
    };

    componentDidMount() {
        w3wApi.setOptions({ key: this.props.config.w3wApiKey });
        this.w3wLayer = new GraphicsLayer({
            listMode: 'hide',
        });
    }

    handleMapClick = (mapClick: any) => {
        console.log('mapClick', mapClick);

        const pointGraphic = new Graphic({
            geometry: mapClick.mapPoint as Point,
        });
        console.log('pointGraphic', pointGraphic);
    };

    async stationaryWatchHandler(stationary: boolean, jimuMapView: JimuMapView) {
        jimuMapView.view.on('click', this.handleMapClick);

        if (stationary && this.state.center) {
            let geoPoint = webMercatorUtils.webMercatorToGeographic(this.state.center) as Point;
            if (geoPoint) {
                const w3wAddress = await w3wApi.convertTo3wa({
                    lat: geoPoint.y,
                    lng: geoPoint.x,
                });

                this.setState({
                    w3wAddress,
                });
                if (this.props.config.w3wOnMap) {
                    const textSym = {
                        type: 'text',
                        text: w3wAddress.words,
                        font: { size: 12 },
                        horizontalAlignment: 'left',
                        kerning: true,
                        rotated: false,
                        color: [225, 31, 38, 1],
                        xoffset: 10,
                        yoffset: -4,
                    };
                    const w3wtext = new Graphic({
                        geometry: geoPoint,
                        symbol: textSym,
                    });
                    this.w3wLayer.graphics.add(w3wtext);
                    const logoSym = {
                        type: 'picture-marker',
                        url:
                            'data:image/svg+xml;base64,' +
                            'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDYuMjcyNSAxNDYuMjcyNSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNlMTFmMjY7fS5jbHMtMntmaWxsOiNmZmY7fS5jbHMtM3tmaWxsOm5vbmU7fTwvc3R5bGU+PC9kZWZzPjxnIGlkPSJMYXllcl8yIiBkYXRhLW5hbWU9IkxheWVyIDIiPjxnIGlkPSJhcnR3b3JrIj48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMTcuMDIwNiwyOS4yNTIySDI5LjI1NDl2ODcuNzY1Nmg4Ny43NjU3VjI5LjI1MjJaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNjcuNjUyNSw5Mi4zMzQ2YTIuNzQ1NSwyLjc0NTUsMCwwLDEtMi42MDItMy42MUw3Ni4wMjEyLDU1LjgxMmEyLjc0MjksMi43NDI5LDAsMCwxLDUuMjA0MSwxLjczNTZMNzAuMjU0Niw5MC40NkEyLjc0MjksMi43NDI5LDAsMCwxLDY3LjY1MjUsOTIuMzM0NloiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik01MS4xOTY1LDkyLjMzNDZhMi43NDU2LDIuNzQ1NiwwLDAsMS0yLjYwMjEtMy42MUw1OS41NjUxLDU1LjgxMmEyLjc0MywyLjc0MywwLDAsMSw1LjIwNDIsMS43MzU2TDUzLjc5ODUsOTAuNDZBMi43NDI5LDIuNzQyOSwwLDAsMSw1MS4xOTY1LDkyLjMzNDZaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNODQuMTA4Niw5Mi4zMzQ2YTIuNzQ1NiwyLjc0NTYsMCwwLDEtMi42MDIxLTMuNjFMOTIuNDc3Miw1NS44MTJhMi43NDMsMi43NDMsMCwwLDEsNS4yMDQyLDEuNzM1Nkw4Ni43MTA3LDkwLjQ2QTIuNzQzLDIuNzQzLDAsMCwxLDg0LjEwODYsOTIuMzM0NloiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHdpZHRoPSIxNDYuMjcyNSIgaGVpZ2h0PSIxNDYuMjcyNSIvPjwvZz48L2c+PC9zdmc+',
                        contentType: 'image/svg',
                        width: 25,
                        height: 25,
                    } as unknown as PictureMarkerSymbol;
                    const w3wlogo = new Graphic({
                        geometry: geoPoint,
                        symbol: logoSym,
                    });
                    this.w3wLayer.graphics.add(w3wlogo);
                }
                if (this.props.config.showW3wSquare) {
                    const east = w3wAddress.square.northeast.lng;
                    const north = w3wAddress.square.northeast.lat;
                    const west = w3wAddress.square.southwest.lng;
                    const south = w3wAddress.square.southwest.lat;
                    const w3wGraphic = new Graphic({
                        geometry: new Polygon({
                            rings: [
                                [
                                    [west, north],
                                    [east, north],
                                    [east, south],
                                    [west, south],
                                    [west, north],
                                ],
                            ],
                            spatialReference: geoPoint.spatialReference, // WGS84
                        }),
                        symbol: {
                            type: 'simple-line',
                            color: [225, 31, 38, 1],
                            width: '2px',
                            style: 'short-dot',
                        },
                    });
                    this.w3wLayer.graphics.add(w3wGraphic);
                }
            }
            jimuMapView.view.map.add(this.w3wLayer);
        } else {
            this.w3wLayer.graphics.removeAll();
            jimuMapView.view.map.remove(this.w3wLayer);
        }
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
            </div>
        );
    }
}
