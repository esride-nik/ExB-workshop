import Graphic from 'esri/Graphic'
import { AbstractDataAction, DataSource, DataRecord, MutableStoreManager, DataRecordSet } from 'jimu-core'

export default class LineOfSightTargets extends AbstractDataAction {
  async isSupported (dataSet: DataRecordSet): Promise<boolean> {
    return dataSet.records?.length > 0
  }

  async onExecute (dataSet: DataRecordSet, actionConfig: any): Promise<boolean> {
    if (dataSet.records.length > 0) {
      const features = dataSet.records.map((r) => (r as any).feature as Graphic)
      MutableStoreManager.getInstance().updateStateValue(this.widgetId, 'results', {
        features: features,
        label: dataSet.records[0].dataSource?.belongToDataSource?.fetchedSchema?.label
      })
      return true
    }
    return false
  }
}
