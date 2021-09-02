import { React, AllWidgetProps } from 'jimu-core';
import { useDropzone } from 'react-dropzone';
import { gpx } from '@tmcw/togeojson';

import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';

import * as GraphicsLayer from 'esri/layers/GraphicsLayer';
import * as Graphic from 'esri/Graphic';
import * as geometryEngine from 'esri/geometry/geometryEngine';
import { Polygon, Polyline } from 'esri/geometry';
import * as Geometry from 'esri/geometry/Geometry';
import { geographicToWebMercator } from 'esri/geometry/support/webMercatorUtils';
import * as Layer from 'esri/layers/Layer';
import * as FeatureLayer from 'esri/layers/FeatureLayer';

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
        console.log('geoJson', geoJson);
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

        // produktiv bitte Array-Inhalt verifizieren
        createBuffer(esriFeatures.map((graphic: Graphic) => geographicToWebMercator(graphic.geometry)));
    };

    const createBuffer = async (inputGeometries: Geometry[]) => {
        const buffers = geometryEngine.buffer(inputGeometries, 50, 'meters', true) as Polygon[];
        const oneBuffer = buffers.length > 0 ? buffers[0] : null;
        if (oneBuffer) {
            let polygonSymbol = {
                type: 'simple-fill',
                color: [51, 51, 204, 0.9],
                style: 'solid',
                outline: {
                    color: 'white',
                    width: 1,
                },
            };
            const bufferGraphic = new Graphic({
                geometry: oneBuffer,
                symbol: polygonSymbol,
            });
            gpxLayer.add(bufferGraphic);

            const polygonLayer = findPolygonLayer();
            const polyQuery = polygonLayer.createQuery();
            polyQuery.geometry = oneBuffer;
            const featuresUnderBuffer = await polygonLayer.queryFeatures(polyQuery);
            console.log('featuresUnderBuffer', featuresUnderBuffer);

            console.log(
                'fieldNames',
                featuresUnderBuffer.fields.map((f) => f.alias)
            );
            // Valider Feldname: 'anzahl_ges'
            const anzahlGes = featuresUnderBuffer.features.map((f) => f.attributes['anzahl_ges']);

            const reducer = (accumulator, currentValue) => accumulator + currentValue;
            const anzahlGesSum = anzahlGes.reduce(reducer);
            console.log('Gesamtanzahl der Coronafälle in durchjoggten Stadtteilen', anzahlGesSum);
        }
    };

    const findPolygonLayer = (): FeatureLayer => {
        console.log(
            'item types',
            jimuMapView.view.map.allLayers.items.map((item) => item.type)
        );

        const featureLayers = jimuMapView.view.map.allLayers.items.filter((layer: Layer) => layer.type === 'feature');
        console.log('featureLayers only', featureLayers);

        const polygonLayers = featureLayers.filter((fl: FeatureLayer) => fl.geometryType === 'polygon');
        console.log('polygonLayers only', polygonLayers);

        // nehmen wir einfach mal den ersten
        return polygonLayers[0];
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
