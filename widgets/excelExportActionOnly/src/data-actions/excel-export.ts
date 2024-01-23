import type Graphic from 'esri/Graphic'
import { AbstractDataAction, type DataLevel, type DataRecord, type DataRecordSet } from 'jimu-core'
import { type JSON2SheetOpts, utils, writeFile } from 'xlsx'
import defaultMessages from '../runtime/translations/default'

interface WorksheetObject {
  ws: any
  wsName: string
}

export default class ExportJson extends AbstractDataAction {
  // changed according to breaking changes in ExB 1.13: https://developers.arcgis.com/experience-builder/guide/whats-new/#data-action [2024-01-23]
  async isSupported (dataSets: DataRecordSet[], dataLevel: DataLevel, widgetId: string): Promise<boolean> {
    console.log('ExportJson.isSupported', dataSets, dataLevel, widgetId)
    return dataSets.length > 0
  }

  // TODO: Hidden columns are exported as well. Can we see which ones are hidden in the datasource?
  async onExecute (dataSets: DataRecordSet[], dataLevel: DataLevel, widgetId: string): Promise<boolean> {
    console.log('ExportJson.onExecute', dataSets, dataLevel, widgetId)
    if (dataSets.length > 0) {
      // TODO: The following "as any" casts are due to insufficient typings in ExB 1.13. Re-check in future versions.
      const features = dataSets.map((drs: DataRecordSet) => drs.records.map((r: DataRecord) => (r as any).feature as Graphic)).flat()
      const label = (dataSets[0].dataSource as any)?.fetchedSchema?.label.length > 0
        ? (dataSets[0].dataSource as any)?.fetchedSchema?.label
        : defaultMessages._widgetLabel
      const filename = label.replace(/[^a-z0-9]/gi, '_').toLowerCase()

      this.excelExport(features, filename)

      return true
    }
    return false
  }

  private readonly excelExport = (features: Graphic[], filename: string) => {
    const wss: WorksheetObject[] = []
    // selected features
    if (features?.length > 0) {
      const sheetname = this.label
      const featureAttributes = features.map((feature: Graphic) => {
        return this.reduceToFields(feature.attributes)
      })
      // create worksheet of main table and add as first array element
      const wsObject = this.createWorksheet(featureAttributes, sheetname)
      wss.unshift(wsObject)
    }
    this.exportExcelFile(wss, filename)
  }

  private reduceToFields (attributes: any): unknown {
    return Object.keys(attributes)
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
}
