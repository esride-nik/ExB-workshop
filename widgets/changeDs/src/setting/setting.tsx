import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { type IMConfig } from '../config'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { React, AllDataSourceTypes, Immutable, type UseDataSource } from 'jimu-core'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const onDataSourceChange = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: useDataSources
    })
  }

  return <div className="use-feature-layer-setting p-2">
    <DataSourceSelector
      types={Immutable([AllDataSourceTypes.FeatureLayer])}
      useDataSources={props.useDataSources}
      useDataSourcesEnabled={true}
      onChange={onDataSourceChange}
      widgetId={props.id}
      isMultiple={true}
    />
  </div>
}

export default Setting
