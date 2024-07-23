import { AbstractMessageAction, type DataRecordsSelectionChangeMessage, type Message, type MessageDescription, MessageType, MutableStoreManager } from 'jimu-core'

export default class SetLocationMessageAction extends AbstractMessageAction {
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    return messageDescription.messageType === MessageType.DataRecordsSelectionChange
  }

  filterMessageType (messageType: MessageType): boolean {
    return messageType === MessageType.DataRecordsSelectionChange
  }

  filterMessage (message: Message): boolean {
    return true
  }

  //on selection of the features in other widgets get the data record set by execute method
  //data record set consists of the features which will be used for getting the incident geometry
  onExecute (message: DataRecordsSelectionChangeMessage, actionConfig?: any): boolean {
    const dataRecordsSelectionChangeMessage = message
    if (dataRecordsSelectionChangeMessage?.records.length > 0) {
      const geometriesByDsId = {}
      //group geometries by datasource ids
      dataRecordsSelectionChangeMessage?.records?.forEach((eachRecord: any) => {
        const dsID = eachRecord?.dataSource?.id
        if (!geometriesByDsId[dsID]) {
          geometriesByDsId[dsID] = []
        }
        geometriesByDsId[dsID].push(eachRecord.feature.geometry)
      })
      MutableStoreManager.getInstance().updateStateValue(this.widgetId, 'selectedIncidentLocation', geometriesByDsId)
      return true
    }
  }

  getSettingComponentUri (messageType: MessageType, messageWidgetId?: string): string {
    return null
  }
}
