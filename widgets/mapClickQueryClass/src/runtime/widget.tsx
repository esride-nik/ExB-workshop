/** @jsx jsx */
import { React, AllWidgetProps, FormattedMessage, jsx, BaseWidget } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import defaultMessages from './translations/default';
import { IMConfig } from '../config';

import { webMercatorToGeographic } from 'esri/geometry/support/webMercatorUtils';
import * as Point from 'esri/geometry/Point';
import * as GraphicsLayer from 'esri/layers/GraphicsLayer';
import * as Graphic from 'esri/Graphic';
import * as PictureMarkerSymbol from 'esri/symbols/PictureMarkerSymbol';
import * as Polygon from 'esri/geometry/Polygon';

interface State {
    point: __esri.Point;
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State> {
    state: State = {
        point: null,
    };
    jimuMapView: JimuMapView;

    constructor(props: any) {
        super(props);
    }

    isConfigured = () => {
        return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1;
    };

    componentDidMount() {}

    componentWillUnmount() {}

    handleMapClick = (mapClick: any) => {
        console.log('mapClick', mapClick);

        const point = mapClick.mapPoint as Point;
        const pointGraphic = new Graphic({
            geometry: point,
        });
        this.setState({
            point: point,
        });
        console.log('pointGraphic', pointGraphic);
    };

    onActiveViewChange = (jimuMapView: JimuMapView) => {
        if (!jimuMapView) return;
        this.jimuMapView = jimuMapView;

        jimuMapView.view.on('click', this.handleMapClick);
    };

    render() {
        if (!this.isConfigured()) {
            return 'Select a map';
        }

        return (
            <div className="widget-w3w p-3 m-4 surface-1">
                <h3>
                    <FormattedMessage id="mcq" />
                </h3>
                {this.props.hasOwnProperty('useMapWidgetIds') &&
                    this.props.useMapWidgetIds &&
                    this.props.useMapWidgetIds.length === 1 && (
                        <JimuMapViewComponent
                            useMapWidgetId={this.props.useMapWidgetIds?.[0]}
                            onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>
                    )}
                <FormattedMessage id="clickPoint" />: {this.state.point && this.state.point.x} /{' '}
                {this.state.point && this.state.point.y}
            </div>
        );
    }
}