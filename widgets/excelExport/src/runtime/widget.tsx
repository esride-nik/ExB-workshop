import { React, AllWidgetProps, Immutable, FormattedMessage } from 'jimu-core';
import defaultMessages from './translations/default';

import XLSX from 'xlsx';
import * as Graphic from 'esri/Graphic';
import * as FeatureLayer from 'esri/layers/FeatureLayer';
import { Button, MultiSelect, MultiSelectItem } from 'jimu-ui';
import * as Relationship from 'esri/layers/support/Relationship';

interface WorksheetObject {
    ws: any;
    wsName: string;
}

interface State {
    exportButtonDisabled: boolean;
    fieldNames: MultiSelectItem[];
    selectedFieldNames: string[];
}

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>, State> {
    wss: WorksheetObject[];
    features: Graphic[];
    layer: FeatureLayer;
    label: string;
    filename: string;

    state: State = {
        exportButtonDisabled: true,
        fieldNames: [],
        selectedFieldNames: [],
    };

    private processRelatedRecords(objectIds: number[], relationshipResults: any) {
        let relationshipFeatures: Graphic[] = [];
        objectIds.map((oid: number) =>
            relationshipFeatures.push(
                ...(relationshipResults[oid]?.features as Graphic[]).map((feature: Graphic) => {
                    const attributes = feature.attributes;
                    attributes['relationObjectId'] = oid;
                    return attributes;
                })
            )
        );
        console.log('relationshipResults', relationshipFeatures);
        return relationshipFeatures;
    }

    private queryRelationships = async () => {
        if (this.features?.length > 0) {
            const objectIdField = (this.features[0].layer as FeatureLayer).objectIdField ?? 'OBJECTID';
            const objectIds = this.features.map((feature: Graphic) => feature.attributes[objectIdField]);
            let relFeatureAttributes;
            const relationshipQueries = this.layer.relationships?.map((relationship: Relationship) =>
                this.layer.queryRelatedFeatures({
                    outFields: ['*'],
                    relationshipId: relationship.id,
                    objectIds: objectIds,
                })
            );
            const relationshipResults = await Promise.all(relationshipQueries);
            this.layer.relationships?.forEach((relationship: Relationship, index: number) => {
                relFeatureAttributes = this.processRelatedRecords(objectIds, relationshipResults[index]);
                let wsObject = this.createWorksheet(relFeatureAttributes, relationship.name.substr(0, 31));
                this.wss.push(wsObject);
            });
        }
    };

    private excelExport = () => {
        if (this.features?.length > 0) {
            const sheetname = this.label;
            const featureAttributes = this.features.map((feature: Graphic) => {
                return Object.keys(feature.attributes)
                    .filter((key) => this.state.selectedFieldNames.includes(key))
                    .reduce((obj, key) => {
                        obj[key] = feature.attributes[key];
                        return obj;
                    }, {});
            });
            // create worksheet of main table and add as first array element
            let wsObject = this.createWorksheet(featureAttributes, sheetname);
            this.wss.unshift(wsObject);

            this.exportExcelFile(this.wss, this.filename);
        }
    };

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

    private handleItemClick = (evt, item, selectedValues) => {
        this.onClickItem(evt, item, selectedValues);
        this.setValues(selectedValues);
    };

    private onClickItem = (evt, item, selectedValues) => {
        console.log('onClickItem', evt, item, selectedValues);
    };

    private setValues = (selectedValues) => {
        this.setState({
            selectedFieldNames: selectedValues,
        });
    };

    render() {
        this.wss = [];
        this.features = this.props?.mutableStateProps?.results?.features;

        if (this.features?.length > 0 && this.state.fieldNames.length === 0) {
            this.layer = this.features[0].layer as FeatureLayer;
            this.label =
                this.props?.mutableStateProps?.results?.label?.length > 0
                    ? this.props?.mutableStateProps?.results?.label
                    : defaultMessages._widgetLabel;
            this.filename = this.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            const fieldNamesMultiSelectItems = Object.keys(this.features[0].attributes).map((fieldName: string) => {
                return {
                    label: fieldName,
                    value: fieldName,
                } as MultiSelectItem;
            });

            this.setState({
                exportButtonDisabled: false,
                fieldNames: fieldNamesMultiSelectItems,
                selectedFieldNames: Object.keys(this.features[0].attributes),
            });
        } else if (this.features?.length === 0 && !this.state.exportButtonDisabled) {
            this.setState({
                exportButtonDisabled: true,
                fieldNames: [],
                selectedFieldNames: [],
            });
        }

        return (
            <div>
                <h3>
                    <FormattedMessage id={defaultMessages._widgetLabel} />
                </h3>

                {/* Selected records and field selector */}
                {this.features && !this.state.exportButtonDisabled ? (
                    <p>
                        {this.features.length}&nbsp;
                        <FormattedMessage
                            id={defaultMessages.recordsReceived}
                            defaultMessage={defaultMessages.recordsReceived}
                        />
                        <MultiSelect
                            items={Immutable(this.state.fieldNames)}
                            values={Immutable(this.state.selectedFieldNames)}
                            onClickItem={this.handleItemClick}></MultiSelect>
                    </p>
                ) : (
                    <FormattedMessage id={defaultMessages.noRecords} defaultMessage={defaultMessages.noRecords} />
                )}

                {/* Relationships */}
                {this.layer?.relationships && this.layer.relationships.length > 0 && (
                    <p>
                        {this.layer.relationships.length}&nbsp;
                        <FormattedMessage
                            id={defaultMessages.relationshipsDetected}
                            defaultMessage={defaultMessages.relationshipsDetected}
                        />
                        {!this.state.exportButtonDisabled && this.features?.length > 0 && (
                            <Button onClick={this.queryRelationships}>
                                <FormattedMessage
                                    id={defaultMessages.queryRelationships}
                                    defaultMessage={defaultMessages.queryRelationships}
                                />
                            </Button>
                        )}
                    </p>
                )}

                {/* Export button */}
                <p>
                    <Button onClick={this.excelExport} disabled={this.state.exportButtonDisabled}>
                        <FormattedMessage
                            id={defaultMessages.export2Excel}
                            defaultMessage={defaultMessages.export2Excel}
                        />
                    </Button>
                </p>
            </div>
        );
    }
}
