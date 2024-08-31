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
import { React, Immutable, css, jsx } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import { ArcGISDataSourceTypes } from 'jimu-arcgis'
import { IMConfig } from '../config'
import defaultMessages from './translations/default'

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, any> {
  supportedTypes = Immutable([ArcGISDataSourceTypes.WebMap])

  onMapSelected = (useMapWidgetIds: string[]) => {
    this.props.onSettingChange({
      id: this.props.id,
      useMapWidgetIds: useMapWidgetIds
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
                        <MapWidgetSelector onSelect={this.onMapSelected} useMapWidgetIds={this.props.useMapWidgetIds} />
                    </SettingRow>
                </SettingSection>
            </div>
    )
  }
}
