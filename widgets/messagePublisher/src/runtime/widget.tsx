import { React, type AllWidgetProps, DataRecordSetChangeMessage, MessageManager, RecordSetChangeType, DataSourceComponent, type DataSource, type FeatureLayerDataSource, type FeatureLayerQueryParams, type FeatureDataRecord, DataRecordsSelectionChangeMessage, type DataRecordSet } from 'jimu-core'
import { Button } from 'jimu-ui'
import { useState } from 'react'
const queryParams = {
  where: '1=1',
  outFields: ['*'],
  pageSize: 10
} as FeatureLayerQueryParams

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
    const fl = featureLayerDataSource.layer
    const field = (props.useDataSources?.[0].fields as unknown as string[])[0]

    const query = fl.createQuery()
    query.where = '1=1'
    query.outFields = [field]
    query.orderByFields = [`${field} DESC`]
    query.returnGeometry = true
    query.num = 3

    const flResults = await fl.queryFeatures(query)
    const flResultObjectIds = flResults.features.map(f => f.attributes.OBJECTID)
    console.log(flResults, featureLayerDataSource)

    const dsResult = await featureLayerDataSource.query({
      where: `objectid in (${flResultObjectIds.join(',')})`,
      outFields: ['*'],
      returnGeometry: true
    })
    console.log('dsResult', dsResult)
    const records = dsResult?.records as FeatureDataRecord[]

    publishMessage(props.id, records)
  }

  const onDataSourceCreated = (ds: DataSource) => {
    setFeatureLayerDataSource(ds as FeatureLayerDataSource)
  }

  // queryParams.groupByFieldsForStatistics = props.useDataSources?.[0].fields as unknown as string[]
  // queryParams.outStatistics = [{ statisticType: 'max', onStatisticField: queryParams.groupByFieldsForStatistics[0], outStatisticFieldName: 'max' }]

  return <>
    <Button onClick={() => { getStats() }}>Publish message</Button>

    <DataSourceComponent useDataSource={props.useDataSources?.[0]} widgetId={props.id} queryCount onDataSourceCreated={onDataSourceCreated} />
    {/* <DataSourceComponent useDataSource={props.useDataSources?.[0]} query={queryParams} widgetId={props.id} queryCount onDataSourceCreated={onDataSourceCreated} /> */}
  </>
}
