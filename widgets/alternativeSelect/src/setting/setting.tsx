import { DataSourceTypes, FormattedMessage, React, type UseDataSource } from 'jimu-core'
import Immutable from 'seamless-immutable'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import defaultMessages from './translations/default'
import { NumericInput } from 'jimu-ui'
import type { Config } from '../config'

export default function Setting (props: AllWidgetSettingProps<Config>): React.ReactElement {
  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds
    })
  }

  const onToggleUseDataEnabled = (useDataSourcesEnabled: boolean) => {
    props.onSettingChange({
      id: props.id,
      useDataSourcesEnabled
    })
  }

  const onDataSourceChange = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources
    })
  }

  const onRadiusChange = (radius: number) => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        radius
      }
    })
  }

  return (
        <div className="sample-js-api-widget-setting p-2">
            <p>
                <h5>
                    <FormattedMessage id="selectMap" defaultMessage={defaultMessages.selectMap} />
                </h5>
                <MapWidgetSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds} />
            </p>
            <p>
                <h5>
                    <FormattedMessage id="selectDs" defaultMessage={defaultMessages.selectDs} />
                </h5>
                <DataSourceSelector
                    types={Immutable([DataSourceTypes.FeatureLayer])}
                    useDataSources={props.useDataSources}
                    useDataSourcesEnabled={props.useDataSourcesEnabled}
                    onToggleUseDataEnabled={onToggleUseDataEnabled}
                    onChange={onDataSourceChange}
                    widgetId={props.id}
                />
                <NumericInput onChange={onRadiusChange} value={props.config.radius} precision={0} showHandlers={true} />
            </p>
        </div>
  )
}
