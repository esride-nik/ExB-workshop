/** @jsx jsx */ // <-- make sure to include the jsx pragma
import { React, jsx, type IntlShape, type IMThemeVariables } from 'jimu-core'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { getSearchSettingStyle } from '../lib/style'
import defaultMessages from '../translations/default'
import { Select, Option, Label, NumericInput, Radio, Switch, CollapsablePanel, defaultMessages as jimuUIDefaultMessages, Checkbox } from 'jimu-ui'
import { type SearchSettings, type FontStyleSettings, type SketchTools } from '../../config'
import { defaultBufferDistance, unitOptions } from '../constants'
import { validateMaxBufferDistance, getMaxBufferLimit, getPortalUnit } from '../../common/utils'
import { PinEsriOutlined } from 'jimu-icons/outlined/gis/pin-esri'
import { PolylineOutlined } from 'jimu-icons/outlined/gis/polyline'
import { PolygonOutlined } from 'jimu-icons/outlined/gis/polygon'
import TextFormatSetting from './text-formatter'

interface Props {
  intl: IntlShape
  theme: IMThemeVariables
  config: SearchSettings
  onSearchSettingsUpdated: (prop: string, value: string | boolean | number | FontStyleSettings | SketchTools) => void
}

interface State {
  headingLabelText: string
  bufferDistance: number
  distanceUnits: string
  showDistanceSettings: boolean
  includeFeaturesMapAreaOption: boolean
  showPoint: boolean
  showPolyline: boolean
  showPolygon: boolean
  showInputAddress: boolean
  isInputSettingOpen: boolean
}

export default class SearchSetting extends React.PureComponent<Props, State> {
  constructor (props) {
    super(props)
    if (this.props.config) {
      const configuredBufferDistanceUnit = this.props.config.distanceUnits !== '' ? this.props.config.distanceUnits : getPortalUnit()
      this.state = {
        headingLabelText: this.props.config.headingLabel,
        bufferDistance: this.props.config.bufferDistance,
        distanceUnits: configuredBufferDistanceUnit,
        showDistanceSettings: this.props.config.showDistanceSettings,
        includeFeaturesMapAreaOption: this.props.config.includeFeaturesOutsideMapArea,
        showPoint: this.props.config.sketchTools?.showPoint,
        showPolyline: this.props.config.sketchTools?.showPolyline,
        showPolygon: this.props.config.sketchTools?.showPolygon,
        showInputAddress: this.props.config.showInputAddress,
        isInputSettingOpen: false
      }
    }
  }

  nls = (id: string) => {
    const messages = Object.assign({}, defaultMessages, jimuUIDefaultMessages)
    //for unit testing no need to mock intl we can directly use default en msg
    if (this.props.intl?.formatMessage) {
      return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] })
    } else {
      return messages[id]
    }
  }

  /**
   * update the heading label value
   * @param value value of the heading
   */
  onHeadingLabelChange = (value: string) => {
    this.setState({
      headingLabelText: value
    })
  }

  /**
   * update the config of the heading label
   */
  onHeadingLabelAcceptValue = (textValue: string) => {
    this.props.onSearchSettingsUpdated('headingLabel', textValue)
  }

  /**
   * update the config of the heading style
   */
  updateOnHeadingStyleChange = (textStyle: string | FontStyleSettings) => {
    this.props.onSearchSettingsUpdated('headingLabelStyle', textStyle)
  }

  /**
 * Update the config include Features Outside MapArea parameter
 * @param evt get the event on toggle the include Features Outside MapArea parameter
 */
  onIncludeFeaturesMapAreaToggleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      includeFeaturesMapAreaOption: evt.target.checked
    }, () => {
      this.props.onSearchSettingsUpdated('includeFeaturesOutsideMapArea', this.state.includeFeaturesMapAreaOption)
      //set the heading label according to the include Features Outside MapArea parameter enabled or disabled
      this.setState({
        headingLabelText: evt.target.checked ? this.nls('disabledDefineSearchAreaLabel') : this.nls('currentMapAreaLabel')
      }, () => {
        setTimeout(() => {
          this.props.onSearchSettingsUpdated('headingLabel', this.state.headingLabelText)
        }, 100)
      })
    })
  }

  /**
   * Update the buffer unit and buffer distance parameter
   * @param evt get the event after distance unit change
   */
  onDistanceUnitChange = (evt: any) => {
    const bufferDistanceMaxLimit = validateMaxBufferDistance(this.state.bufferDistance, evt.target.value)
    this.props.onSearchSettingsUpdated('bufferDistance', bufferDistanceMaxLimit)
    this.setState({
      distanceUnits: evt.target.value,
      bufferDistance: bufferDistanceMaxLimit
    }, () => {
      setTimeout(() => {
        this.props.onSearchSettingsUpdated('distanceUnits', this.state.distanceUnits)
      }, 50)
    })
  }

  /**
   * Update buffer distance parameter
   * @param value get the value on buffer distance change
   */
  onBufferDistanceChange = (value: number | undefined) => {
    this.setState({
      bufferDistance: value ?? defaultBufferDistance
    }, () => {
      this.props.onSearchSettingsUpdated('bufferDistance', this.state.bufferDistance)
    })
  }

  /**
   * @param isSearchByActiveMapArea Check if the map current extent radio button is checked or not
   */
  handleSearchByChange = (isSearchByActiveMapArea: boolean) => {
    let headingLabelTextValue = ''
    //set the heading label according to the current map area and location enabled or disabled
    if (isSearchByActiveMapArea) {
      headingLabelTextValue = this.state.includeFeaturesMapAreaOption ? this.nls('disabledDefineSearchAreaLabel') : this.nls('currentMapAreaLabel')
    } else {
      headingLabelTextValue = this.nls('locationLabel')
    }
    this.setState({
      headingLabelText: headingLabelTextValue
    }, () => {
      setTimeout(() => {
        this.props.onSearchSettingsUpdated('headingLabel', this.state.headingLabelText)
      }, 100)
    })
    this.props.onSearchSettingsUpdated('searchByActiveMapArea', isSearchByActiveMapArea)
  }

  /**
   * Toggle inputs on click of collapsible to expand or collapse the panel
   */
  onToggleInputs = () => {
    this.setState({
      isInputSettingOpen: !this.state.isInputSettingOpen
    })
  }

  /**
   * Update show distance settings checkbox state
   * @param evt get the event after show distance settings checkbox state change
   */
  onShowDistanceSettingsChange = (evt: any) => {
    this.setState({
      showDistanceSettings: evt.target.checked
    }, () => {
      setTimeout(() => {
        this.props.onSearchSettingsUpdated('showDistanceSettings', this.state.showDistanceSettings)
      }, 50)
    })
  }

  /**
   * Updates the sketchTools config if any parameter is updated
   * @param showPoint show point option
   * @param showPolyline show polyline option
   * @param showPolygon show polygon option
   */
  sketchToolsObj = (showPoint: boolean, showPolyline: boolean, showPolygon: boolean) => {
    const sketchTools: SketchTools = {
      showPoint: showPoint,
      showPolyline: showPolyline,
      showPolygon: showPolygon
    }
    this.props.onSearchSettingsUpdated('sketchTools', sketchTools)
  }

  /**
   * Update show sketch tool settings switch state
   * @param evt get the event after show sketch tool settings switch state change
   */
  showSketchTools = (evt: any) => {
    evt.target.title === this.nls('point') && this.setState({
      showPoint: evt.target.checked
    }, () => {
      this.sketchToolsObj(this.state.showPoint, this.state.showPolyline, this.state.showPolygon)
    })

    evt.target.title === this.nls('polyline') && this.setState({
      showPolyline: evt.target.checked
    }, () => {
      this.sketchToolsObj(this.state.showPoint, this.state.showPolyline, this.state.showPolygon)
    })

    evt.target.title === this.nls('polygon') && this.setState({
      showPolygon: evt.target.checked
    }, () => {
      this.sketchToolsObj(this.state.showPoint, this.state.showPolyline, this.state.showPolygon)
    })
  }

  /**
 * Update show input / closest address from input address checkbox state
 * @param evt get the event after show input address settings checkbox state change
 */
  onShowInputAddressSettingsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      showInputAddress: evt.target.checked
    }, () => {
      this.props.onSearchSettingsUpdated('showInputAddress', this.state.showInputAddress)
    })
  }

  render () {
    return (
      <div css={getSearchSettingStyle(this.props.theme)} style={{ height: '100%', width: '100%' }}>
        <React.Fragment>
          <SettingRow flow='wrap'>
            <Label className='m-0' centric>
              <Radio role={'radio'} aria-label={this.nls('searchByActiveMapArea')}
                className={'cursor-pointer'}
                value={'searchByActiveMapArea'}
                onChange={() => { this.handleSearchByChange(true) }}
                checked={this.props.config.searchByActiveMapArea} />
              <div tabIndex={0} className='ml-1 text-break cursor-pointer' onClick={() => { !this.props.config.searchByActiveMapArea && this.handleSearchByChange(true) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    this.handleSearchByChange(true)
                  }
                }}>
                {this.nls('searchByActiveMapArea')}
              </div>
            </Label>
          </SettingRow>

          <SettingRow className={'mt-2'} flow='wrap'>
            <Label className='m-0' centric>
              <Radio role={'radio'} aria-label={this.nls('searchByLocation')}
                className={'cursor-pointer'}
                value={'searchByLocation'}
                onChange={() => { this.handleSearchByChange(false) }}
                checked={!this.props.config.searchByActiveMapArea} />
              <div tabIndex={0} className='ml-1 text-break cursor-pointer' onClick={() => { this.props.config.searchByActiveMapArea && this.handleSearchByChange(false) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    this.handleSearchByChange(false)
                  }
                }}>
                {this.nls('searchByLocation')}
              </div>
            </Label>
          </SettingRow>

          <SettingRow className='ml-2' flow={'wrap'}>
            <Label aria-label={this.nls('headingLabel')} title={this.nls('headingLabel')}
              className='w-100 d-flex'>
              <div className='text-truncate flex-grow-1 setting-text-level-3'>
                {this.nls('headingLabel')}
              </div>
            </Label>
            <TextFormatSetting
              intl={this.props.intl}
              theme={this.props.theme}
              hintMessage={this.state.headingLabelText}
              noResultFound={'noResultFound'}
              textStyle={this.props.config.headingLabelStyle}
              onTextMessageChange={this.onHeadingLabelAcceptValue}
              onTextFormatChange={this.updateOnHeadingStyleChange}
            />
          </SettingRow>

          {this.props.config.searchByActiveMapArea &&
            <SettingRow className='ml-2' label={this.nls('featuresOutsideMapArea')}>
              <Switch role={'switch'} aria-label={this.nls('featuresOutsideMapArea')} title={this.nls('featuresOutsideMapArea')}
                checked={this.state.includeFeaturesMapAreaOption} onChange={this.onIncludeFeaturesMapAreaToggleChange} />
            </SettingRow>
          }

          {this.state.includeFeaturesMapAreaOption && this.props.config.searchByActiveMapArea &&
            <SettingRow className='ml-2'>
              <Label tabIndex={0} aria-label={this.nls('searchAreaHint')} className='font-italic w-100 d-flex'>
                <div className='flex-grow-1 text-break setting-text-level-3'>
                  {this.nls('searchAreaHint')}
                </div>
              </Label>
            </SettingRow>
          }

          {!this.props.config.searchByActiveMapArea &&
            <React.Fragment>
              <SettingRow className={'mt-4 ml-2'} flow={'wrap'}>
                <Label title={this.nls('bufferDistance')}
                  className='w-100 d-flex'>
                  <div className='text-truncate flex-grow-1 setting-text-level-3'>
                    {this.nls('bufferDistance')}
                  </div>
                </Label>
                <NumericInput aria-label={this.nls('bufferDistance')} style={{ width: '240px' }}
                  size={'sm'} min={0} max={getMaxBufferLimit(this.state.distanceUnits)}
                  defaultValue={this.state.bufferDistance} value={this.state.bufferDistance}
                  onChange={this.onBufferDistanceChange} />
              </SettingRow>

              <SettingRow className={'ml-2'} flow={'wrap'}>
                <Label title={this.nls('distanceUnits')}
                  className='w-100 d-flex'>
                  <div className='text-truncate flex-grow-1 setting-text-level-3'>
                    {this.nls('distanceUnits')}
                  </div>
                </Label>
                <Select style={{ marginBottom: '1px' }} aria-label={this.nls('distanceUnits') + ' ' + this.state.distanceUnits} size={'sm'}
                  value={this.state.distanceUnits} onChange={(evt) => { this.onDistanceUnitChange(evt) }}>
                  {unitOptions.map((option, index) => {
                    return <Option role={'option'} tabIndex={0} aria-label={option.label} value={option.value} key={index}>{this.nls(option.value)}</Option>
                  })}
                </Select>
              </SettingRow>

              <SettingRow className='border-top pt-3'>
                <CollapsablePanel
                  label={this.nls('inputsCollapsible')}
                  isOpen={this.state.isInputSettingOpen}
                  onRequestOpen={() => { this.onToggleInputs() }}
                  onRequestClose={() => { this.onToggleInputs() }}>
                  <div style={{ height: '100%', marginTop: 10 }}>
                    <SettingRow>
                      <Label check centric style={{ cursor: 'pointer' }}>
                        <Checkbox role={'checkbox'} aria-label={this.nls('showDistanceSettings')}
                          style={{ cursor: 'pointer' }} className='mr-2' checked={this.state.showDistanceSettings}
                          onChange={this.onShowDistanceSettingsChange.bind(this)}
                        />
                        {this.nls('showDistanceSettings')}
                      </Label>
                    </SettingRow>

                    <SettingRow>
                      <Label check centric style={{ cursor: 'pointer' }}>
                        <Checkbox role={'checkbox'} aria-label={this.nls('inputAddress')}
                          style={{ cursor: 'pointer' }} className='mr-2' checked={this.state.showInputAddress}
                          onChange={this.onShowInputAddressSettingsChange.bind(this)}
                        />
                        {this.nls('inputAddress')}
                      </Label>
                    </SettingRow>

                    <SettingRow>
                      <Label title={this.nls('showSketchTools')}
                        className='w-100 d-flex'>
                        <div className='text-truncate flex-grow-1'>
                          {this.nls('showSketchTools')}
                        </div>
                      </Label>
                    </SettingRow>

                    <SettingRow className='mt-2 mx-2'>
                        <PinEsriOutlined size={'m'} />
                        <Label className='ml-2 w-100 justify-content-between' check centric style={{ cursor: 'pointer' }}>{this.nls('point')}
                          <Switch role={'switch'} aria-label={this.nls('point')} title={this.nls('point')}
                            checked={this.state.showPoint} onChange={this.showSketchTools} />
                        </Label>
                      </SettingRow>

                      <SettingRow className='mt-1 mx-2'>
                        <PolylineOutlined size={'m'} />
                        <Label className='ml-2 w-100 justify-content-between' check centric style={{ cursor: 'pointer' }}>{this.nls('polyline')}
                          <Switch role={'switch'} aria-label={this.nls('polyline')} title={this.nls('polyline')}
                            checked={this.state.showPolyline} onChange={this.showSketchTools} />
                        </Label>
                      </SettingRow>

                      <SettingRow className='mt-1 mx-2'>
                        <PolygonOutlined size={'m'} />
                        <Label className='ml-2 w-100 justify-content-between' check centric style={{ cursor: 'pointer' }}>{this.nls('polygon')}
                          <Switch role={'switch'} aria-label={this.nls('polygon')} title={this.nls('polygon')}
                            checked={this.state.showPolygon} onChange={this.showSketchTools} />
                        </Label>
                      </SettingRow>
                  </div>
                </CollapsablePanel>
              </SettingRow>
            </React.Fragment>
          }
        </React.Fragment>
      </div>
    )
  }
}
