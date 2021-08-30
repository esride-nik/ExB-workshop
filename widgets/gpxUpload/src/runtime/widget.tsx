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

import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import defaultMessages from './translations/default';
import { Config } from '../config';

import { webMercatorToGeographic } from 'esri/geometry/support/webMercatorUtils';
import * as Point from 'esri/geometry/Point';
import * as GraphicsLayer from 'esri/layers/GraphicsLayer';
import * as Graphic from 'esri/Graphic';
import * as PictureMarkerSymbol from 'esri/symbols/PictureMarkerSymbol';
import * as Polygon from 'esri/geometry/Polygon';

const { useState, useEffect, useRef, useCallback } = React;

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget(props: AllWidgetProps<{ Config }>) {
    useEffect(() => {
        // queryFunc();
    }, []);

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
                console.log(reader.result);
                // var xmlData = $(reader.result);
            };
        });
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
        </div>
    );
}
