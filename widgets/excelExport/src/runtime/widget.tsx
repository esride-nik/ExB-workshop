import { React, AllWidgetProps } from 'jimu-core';
import defaultMessages from './translations/default';

import XLSX from 'xlsx';
import * as Graphic from 'esri/Graphic';
import * as FeatureLayer from 'esri/layers/FeatureLayer';

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>> {
    async queryRelatedRecords(layer: FeatureLayer, objectIds: number[]) {
        const relationshipResults = await layer.queryRelatedFeatures({
            outFields: ['*'],
            relationshipId: layer.relationships[0].id,
            objectIds: objectIds,
        });
        let relationshipFeatures: Graphic[] = [];
        objectIds.map((oid: number) =>
            relationshipFeatures.push(
                ...(relationshipResults[oid].features as Graphic[]).map((feature: Graphic) => feature.attributes)
            )
        );
        console.log('relationshipResults', relationshipFeatures);
    }

    render() {
        const features: Graphic[] = this.props?.mutableStateProps?.results?.features;
        console.log('Excel Export render', this.props?.mutableStateProps?.results?.label, ' | ', features);

        // TODO: Automatic export writes 2 files most of the times.. maybe because 2 props are set and reder() es executed 2 times?
        if (features?.length > 0) {
            const layer = features[0].layer as FeatureLayer;
            const label =
                this.props?.mutableStateProps?.results?.label?.length > 0
                    ? this.props?.mutableStateProps?.results?.label
                    : defaultMessages._widgetLabel;
            const filename = label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const sheetname = label.substr(0, 31);
            const ws = XLSX.utils.json_to_sheet(features, { sheet: sheetname });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetname);
            XLSX.writeFile(wb, `${filename}.xlsb`);

            // Relationships
            const objectIds = features.map((feature: Graphic) => feature.attributes['OBJECTID']);
            console.log('OBJECTIDS', objectIds);

            let relationshipResults;
            if (layer.relationships.length > 0) {
                relationshipResults = this.queryRelatedRecords(layer, objectIds);
            }
        }

        return (
            <div>
                <h3>{defaultMessages._widgetLabel}</h3>
                {features ? `${features.length} ${defaultMessages.recordsExported}.` : defaultMessages.noRecords}
            </div>
        );
    }
}
