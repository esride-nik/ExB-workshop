import Graphic from 'esri/Graphic'
import { AbstractDataAction, MutableStoreManager, DataRecordSet } from 'jimu-core'

export default class ExportJson extends AbstractDataAction {
  async isSupported (dataSet: DataRecordSet): Promise<boolean> {
    return dataSet.records?.length > 0
  }

  // TODO: Hidden columns are exported as well. Can we see which ones are hidden in the datasource?
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
