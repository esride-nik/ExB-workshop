import {
    React,
    IMDataSourceInfo,
    DataSource,
    DataSourceManager,
    DataSourceStatus,
    FeatureLayerQueryParams,
    AllWidgetProps,
    DataSourceComponent,
} from 'jimu-core';

import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import defaultMessages from './translations/default';
import { Config } from '../config';

import { webMercatorToGeographic } from 'esri/geometry/support/webMercatorUtils';
import * as Point from 'esri/geometry/Point';
import * as GraphicsLayer from 'esri/layers/GraphicsLayer';
import * as Graphic from 'esri/Graphic';
import * as PictureMarkerSymbol from 'esri/symbols/PictureMarkerSymbol';
import * as Polygon from 'esri/geometry/Polygon';

const { useState, useEffect, useRef } = React;

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget(props: AllWidgetProps<{ Config }>) {
    const [query, setQuery] = useState<FeatureLayerQueryParams>(null);
    const cityNameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // queryFunc();
    }, []);

    const isConfigured = () => {
        return props.useMapWidgetIds && props.useMapWidgetIds.length === 1;
    };

    if (!isConfigured()) {
        return 'Select a map';
    }
    return (
        <div
            className="widget-gpx-upload"
            style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
            <h3>Drop this</h3>
            {console.log('Drop this', props.config)}

            {/* <DataSourceComponent useDataSource={props.useDataSources[0]} query={query} widgetId={props.id} queryCount>
                {dataRender}
            </DataSourceComponent> */}

            {/* return <div className="widget-w3w p-3 m-4 surface-1">Drop this</div>; */}
        </div>
    );
}
