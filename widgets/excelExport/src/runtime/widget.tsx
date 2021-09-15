import { React, AllWidgetProps } from 'jimu-core';
import defaultMessages from './translations/default';

import XLSX from 'xlsx';
import * as Graphic from 'esri/Graphic';
import * as FeatureLayer from 'esri/layers/FeatureLayer';
import { Button } from 'jimu-ui';

interface WorksheetObject {
    ws: any;
    wsName: string;
}

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>> {
    wss: WorksheetObject[];
    features: Graphic[];
    layer: FeatureLayer;
    label: string;
    filename: string;

    async queryRelatedRecords(layer: FeatureLayer, objectIds: number[]): Promise<Graphic[]> {
        return layer.queryRelatedFeatures({
            outFields: ['*'],
            relationshipId: layer.relationships[0].id,
            objectIds: objectIds,
        });
    }

    private processRelatedRecords(objectIds: number[], relationshipResults: any) {
        let relationshipFeatures: Graphic[] = [];
        objectIds.map((oid: number) =>
            relationshipFeatures.push(
                ...(relationshipResults[oid].features as Graphic[]).map((feature: Graphic) => {
                    const attributes = feature.attributes;
                    attributes['relationObjectId'] = oid;
                    return attributes;
                })
            )
        );
        console.log('relationshipResults', relationshipFeatures);
        return relationshipFeatures;
    }

    private startExcelProcessing = (btnEvt: any) => {
        console.log('startExcelProcessing', btnEvt);
        this.excelProcessing(this.features, this.layer, this.filename);
    };

    private async excelProcessing(features: Graphic[], layer: FeatureLayer, filename: any) {
        const sheetname = this.label;
        const featureAttributes = this.features.map((feature: Graphic) => feature.attributes);
        let wsObject = this.createWorksheet(featureAttributes, sheetname);
        this.wss.push(wsObject);

        // Relationships
        const objectIds = features.map((feature: Graphic) => feature.attributes['OBJECTID']);
        let relFeatureAttributes;
        if (layer.relationships.length > 0) {
            const relationshipResults = await this.queryRelatedRecords(layer, objectIds);
            relFeatureAttributes = this.processRelatedRecords(objectIds, relationshipResults);
        }
        wsObject = this.createWorksheet(relFeatureAttributes, ('rel_' + sheetname).substr(0, 31));
        this.wss.push(wsObject);
        this.exportExcelFile(this.wss, filename);
    }

    private exportExcelFile(wss: WorksheetObject[], filename: any) {
        const wb = XLSX.utils.book_new();
        wss.forEach((wsObject: WorksheetObject) =>
            XLSX.utils.book_append_sheet(wb, wsObject.ws, wsObject.wsName.substr(0, 31))
        );
        XLSX.writeFile(wb, `${filename}.xlsb`);
    }

    private createWorksheet(featureAttributes: any[], sheetname: any): WorksheetObject {
        const newWorksheet = XLSX.utils.json_to_sheet(featureAttributes, { sheet: sheetname });
        return {
            ws: newWorksheet,
            wsName: sheetname,
        };
    }

    render() {
        this.wss = [];
        this.features = this.props?.mutableStateProps?.results?.features;
        console.log('Excel Export render', this.props?.mutableStateProps?.results?.label, ' | ', this.features);

        if (this.features?.length > 0) {
            this.layer = this.features[0].layer as FeatureLayer;
            this.label =
                this.props?.mutableStateProps?.results?.label?.length > 0
                    ? this.props?.mutableStateProps?.results?.label
                    : defaultMessages._widgetLabel;
            this.filename = this.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            // Relationships and Excel Export
            // this.excelProcessing(features, layer, wsObject, sheetname, filename);
        }

        const fieldNames = this.features?.length > 0 ? Object.keys(this.features[0].attributes) : undefined;

        return (
            <div>
                <h3>{defaultMessages._widgetLabel}</h3>
                {this.features
                    ? `${this.features.length} ${defaultMessages.recordsReceived}. ${fieldNames.join(', ')}`
                    : defaultMessages.noRecords}

                <Button onClick={this.startExcelProcessing}>Export Excel</Button>
            </div>
        );
    }
}
