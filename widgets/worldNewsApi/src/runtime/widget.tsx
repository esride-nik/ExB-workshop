import { React, type AllWidgetProps, type DataRecord, DataRecordsSelectionChangeMessage, MessageManager } from 'jimu-core'
import { Button } from 'jimu-ui'
import { newsApiCredentials } from './newsApiCredentials'
import esriRequest from '@arcgis/core/request.js'

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget (props: AllWidgetProps<{ Config }>) {
  const publishMessage = (widgetId: string, news: any) => {
    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(widgetId, news)
    )
  }

  const getNews = async () => {
    const url = ` https://newsapi.org/v2/top-headlines?apiKey=${newsApiCredentials.apiKey}`
    const queryUrl = `${url}&country=de`
    const news = await esriRequest(queryUrl, {
      responseType: 'json'
    })

    console.log('news', news)
    publishMessage(props.id, undefined) //news)
  }

  return <Button onClick={() => { getNews() }}>Publish message</Button>
}
