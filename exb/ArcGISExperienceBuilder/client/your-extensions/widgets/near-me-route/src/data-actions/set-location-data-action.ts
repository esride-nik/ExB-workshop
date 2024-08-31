import { AbstractDataAction, type DataRecordSet, MutableStoreManager, DataLevel, DataSourceStatus, type DataSource, type JSAPILayerMixin, getAppStore, AllDataSourceTypes } from 'jimu-core'

export default class SetLocationDataAction extends AbstractDataAction {
  async isSupported (dataSets: DataRecordSet[], dataLevel: DataLevel): Promise<boolean> {
    if (dataSets.length > 1) {
      return false
    }

    const dataSet = dataSets[0]
    const dataSource = dataSet.dataSource as DataSource & JSAPILayerMixin

    const appConfig = getAppConfig()
    const widgetJson = appConfig?.widgets?.[this.widgetId]

    const configInfo = widgetJson.config?.configInfo
    if (!configInfo || Object.keys(configInfo).length === 0) {
      return false
    }

    let activeConfiguredDataSource = appConfig?.widgets?.[widgetJson.useMapWidgetIds?.[0]]?.config?.initialMapDataSourceID
    //when map is added first time and have only one webmap initialMapDataSourceID is not available
    //in this case try to fetch the active data source id form configInfo
    if (!activeConfiguredDataSource) {
      activeConfiguredDataSource = Object.keys(configInfo)[0]
    }
    const configSettings = widgetJson.config?.configInfo?.[activeConfiguredDataSource]

    const checkForConfiguredAnalysis = configSettings?.analysisSettings?.layersInfo?.length > 0
    //disable data action when no analysis layers are configured
    if (!checkForConfiguredAnalysis) {
      return false
    }

    const checkForSearchActiveMapArea = configSettings?.searchSettings?.searchByActiveMapArea
    //Disable data action Set location option when search method is set to Current map area
    if (checkForSearchActiveMapArea) {
      return false
    }

    //Don't support if dataSource is not valid or notReady
    if (!dataSource || dataSource.getStatus() === DataSourceStatus.NotReady) {
      return false
    }

    // records may come from a table, so we need to check if the dataSource has geometry or not
    const supportSpatialInfo = dataSource?.supportSpatialInfo && dataSource?.supportSpatialInfo()
    if (!supportSpatialInfo) {
      return false
    }

    //accept selected records/current features from pupup only
    if ((dataSet.records.length > 0 && dataLevel === DataLevel.Records && (dataSet.type === 'current' || dataSet.type === 'selected')) ||
     (dataLevel === DataLevel.DataSource && [AllDataSourceTypes.FeatureLayer].includes(dataSet.dataSource.type as any))) {
      return true
    }

    return false
  }

  //on selection of the features in other widgets get the data record set by execute method
  //data record set consists of the features which will be used for getting the incident geometry
  async onExecute (dataSets: DataRecordSet[], dataLevel: DataLevel): Promise<boolean> {
    const dataSet = dataSets[0]
    const { records, dataSource } = dataSet
    const geometriesByDsId = {}
    let dsID: string = ''

    if (dataLevel === DataLevel.DataSource) {
      MutableStoreManager.getInstance().updateStateValue(this.widgetId, 'selectedDataSource', dataSource)
    } else {
      if (records?.length > 0) {
        //group geometries by datasource ids
        records.forEach((eachRecord: any) => {
          dsID = eachRecord?.dataSource?.id
          if (!geometriesByDsId[dsID]) {
            geometriesByDsId[dsID] = []
          }
          geometriesByDsId[dsID].push(eachRecord.feature.geometry)
        })
        MutableStoreManager.getInstance().updateStateValue(this.widgetId, 'selectedIncidentLocation', geometriesByDsId)
      }
    }
    return true
  }
}

//get the whole app config
function getAppConfig () {
  return window.jimuConfig.isBuilder ? getAppStore().getState()?.appStateInBuilder?.appConfig : getAppStore().getState()?.appConfig
}
