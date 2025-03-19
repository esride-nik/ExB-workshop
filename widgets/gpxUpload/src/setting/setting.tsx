import { AllDataSourceTypes, type IMFieldSchema, Immutable, React, type UseDataSource, DataSourceManager, type DataSourceJson, DataSourceTypes } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import defaultMessages from './translations/default'
import { DataSourceSelector, FieldSelector } from 'jimu-ui/advanced/data-source-selector'

export default function Setting (props: AllWidgetSettingProps<unknown>) {
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
    const originDsId = useDataSources[0]?.dataSourceId
    const originDs = DataSourceManager.getInstance().getDataSource(originDsId)
    const outputDsJsons: DataSourceJson[] = [{
      id: `${props.id}-ouput`,
      type: DataSourceTypes.FeatureLayer,
      label: `${props.manifest.name}-output-data-source`,
      geometryType: originDs.getDataSourceJson().geometryType,
      originDataSources: [useDataSources[0]],
      isDataInDataSourceInstance: true
    }]

    props.onSettingChange({
      id: props.id,
      useDataSources: useDataSources
    }, outputDsJsons)
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
                  id: 'selectMapWidget',
                  defaultMessage: defaultMessages.selectMapWidget
                })}>
                <SettingRow>
                    <MapWidgetSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds} />
                </SettingRow>
            </SettingSection>
            <SettingSection
                className="ds-selector-section"
                title={props.intl.formatMessage({
                  id: 'selectDs',
                  defaultMessage: defaultMessages.selectDs
                })}>
                <SettingRow>
                  <DataSourceSelector
                      types={Immutable.default([AllDataSourceTypes.FeatureLayer])}
                      useDataSources={props.useDataSources}
                      useDataSourcesEnabled={props.useDataSourcesEnabled}
                      onToggleUseDataEnabled={onToggleUseDataEnabled}
                      onChange={onDataSourceChange}
                      widgetId={props.id}
                      // TODO: Multiple origin data sources not supported
                  />
                </SettingRow>
                <SettingRow>
                  {
                    props.useDataSources && props.useDataSources.length > 0 &&
                    <FieldSelector
                      useDataSources={props.useDataSources}
                      onChange={onFieldChange}
                      selectedFields={props.useDataSources[0].fields || Immutable.default([])}
                    />
                  }
                </SettingRow>
            </SettingSection>
        </div>
  )
}
