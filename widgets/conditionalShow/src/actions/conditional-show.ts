import { AbstractMessageAction, MessageType, type Message, getAppStore, appActions, type StringSelectionChangeMessage, type DataRecordsSelectionChangeMessage, type MessageDescription } from 'jimu-core'

export default class QueryAction extends AbstractMessageAction {
  filterMessageDescription (messageDescription: MessageDescription): boolean {
    return [MessageType.StringSelectionChange, MessageType.DataRecordsSelectionChange].includes(messageDescription.messageType)
  }

  filterMessage (message: Message): boolean { return true }

  //set action setting uri
  getSettingComponentUri (messageType: MessageType, messageWidgetId?: string): string {
    return 'actions/conditional-show-setting'
  }

  onExecute (message: Message, actionConfig?: any): Promise<boolean> | boolean {
    const records = (message as any).records as any[]
    if (records.length === 0) {
      return false
    }

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const q = (message as any).records[0].feature?.attributes[actionConfig.fieldName]

    //Save queryString to store
    getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'queryString', q))
    return true
  }
}
