import { React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import defaultMessages from './translations/default'
import { Label, Radio } from 'jimu-ui'
import { MeterValueOption, type IMConfig } from '../config'

export default function Setting (props: AllWidgetSettingProps<IMConfig>) {
  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    })
  }

  const setMeterValueOption = (value: string) => {
    const meterValueOption = MeterValueOption[value]
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        meterValueOption
      }
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
                className="meter-values-section"
                title={props.intl.formatMessage({
                  id: 'headerMeterValues',
                  defaultMessage: defaultMessages.headerMeterValues
                })}>
                <SettingRow>
                  <Radio
                    aria-label='oneDecimalPlace'
                    checked={props.config.meterValueOption === MeterValueOption.oneDecimalPlace}
                    onClick={(r: any) => { setMeterValueOption(r.target.value) }}
                    value='oneDecimalPlace'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'oneDecimalPlace',
                    defaultMessage: defaultMessages.oneDecimalPlace
                  })}</Label>

                  <Radio
                    aria-label='twoDecimalPlaces'
                    checked={props.config.meterValueOption === MeterValueOption.twoDecimalPlaces}
                    onClick={(r: any) => { setMeterValueOption(r.target.value) }}
                    value='twoDecimalPlaces'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'twoDecimalPlaces',
                    defaultMessage: defaultMessages.twoDecimalPlaces
                  })}</Label>

                  <Radio
                    aria-label='decimalPlacesRounded'
                    checked={props.config.meterValueOption === MeterValueOption.decimalPlacesRounded}
                    onClick={(r: any) => { setMeterValueOption(r.target.value) }}
                    value='decimalPlacesRounded'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'decimalPlacesRounded',
                    defaultMessage: defaultMessages.decimalPlacesRounded
                  })}</Label>

                  <Radio
                    aria-label='noDecimalPlaces'
                    checked={props.config.meterValueOption === MeterValueOption.noDecimalPlaces}
                    onClick={(r: any) => { setMeterValueOption(r.target.value) }}
                    value='noDecimalPlaces'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'noDecimalPlaces',
                    defaultMessage: defaultMessages.noDecimalPlaces
                  })}</Label>
                </SettingRow>
            </SettingSection>
        </div>
  )
}
