import { React, type AllWidgetProps, Immutable, FormattedMessage } from 'jimu-core'
import defaultMessages from './translations/default'

import { type JSON2SheetOpts, utils, writeFile } from 'xlsx'
import type Graphic from 'esri/Graphic'
import type FeatureLayer from 'esri/layers/FeatureLayer'
import { Button, MultiSelect, type MultiSelectItem } from 'jimu-ui'
import type Relationship from 'esri/layers/support/Relationship'

interface WorksheetObject {
  ws: any
  wsName: string
}

interface RelationshipRecords {
  relationshipName: string
  relationshipRecords: any[]
  relationshipFieldNames: MultiSelectItem[]
  relationshipSelectedFieldNames: string[]
}

interface State {
  exportButtonDisabled: boolean
  fieldNames: MultiSelectItem[]
  selectedFieldNames: string[]
  relationshipRecordsCount: number
  currentRelationshipRecordsSelectedFieldNames: string[] // this number is only used to rerender the view when the current selection is changed
}

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>, State> {
  wss: WorksheetObject[]
  features: Graphic[]
  layer: FeatureLayer
  label: string
  filename: string
  allRelationshipRecords: RelationshipRecords[]

  state: State = {
    exportButtonDisabled: true,
    fieldNames: [],
    selectedFieldNames: [],
    relationshipRecordsCount: 0,
    currentRelationshipRecordsSelectedFieldNames: []
  }

  private processRelatedRecords (objectIds: number[], relationshipResults: any) {
    const relationshipFeatures: any[] = []
    objectIds.map((oid: number) =>
      relationshipFeatures.push(
        ...(relationshipResults[oid]?.features as Graphic[]).map((feature) => {
          const attributes = feature.attributes
          // add the original objectId as reference in an extra field
          attributes.relationObjectId = oid
          return attributes
        })
      )
    )
    return relationshipFeatures
  }

  private readonly queryRelationships = async () => {
    if (this.features?.length > 0) {
      const objectIdField = (this.features[0].layer as FeatureLayer).objectIdField ?? 'OBJECTID'
      const objectIds = this.features.map((feature: Graphic) => feature.attributes[objectIdField])
      const relationshipQueries = this.layer.relationships?.map((relationship: Relationship) =>
        this.layer.queryRelatedFeatures({
          outFields: ['*'],
          relationshipId: relationship.id,
          objectIds: objectIds
        })
      )
      // fill the results array
      const relationshipResults = await Promise.all(relationshipQueries)
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
              value: fieldName
            } as MultiSelectItem
          }),
          relationshipSelectedFieldNames: Object.keys(
            relationshipResults[index][objectIds[0]].features[0].attributes
          )
        } as RelationshipRecords
      })
      this.setState({
        relationshipRecordsCount: this.allRelationshipRecords.length,
        currentRelationshipRecordsSelectedFieldNames:
                    this.allRelationshipRecords[0].relationshipSelectedFieldNames
      })
    }
  }

  private readonly excelExport = () => {
    // selected features
    if (this.features?.length > 0) {
      const sheetname = this.label
      const featureAttributes = this.features.map((feature: Graphic) => {
        return this.reduceToSelectedFields(feature.attributes, this.state.selectedFieldNames)
      })
      // create worksheet of main table and add as first array element
      const wsObject = this.createWorksheet(featureAttributes, sheetname)
      this.wss.unshift(wsObject)
    }

    // relationships
    if (this.allRelationshipRecords?.length > 0) {
      this.allRelationshipRecords.forEach((relationshipRecords: RelationshipRecords) => {
        const relationshipAttributes = relationshipRecords.relationshipRecords.map((rel: any) => {
          return this.reduceToSelectedFields(rel, relationshipRecords.relationshipSelectedFieldNames)
        })
        const wsObject = this.createWorksheet(
          relationshipAttributes,
          relationshipRecords.relationshipName.substr(0, 31)
        )
        this.wss.push(wsObject)
      })
    }

    this.exportExcelFile(this.wss, this.filename)
  }

  private reduceToSelectedFields (attributes: any, selectedFieldNames: string[]): {} {
    return Object.keys(attributes)
      .filter((key) => selectedFieldNames.includes(key))
      .reduce((obj, key) => {
        obj[key] = attributes[key]
        return obj
      }, {})
  }

  private exportExcelFile (wss: WorksheetObject[], filename: any) {
    const wb = utils.book_new()
    wss.forEach((wsObject: WorksheetObject) => { utils.book_append_sheet(wb, wsObject.ws, wsObject.wsName.substr(0, 31)) }
    )
    writeFile(wb, `${filename}.xlsb`)
  }

  private createWorksheet (featureAttributes: any[], sheetname: any): WorksheetObject {
    const newWorksheet = utils.json_to_sheet(featureAttributes, { sheet: sheetname } as JSON2SheetOpts)
    return {
      ws: newWorksheet,
      wsName: sheetname
    }
  }

  private readonly handleItemClick = (evt, item, selectedValues) => {
    this.setValues(selectedValues)
  }

  private readonly handleRelationshipFieldClick = (
    evt,
    item,
    selectedValues,
    relationshipRecords: RelationshipRecords
  ) => {
    relationshipRecords.relationshipSelectedFieldNames = selectedValues
    this.setState({
      currentRelationshipRecordsSelectedFieldNames: selectedValues
    })
  }

  private readonly setValues = (selectedValues) => {
    this.setState({
      selectedFieldNames: selectedValues
    })
  }

  private areArraysDifferent (array1: any[], array2: any[]): boolean {
    if (array1.length !== array2.length) return true

    const unequalElements = array1.filter((element: any, index: number) => element !== array2[index])
    if (unequalElements.length > 0) return true

    return false
  }

  render () {
    this.wss = []
    this.features = this.props?.mutableStateProps?.results?.features

    // the data action is received here. only evaluate and set the state, if the mutableStateProps field list is different. this indicates that there is probably new incoming data.
    console.log('renderExcel')
    if (
      this.features?.length > 0 &&
            (this.state.fieldNames.length === 0 ||
                this.areArraysDifferent(
                  this.state.fieldNames.map((r: MultiSelectItem) => r.value as string),
                  Object.keys(this.features[0].attributes)
                ))
    ) {
      this.layer = this.features[0].layer as FeatureLayer
      this.label =
                this.props?.mutableStateProps?.results?.label?.length > 0
                  ? this.props?.mutableStateProps?.results?.label
                  : defaultMessages._widgetLabel
      this.filename = this.label.replace(/[^a-z0-9]/gi, '_').toLowerCase()

      const fieldNamesMultiSelectItems = Object.keys(this.features[0].attributes).map((fieldName: string) => {
        return {
          label: fieldName,
          value: fieldName
        } as MultiSelectItem
      })

      this.setState({
        exportButtonDisabled: false,
        fieldNames: fieldNamesMultiSelectItems,
        selectedFieldNames: Object.keys(this.features[0].attributes),
        relationshipRecordsCount: 0
      })
    } else if (this.features?.length === 0 && !this.state.exportButtonDisabled) {
      this.setState({
        exportButtonDisabled: true,
        fieldNames: [],
        selectedFieldNames: [],
        relationshipRecordsCount: 0
      })
    }

    return (
            <div>
                <h3>
                    <FormattedMessage id={defaultMessages._widgetLabel} />
                </h3>

                {/* Selected records and field selector */}
                {this.features && !this.state.exportButtonDisabled
                  ? (
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
                    )
                  : (
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
                                  this.handleRelationshipFieldClick(evt, item, selectedValues, relationshipRecords)
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
    )
  }
}
