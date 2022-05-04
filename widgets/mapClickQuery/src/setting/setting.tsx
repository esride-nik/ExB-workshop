import { React, UseDataSource } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { JimuMapViewSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import defaultMessages from './translations/default'

export default function Setting (props: AllWidgetSettingProps<{}>) {
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
                    <JimuMapViewSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds} />
                </SettingRow>
            </SettingSection>
            {/* <DataSourceSelector
                types={Immutable([AllDataSourceTypes.WebMap])}
                useDataSources={props.useDataSources}
                useDataSourcesEnabled={props.useDataSourcesEnabled}
                onToggleUseDataEnabled={onToggleUseDataEnabled}
                onChange={onDataSourceChange}
                widgetId={props.id}
            />
            {props.useDataSources && props.useDataSources.length > 0 && (
                <FieldSelector
                    useDataSources={props.useDataSources}
                    onChange={onFieldChange}
                    selectedFields={props.useDataSources[0].fields || Immutable([])}
                />
                <JimuMapViewSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds} />
            )} */}
        </div>
  )
}
