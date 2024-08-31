import type Graphic from 'esri/Graphic'
import { AbstractDataAction, MutableStoreManager, type DataRecordSet, type DataLevel, type DataRecord } from 'jimu-core'

export default class ExportJson extends AbstractDataAction {
  // changed according to breaking changes in ExB 1.13: https://developers.arcgis.com/experience-builder/guide/whats-new/#data-action [2024-01-23]
  async isSupported (dataSets: DataRecordSet[], dataLevel: DataLevel, widgetId: string): Promise<boolean> {
    console.log('ExportJson.isSupported', dataSets, dataLevel, widgetId)
    return dataSets[0]?.records.length > 0
  }

  // TODO: Hidden columns are exported as well. Can we see which ones are hidden in the datasource?
  async onExecute (dataSets: DataRecordSet[], dataLevel: DataLevel, widgetId: string): Promise<boolean> {
    console.log('ExportJson.onExecute', dataSets, dataLevel, widgetId)
    if (dataSets[0]?.records.length > 0) {
      // TODO: The following "as any" casts are due to insufficient typings in ExB 1.13. Re-check in future versions.
      const features = dataSets.map((drs: DataRecordSet) => drs.records.map((r: DataRecord) => (r as any).feature as Graphic)).flat()
      MutableStoreManager.getInstance().updateStateValue(this.widgetId, 'results', {
        features: features,
        label: (dataSets[0].dataSource as any)?.fetchedSchema?.label
      })
      return true
    }
    return false
  }
}
