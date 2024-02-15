import { AllDataSourceTypes, type IMFieldSchema, Immutable, React, type UseDataSource } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import defaultMessages from './translations/default'
import { DataSourceSelector, FieldSelector } from 'jimu-ui/advanced/data-source-selector'

export default function Setting (props: AllWidgetSettingProps<unknown>) {
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

  const onFieldChange = (allSelectedFields: IMFieldSchema[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: [{ ...props.useDataSources[0], ...{ fields: allSelectedFields.map(f => f.jimuName) } }]
    })
  }

  return (
        <div className="use-feature-layer-setting p-2">
            <SettingSection
                className="map-selector-section"
                title={props.intl.formatMessage({
                  id: 'mapWidgetLabel',
                  defaultMessage: defaultMessages.selectMapWidget
                })}>
                <SettingRow>
                  {/* <MapWidgetSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds} /> */}

                  <DataSourceSelector
                      types={Immutable([AllDataSourceTypes.FeatureLayer])}
                      useDataSources={props.useDataSources}
                      useDataSourcesEnabled={props.useDataSourcesEnabled}
                      onToggleUseDataEnabled={onToggleUseDataEnabled}
                      onChange={onDataSourceChange}
                      widgetId={props.id}
                  />
                </SettingRow>
                <SettingRow>
                  {
                    props.useDataSources && props.useDataSources.length > 0 &&
                    <FieldSelector
                      useDataSources={props.useDataSources}
                      onChange={onFieldChange}
                      selectedFields={props.useDataSources[0].fields || Immutable([])}
                    />
                  }
                </SettingRow>
            </SettingSection>
        </div>
  )
}
