import { AllDataSourceTypes, Immutable, React, UseDataSource } from 'jimu-core'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'

export default function Setting (
  props: AllWidgetSettingProps<unknown>
): React.ReactElement {
  // const onMapSelected = (useMapWidgetIds: string[]) => {
  //   props.onSettingChange({
  //     id: props.id,
  //     useMapWidgetIds: useMapWidgetIds
  //   })
  // }

  const onToggleUseDataEnabled = (useDataSourcesEnabled: boolean) => {
    props.onSettingChange({
      id: props.id,
      useDataSourcesEnabled
    })
  }

  const onDataSourceChange = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: useDataSources
    })
  }

  return <div className="sample-js-api-widget-setting p-2">
    {/* <MapWidgetSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds} />
     */}

  <DataSourceSelector
    types={Immutable([AllDataSourceTypes.FeatureLayer])}
    useDataSources={props.useDataSources}
    useDataSourcesEnabled={props.useDataSourcesEnabled}
    onToggleUseDataEnabled={onToggleUseDataEnabled}
    onChange={onDataSourceChange}
    widgetId={props.id}
  />
  </div>
}
