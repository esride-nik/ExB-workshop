import { AllDataSourceTypes, Immutable, React, type UseDataSource } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import defaultMessages from './translations/default'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'

export default function Setting (props: AllWidgetSettingProps<unknown>) {
  // const onFieldChange = (allSelectedFields: IMFieldSchema[]) => {
  //     props.onSettingChange({
  //         id: props.id,
  //         useDataSources: [{ ...props.useDataSources[0], ...{ fields: allSelectedFields.map((f) => f.jimuName) } }],
  //     });
  // };

  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
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
      useDataSources: useDataSources
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
            </SettingSection>
        </div>
  )
}
