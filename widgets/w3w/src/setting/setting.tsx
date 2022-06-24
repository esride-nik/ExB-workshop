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
import { Select, Switch, TextInput, Option } from 'jimu-ui'
import what3words, { ApiVersion, What3wordsService, axiosTransport, AvailableLanguagesResponse } from '@what3words/api'

interface AvailableLanguage {
  code: string
  name: string
  nativeName: string
}

interface State {
  languages: AvailableLanguage[]
}

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, any> {
  w3wService: What3wordsService
  supportedTypes = Immutable([ArcGISDataSourceTypes.WebMap])

  state: State = {
    languages: null
  }

  constructor (props) {
    super(props)

    const w3wConfig: {
      host: string
      apiVersion: ApiVersion
    } = {
      host: 'https://api.what3words.com',
      apiVersion: ApiVersion.Version3
    }
    this.w3wService = what3words(this.props.config.w3wApiKey, w3wConfig, { transport: axiosTransport() })

    this.getLanguages()
  }

  async getLanguages () {
    this.setState({
      languages: (await this.w3wService.availableLanguages()).languages
    }, () => {
      console.log('this.availableLanguages', this.state.languages)
    })
  }

  onMapSelected = (useMapWidgetIds: string[]) => {
    this.props.onSettingChange({
      id: this.props.id,
      useMapWidgetIds: useMapWidgetIds
    })
  }

  switchShowW3wLogo = (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('showW3wLogo', evt.currentTarget.checked)
    })
  }

  switchShowW3wSquare = (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('showW3wSquare', evt.currentTarget.checked)
    })
  }

  switchShowW3wText = (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('showW3wText', evt.currentTarget.checked)
    })
  }

  switchZoomToW3wSquare = (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('zoomToW3wSquare', evt.currentTarget.checked)
    })
  }

  switchUseMapMidpoint = (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('useMapMidpoint', evt.currentTarget.checked)
    })
  }

  setW3wApiKey = (w3wApiKey: string) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('w3wApiKey', w3wApiKey)
    })
  }

  setw3wLanguage = (w3wLanguage: string) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('w3wLanguage', w3wLanguage)
    })
  }

  render () {
    const style = css`
            label {
              display: inline-flex;
              margin-left: 5px;
            }
            .switch-select {
              background-color: #01AABB;
              border-color: #01AABB;
            }
            .switch-select .switch-slider {
              background-color: #000 !important;
            }
            .switch-select.checked {
              background-color: #000;
              border-color: #01AABB;
            }
            .switch-select.checked .switch-slider {
              background-color: #01AABB !important;
            }
        `

    return (
            <div className="widget-setting p-2" css={style}>
                <SettingSection
                    className="map-selector-section"
                    title={this.props.intl.formatMessage({
                      id: 'selectMapWidget',
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
                      id: 'displayOption',
                      defaultMessage: defaultMessages.displayOptions
                    })}>
                    <SettingRow>
                        <div className="w-100">
                            <div className="checkbox-row">
                                <Switch checked={this.props.config?.showW3wLogo || false} onChange={this.switchShowW3wLogo} />
                                <label>
                                    <FormattedMessage id="showW3wLogo" defaultMessage={defaultMessages.showW3wLogo} />
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
                                    <FormattedMessage id="showW3wSquare" defaultMessage={defaultMessages.showW3wSquare} />
                                </label>
                            </div>
                        </div>
                    </SettingRow>
                    <SettingRow>
                        <div className="w-100">
                            <div className="checkbox-row">
                                <Switch
                                    checked={(this.props.config && this.props.config.showW3wText) || false}
                                    onChange={this.switchShowW3wText}
                                />
                                <label>
                                    <FormattedMessage id="showW3wText" defaultMessage={defaultMessages.showW3wText} />
                                </label>
                            </div>
                        </div>
                    </SettingRow>
                    <SettingRow>
                        <div className="w-100">
                            <div className="checkbox-row">
                                <Select onChange={this.setw3wLanguage}>
                                  {this.state.languages?.map((language: AvailableLanguage) => <Option key={language.code} value={language.code}>{language.nativeName} ({language.name})</Option>)}
                                </Select>
                                <label>
                                    <FormattedMessage id="w3wLanguage" defaultMessage={defaultMessages.w3wLanguage} />
                                </label>
                            </div>
                        </div>
                    </SettingRow>
                </SettingSection>
                <SettingSection
                    className="map-selector-section"
                    title={this.props.intl.formatMessage({
                      id: 'userOptions',
                      defaultMessage: defaultMessages.userOptions
                    })}>
                    <SettingRow>
                        <div className="w-100">
                            <div className="checkbox-row">
                                <Switch
                                    checked={(this.props.config && this.props.config.useMapMidpoint) || false}
                                    onChange={this.switchUseMapMidpoint}
                                    className='switch-select'
                                />
                                <label>
                                  {this.props.config.useMapMidpoint
                                    ? <FormattedMessage id="useMapMidpoint" defaultMessage={defaultMessages.useMapMidpoint} />
                                    : <FormattedMessage id="useClickpoint" defaultMessage={defaultMessages.useClickpoint} /> }
                                </label>
                            </div>
                        </div>
                    </SettingRow>
                    <SettingRow>
                        <div className="w-100">
                            <div className="checkbox-row">
                                <Switch
                                    checked={(this.props.config && this.props.config.zoomToW3wSquare) || false}
                                    onChange={this.switchZoomToW3wSquare}
                                />
                                <label>
                                    <FormattedMessage id="zoomToW3w" defaultMessage={defaultMessages.zoomToW3w} />
                                </label>
                            </div>
                        </div>
                    </SettingRow>
                </SettingSection>
                <SettingSection
                    className="map-selector-section"
                    title={this.props.intl.formatMessage({
                      id: 'w3wApiKey',
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
