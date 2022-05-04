/** @jsx jsx */
/**
  Licensing

  Copyright 2020 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, Immutable, FormattedMessage, css, jsx } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { JimuMapViewSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import { ArcGISDataSourceTypes } from 'jimu-arcgis'
import { IMConfig } from '../config'
import defaultMessages from './translations/default'
import { Switch, TextInput } from 'jimu-ui'

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, any> {
  supportedTypes = Immutable([ArcGISDataSourceTypes.WebMap])

  onMapSelected = (useMapWidgetIds: string[]) => {
    this.props.onSettingChange({
      id: this.props.id,
      useMapWidgetIds: useMapWidgetIds
    })
  }

  switchW3wOnMap = (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('w3wOnMap', evt.currentTarget.checked)
    })
  }

  switchShowW3wSquare = (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('showW3wSquare', evt.currentTarget.checked)
    })
  }

  setW3wApiKey = (w3wApiKey: string) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('w3wApiKey', w3wApiKey)
    })
  }

  render () {
    const style = css`
            label {
                display: inline-flex;
                margin-left: 5px;
            }
        `

    return (
            <div className="widget-setting p-2" css={style}>
                <SettingSection
                    className="map-selector-section"
                    title={this.props.intl.formatMessage({
                      id: 'mapWidgetLabel',
                      defaultMessage: defaultMessages.selectMapWidget
                    })}>
                    <SettingRow>
                        <JimuMapViewSelector
                            onSelect={this.onMapSelected}
                            useMapWidgetIds={this.props.useMapWidgetIds}
                        />
                    </SettingRow>
                </SettingSection>
                <SettingSection
                    className="map-selector-section"
                    title={this.props.intl.formatMessage({
                      id: 'mapWidgetLabel',
                      defaultMessage: defaultMessages.displayOption
                    })}>
                    <SettingRow>
                        <div className="w-100">
                            <div className="checkbox-row">
                                <Switch checked={this.props.config?.w3wOnMap || false} onChange={this.switchW3wOnMap} />
                                <label>
                                    <FormattedMessage id="zoomToLayer" defaultMessage={defaultMessages.w3wOnMap} />
                                </label>
                            </div>
                        </div>
                    </SettingRow>
                    <SettingRow>
                        <div className="w-100">
                            <div className="checkbox-row">
                                <Switch
                                    checked={(this.props.config && this.props.config.showW3wSquare) || false}
                                    onChange={this.switchShowW3wSquare}
                                />
                                <label>
                                    <FormattedMessage id="zoomToLayer" defaultMessage={defaultMessages.showW3wSquare} />
                                </label>
                            </div>
                        </div>
                    </SettingRow>
                </SettingSection>
                <SettingSection
                    className="map-selector-section"
                    title={this.props.intl.formatMessage({
                      id: 'mapWidgetLabel',
                      defaultMessage: defaultMessages.w3wApiKey
                    })}>
                    <SettingRow>
                        <TextInput
                            type="password"
                            placeholder={defaultMessages.w3wApiKey}
                            defaultValue={this.props.config.w3wApiKey}
                            onAcceptValue={this.setW3wApiKey}
                        />
                    </SettingRow>
                </SettingSection>
            </div>
    )
  }
}
