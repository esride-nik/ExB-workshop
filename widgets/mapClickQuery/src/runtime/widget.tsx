import { React, AllWidgetProps } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import Graphic from 'esri/Graphic';
import { Point } from 'esri/geometry';

const { useState, useEffect, useRef, useCallback } = React;

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget(props: AllWidgetProps<{ Config }>) {
    const [anzahlGesSum, setAnzahlGesSum] = useState<number>(0);

    useEffect(() => {
        // queryFunc();
    }, []);

    let jimuMapView: JimuMapView;

    const isConfigured = () => {
        return props.useMapWidgetIds && props.useMapWidgetIds.length === 1;
    };

    const activeViewChangeHandler = (jmv: JimuMapView) => {
        jimuMapView = jmv;

        jmv.view.on('click', handleMapClick);
    };

    const handleMapClick = (mapClick: any) => {
        console.log('mapClick', mapClick);

        const pointGraphic = new Graphic({
            geometry: mapClick.mapPoint as Point,
        });
        console.log('pointGraphic', pointGraphic);
    };

    if (!isConfigured()) {
        return 'Select a map';
    }
    return (
        <div
            className="widget-map-click"
            style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
            {props.hasOwnProperty('useMapWidgetIds') && props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
                <JimuMapViewComponent
                    useMapWidgetId={props.useMapWidgetIds?.[0]}
                    onActiveViewChange={activeViewChangeHandler}
                />
            )}
        </div>
    );
}
