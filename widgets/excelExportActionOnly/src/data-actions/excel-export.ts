import Graphic from 'esri/Graphic'
import { AbstractDataAction, MutableStoreManager, DataRecordSet } from 'jimu-core'
import { JSON2SheetOpts, utils, writeFile } from 'xlsx'

interface WorksheetObject {
  ws: any
  wsName: string
}

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

  private readonly excelExport = () => {
    // selected features
    if (this.features?.length > 0) {
      const sheetname = this.label
      const featureAttributes = this.features.map((feature: Graphic) => {
        return this.reduceToFields(feature.attributes)
      })
      // create worksheet of main table and add as first array element
      const wsObject = this.createWorksheet(featureAttributes, sheetname)
      this.wss.unshift(wsObject)
    }
    this.exportExcelFile(this.wss, this.filename)
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
