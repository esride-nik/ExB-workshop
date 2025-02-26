import { React, appActions, getAppStore, type AllWidgetProps } from 'jimu-core'
import { type IMConfig } from '../config'
import { Button } from 'jimu-ui'
import { useEffect, useState } from 'react'

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const dsNames = ['2024', '2023']
  const [chartWidgetsArray, setChartWidgetsArray] = useState([] as any[])
  // Ich gehe in dem Beispiel davon aus, dass die in diesem Widget 1. ausgewählte Datenquelle,
  // die Standard-Datenquelle im Chart Widget ist.
  const [activeDataSource, setActiveDataSource] = useState<number>(0)

  // Wird aufgerufen bevor das Widget das 1. Mal gezeichnet wird
  useEffect(() => {
    const widgets = getAppStore().getState().appConfig.widgets
    const widgetsArray = Object.values(widgets)
    const chartWidgets = widgetsArray.filter(w => w.uri === 'widgets/common/chart/')
    setChartWidgetsArray(chartWidgets)
  }, [])

  const updateDataSource = (index: number): void => {
    if (chartWidgetsArray && chartWidgetsArray.length > 0) {
      const chartWidget = chartWidgetsArray[0]
      // Datenquelle ändern
      chartWidget.useDataSources[0] = props.useDataSources[index]
      // Den AppState des Widgets aktualisieren, damit das Widget neu gezeichnet wird.
      // Dabei wird dann die neue Datenquelle verwendet
      // Der eigentliche Inhalt den wir hier schreiben wird im ChartWidget nicht ausgewertet,
      // da dort das Property activeDs unbekannt ist. Aber das Neuzeichnen wird ausgelöst.
      getAppStore().dispatch(appActions.widgetStatePropChange(
        chartWidget.id,
        'activeDs',
        index
      ))
      setActiveDataSource(index)
    }
  }

  const isConfigured = () => {
    return props.useDataSources && props.useDataSources.length > 1
  }

  const chartWidgetsFound = () => {
    return chartWidgetsArray && chartWidgetsArray.length >= 1
  }

  if (!chartWidgetsFound()) {
    return (
      <h5>
        Kein Chart Widget gefunden. In der Anwendung muss sich mind. 1 Diagramm befinden.
      </h5>
    )
  }

  if (!isConfigured()) {
    return (
      <h5>
        Bitte mindestens 2 Datenquellen konfigurieren.
        Die 1. Datenquelle muss der Datenquelle des Chart Widgets entsprechen.
        Die weiteren Datenquellen müssen die gleiche Datenstruktur haben.
      </h5>
    )
  }

  return (
    <p className="widget-demo jimu-widget m-2">
      <p>Change Ds Widget</p>
      {props.useDataSources.map((item, index) => {
        return <Button onClick={() => { updateDataSource(index) }} disabled={activeDataSource === index}>
          {dsNames[index]}
        </Button>
      })}
    </p>
  )
}

export default Widget
