import { React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import defaultMessages from './translations/default'
import { Label, Radio, Switch, TextArea } from 'jimu-ui'
import { MeterValueOption, type IMConfig } from '../config'

import './measureAndProjectSettings.css'

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

  const switchDistanceMeasurementEnabled = () => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        distanceMeasurementEnabled: !props.config.distanceMeasurementEnabled
      }
    })
  }

  const switchAreaMeasurementEnabled = () => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        areaMeasurementEnabled: !props.config.areaMeasurementEnabled
      }
    })
  }

  const switchLocationMeasurementEnabled = () => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        locationMeasurementEnabled: !props.config.locationMeasurementEnabled
      }
    })
  }

  const setHeaderText = (headerText: string) => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        headerText
      }
    })
  }

  const setCopyText = (copyText: string) => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        copyText
      }
    })
  }

  const setDisclaimerText = (disclaimerText: string) => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        disclaimerText
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
                </SettingRow>
                <SettingRow>
                  <Radio
                    aria-label='twoDecimalPlaces'
                    checked={props.config.meterValueOption === MeterValueOption.twoDecimalPlaces}
                    onClick={(r: any) => { setMeterValueOption(r.target.value) }}
                    value='twoDecimalPlaces'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'twoDecimalPlaces',
                    defaultMessage: defaultMessages.twoDecimalPlaces
                  })}</Label>
                  </SettingRow>
                  <SettingRow>
                  <Radio
                    aria-label='decimalPlacesRoundedTo05'
                    checked={props.config.meterValueOption === MeterValueOption.decimalPlacesRoundedTo05}
                    onClick={(r: any) => { setMeterValueOption(r.target.value) }}
                    value='decimalPlacesRoundedTo05'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'decimalPlacesRoundedTo05',
                    defaultMessage: defaultMessages.decimalPlacesRoundedTo05
                  })}</Label>
                  </SettingRow>
                  <SettingRow>
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

            <SettingSection
                className="functions-section"
                title={props.intl.formatMessage({
                  id: 'measurementTypes',
                  defaultMessage: defaultMessages.measurementTypes
                })}>
                <SettingRow>
                  <Switch
                    aria-label='distanceMeasurement'
                    checked={props.config.distanceMeasurementEnabled}
                    onClick={switchDistanceMeasurementEnabled}
                    value='distanceMeasurement'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'distance',
                    defaultMessage: defaultMessages.distance
                  })}</Label>
                </SettingRow>
                <SettingRow>
                  <Switch
                    aria-label='areaMeasurement'
                    checked={props.config.areaMeasurementEnabled}
                    onClick={switchAreaMeasurementEnabled}
                    value='areaMeasurement'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'area',
                    defaultMessage: defaultMessages.area
                  })}</Label>
                  </SettingRow>
                  <SettingRow>
                  <Switch
                    aria-label='locationMeasurement'
                    checked={props.config.locationMeasurementEnabled}
                    onClick={switchLocationMeasurementEnabled}
                    value='locationMeasurement'
                  />&nbsp;<Label>{props.intl.formatMessage({
                    id: 'location',
                    defaultMessage: defaultMessages.location
                  })}</Label>
                </SettingRow>
            </SettingSection>

            <SettingSection
                className="text-section"
                title={props.intl.formatMessage({
                  id: 'freeText',
                  defaultMessage: defaultMessages.freeText
                })}>
                <SettingRow>
                  <Label className="text-label">{props.intl.formatMessage({
                    id: 'headerText',
                    defaultMessage: defaultMessages.headerText
                  })}
                    <TextArea
                      className="mb-4"
                      aria-label='headerText'
                      onChange={(onChangeEvent) => { setHeaderText(onChangeEvent.target.value) }}
                      value={props.config.headerText}
                    /></Label>
                </SettingRow>
                <SettingRow>
                  <Label className="text-label">{props.intl.formatMessage({
                    id: 'disclaimerText',
                    defaultMessage: defaultMessages.disclaimerText
                  })}
                  <TextArea
                    className="mb-4"
                    aria-label='disclaimerText'
                    onChange={(onChangeEvent) => { setDisclaimerText(onChangeEvent.target.value) }}
                    value={props.config.disclaimerText}
                  /></Label>
                </SettingRow>
            </SettingSection>
        </div>
  )
}
