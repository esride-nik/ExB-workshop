import Graphic from 'esri/Graphic'
import { AbstractDataAction, DataRecordSet } from 'jimu-core'
import { JSON2SheetOpts, utils, writeFile } from 'xlsx'
import defaultMessages from '../runtime/translations/default'

interface WorksheetObject {
  ws: any
  wsName: string
}

export default class NearMePlus extends AbstractDataAction {
  async isSupported (dataSet: DataRecordSet): Promise<boolean> {
    return dataSet.records?.length > 0
  }

  // TODO: Hidden columns are exported as well. Can we see which ones are hidden in the datasource?
  async onExecute (dataSet: DataRecordSet, actionConfig: any): Promise<boolean> {
    if (dataSet.records.length > 0) {
      const features = dataSet.records.map((r) => (r as any).feature as Graphic)

      const label = (dataSet.records[0].dataSource?.belongToDataSource as any).fetchedSchema?.label.length > 0
        ? (dataSet.records[0].dataSource?.belongToDataSource as any).fetchedSchema?.label
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

  private reduceToFields (attributes: any): {} {
    return Object.keys(attributes)
      .reduce((obj, key) => {
        obj[key] = attributes[key]
        return obj
      }, {})
  }

  private exportExcelFile (wss: WorksheetObject[], filename: any) {
    const wb = utils.book_new()
    wss.forEach((wsObject: WorksheetObject) =>
      utils.book_append_sheet(wb, wsObject.ws, wsObject.wsName.substr(0, 31))
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
