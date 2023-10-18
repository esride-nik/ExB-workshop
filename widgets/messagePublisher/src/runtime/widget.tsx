import { React, type AllWidgetProps, type DataRecord, DataRecordsSelectionChangeMessage, MessageManager } from 'jimu-core'
import { Button } from 'jimu-ui'

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget (props: AllWidgetProps<{ Config }>) {
  const publishMessage = (e: any) => {
    const id = 'one'
    const result = {
      records: [] as DataRecord[]
    }

    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(id, result.records)
    )
  }

  return <Button onClick={publishMessage}>Publish message</Button>
}
