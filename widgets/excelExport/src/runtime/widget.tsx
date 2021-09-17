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

interface RelationshipRecords {
    relationshipName: string;
    relationshipRecords: any[];
    relationshipFieldNames: MultiSelectItem[];
    relationshipSelectedFieldNames: string[];
}

interface State {
    exportButtonDisabled: boolean;
    fieldNames: MultiSelectItem[];
    selectedFieldNames: string[];
    relationshipRecordsCount: number;
    currentRelationshipRecordsSelectedFieldNames: string[]; // this number is only used to rerender the view when the current selection is changed
}

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>, State> {
    wss: WorksheetObject[];
    features: Graphic[];
    layer: FeatureLayer;
    label: string;
    filename: string;
    allRelationshipRecords: RelationshipRecords[];

    state: State = {
        exportButtonDisabled: true,
        fieldNames: [],
        selectedFieldNames: [],
        relationshipRecordsCount: 0,
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
        return relationshipFeatures;
    }

    private queryRelationships = async () => {
        if (this.features?.length > 0) {
            const objectIdField = (this.features[0].layer as FeatureLayer).objectIdField ?? 'OBJECTID';
            const objectIds = this.features.map((feature: Graphic) => feature.attributes[objectIdField]);
            const relationshipQueries = this.layer.relationships?.map((relationship: Relationship) =>
                this.layer.queryRelatedFeatures({
                    outFields: ['*'],
                    relationshipId: relationship.id,
                    objectIds: objectIds,
                })
            );
            // fill the results array
            const relationshipResults = await Promise.all(relationshipQueries);
            this.allRelationshipRecords = this.layer.relationships?.map((relationship: Relationship, index: number) => {
                return {
                    relationshipName: relationship.name,
                    // get the result from the results array
                    relationshipRecords: this.processRelatedRecords(objectIds, relationshipResults[index]),
                    relationshipFieldNames: Object.keys(
                        // get the attributes from the 1st feature from the first set of findings (objectId) from the result from the results array
                        relationshipResults[index][objectIds[0]].features[0].attributes
                    ).map((fieldName: string) => {
                        return {
                            label: fieldName,
                            value: fieldName,
                        } as MultiSelectItem;
                    }),
                    relationshipSelectedFieldNames: Object.keys(
                        relationshipResults[index][objectIds[0]].features[0].attributes
                    ),
                } as RelationshipRecords;
            });
            this.setState({
                relationshipRecordsCount: this.allRelationshipRecords.length,
                currentRelationshipRecordsSelectedFieldNames:
                    this.allRelationshipRecords[0].relationshipSelectedFieldNames,
            });
        }
    };

    private excelExport = () => {
        // selected features
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
        }

        // relationships
        this.allRelationshipRecords.forEach((relationshipRecords: RelationshipRecords) => {
            let wsObject = this.createWorksheet(
                relationshipRecords.relationshipRecords,
                relationshipRecords.relationshipName.substr(0, 31)
            );
            this.wss.push(wsObject);
        });

        this.exportExcelFile(this.wss, this.filename);
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
        this.setValues(selectedValues);
    };

    private handleRelationshipFieldClick = (evt, item, selectedValues, relationshipRecords: RelationshipRecords) => {
        relationshipRecords.relationshipSelectedFieldNames = selectedValues;
        this.setState({
            currentRelationshipRecordsSelectedFieldNames: selectedValues,
        });
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
                relationshipRecordsCount: 0,
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

                {/* Relationships field selectors */}
                {this.state.relationshipRecordsCount > 0 &&
                    this.state.currentRelationshipRecordsSelectedFieldNames.length > 0 &&
                    this.allRelationshipRecords?.length > 0 &&
                    this.allRelationshipRecords.map((relationshipRecords: RelationshipRecords) => (
                        <div>
                            {relationshipRecords.relationshipName}
                            <MultiSelect
                                items={Immutable(relationshipRecords.relationshipFieldNames)}
                                values={Immutable(relationshipRecords.relationshipSelectedFieldNames)}
                                onClickItem={(evt, item, selectedValues) => {
                                    this.handleRelationshipFieldClick(evt, item, selectedValues, relationshipRecords);
                                }}
                            />
                        </div>
                    ))}

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
