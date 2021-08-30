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
import { useDropzone } from 'react-dropzone';
import { gpx } from '@tmcw/togeojson';

import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import defaultMessages from './translations/default';
import { Config } from '../config';

import { webMercatorToGeographic } from 'esri/geometry/support/webMercatorUtils';
import * as Point from 'esri/geometry/Point';
import * as GraphicsLayer from 'esri/layers/GraphicsLayer';
import * as Graphic from 'esri/Graphic';
import * as PictureMarkerSymbol from 'esri/symbols/PictureMarkerSymbol';
import * as Polygon from 'esri/geometry/Polygon';
import { Polyline } from 'esri/geometry';

const { useState, useEffect, useRef, useCallback } = React;

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget(props: AllWidgetProps<{ Config }>) {
    useEffect(() => {
        // queryFunc();
    }, []);

    let gpxLayer: GraphicsLayer;
    let jimuMapView: JimuMapView;

    const isConfigured = () => {
        return props.useMapWidgetIds && props.useMapWidgetIds.length === 1;
    };

    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach((file) => {
            const reader = new FileReader();

            reader.onabort = () => console.log('file reading was aborted');
            reader.onerror = () => console.log('file reading has failed');
            // reader.onload = () => {
            //     // Do whatever you want with the file contents
            //     const binaryStr = reader.result;
            //     console.log(binaryStr);
            // };
            // reader.readAsArrayBuffer(file);

            reader.readAsText(file);
            reader.onloadend = () => {
                parseGpx(reader.result.toString());
            };
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const parseGpx = (gpxText: string) => {
        const geoJson = gpx(new DOMParser().parseFromString(gpxText, 'text/xml'));
        console.log(geoJson);
        const esriFeatures: Graphic[] = geoJson?.features.map((feature: any) => {
            if (feature.geometry.type === 'LineString') {
                return new Graphic({
                    geometry: new Polyline({
                        hasZ: true,
                        hasM: false,
                        paths: feature.geometry.coordinates,
                        spatialReference: { wkid: 4326 },
                    }),
                    attributes: feature.properties,
                });
            }
        });
        addTrackToMap(esriFeatures);
    };

    const addTrackToMap = (esriFeatures: Graphic[]) => {
        gpxLayer = new GraphicsLayer({
            listMode: 'hide',
        });
        gpxLayer.addMany(esriFeatures);
        if (jimuMapView) {
            jimuMapView.view.map.add(gpxLayer);
            jimuMapView.view.goTo(esriFeatures);
        }
    };

    const activeViewChangeHandler = (jmv: JimuMapView) => {
        jimuMapView = jmv;
    };

    if (!isConfigured()) {
        return 'Select a map';
    }
    return (
        <div
            className="widget-gpx-upload"
            style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
            <h3>Drop this</h3>

            <div {...getRootProps()}>
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p>Drop the files here ...</p>
                ) : (
                    <p>Drag 'n' drop some files here, or click to select files</p>
                )}
            </div>

            {props.hasOwnProperty('useMapWidgetIds') && props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
                <JimuMapViewComponent
                    useMapWidgetId={props.useMapWidgetIds?.[0]}
                    onActiveViewChange={activeViewChangeHandler}
                />
            )}
        </div>
    );
}
