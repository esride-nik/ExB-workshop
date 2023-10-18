import { type DataRecord, DataRecordsSelectionChangeMessage, MessageManager, React } from 'jimu-core'
import { Button } from 'jimu-ui'

export default class Widget extends React.PureComponent<unknown> {
  publishMessage (e: any) {
    const id = 'one'
    const result = {
      records: [] as DataRecord[]
    }

    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(id, result.records)
    )
  }

  render () {
    return <Button onClick={this.publishMessage}></Button>
  }
}
