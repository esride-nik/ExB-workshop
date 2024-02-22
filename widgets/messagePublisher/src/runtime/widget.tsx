import { React, type AllWidgetProps, DataRecordSetChangeMessage, MessageManager, RecordSetChangeType, DataSourceComponent, type DataSource, type FeatureLayerDataSource, type FeatureDataRecord, DataRecordsSelectionChangeMessage, type DataRecordSet } from 'jimu-core'
import { Button } from 'jimu-ui'
import { useState } from 'react'

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget (props: AllWidgetProps<{ Config }>) {
  const [featureLayerDataSource, setFeatureLayerDataSource] = useState<FeatureLayerDataSource>(undefined)

  const publishMessage = (widgetId: string, records: FeatureDataRecord[]) => {
    // "DATA_RECORDS_SELECTION_CHANGE"
    // Reference: https://developers.arcgis.com/experience-builder/api-reference/jimu-core/DataRecordsSelectionChangeMessage/
    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(widgetId, records)
    )

    // "DATA_RECORD_SET_CHANGE"
    // Reference: https://developers.arcgis.com/experience-builder/api-reference/jimu-core/DataRecordSetChangeMessage/
    const data = [{
      dataSource: records[0].dataSource,
      fields: records[0].dataSource.layer.fields.map(f => f.name),
      name: records[0].dataSource.id,
      records: records,
      type: 'loaded'
    } as unknown as DataRecordSet]
    MessageManager.getInstance().publishMessage(
      new DataRecordSetChangeMessage(widgetId, RecordSetChangeType.CreateUpdate, data)
    )
  }

  const getStats = async () => {
    const field = (props.useDataSources?.[0].fields as unknown as string[])[0]

    // this is a completely random query, asking for the 3 largest / last values of the field.
    // using 'pageSize' and 'page' is a hack, because FeatureLayerDataSource.query doesn't support 'num' parameter (or something like 'maxRecordCount')
    // Reference: https://developers.arcgis.com/experience-builder/api-reference/jimu-core/FeatureLayerQueryParams/
    const dsResult = await featureLayerDataSource.query({
      where: '1=1',
      outFields: [field],
      orderByFields: [`${field} DESC`],
      pageSize: 5,
      page: 1,
      returnGeometry: true
    })
    const records = dsResult?.records as FeatureDataRecord[]

    publishMessage(props.id, records)
  }

  const onDataSourceCreated = (ds: DataSource) => {
    setFeatureLayerDataSource(ds as FeatureLayerDataSource)
  }

  return <>
    <Button onClick={() => { getStats() }}>Publish message</Button>

    <DataSourceComponent useDataSource={props.useDataSources?.[0]} widgetId={props.id} queryCount onDataSourceCreated={onDataSourceCreated} />
  </>
}
