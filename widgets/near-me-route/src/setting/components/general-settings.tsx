/** @jsx jsx */ // <-- make sure to include the jsx pragma
import { React, jsx, type IntlShape, type IMThemeVariables } from 'jimu-core'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import defaultMessages from '../translations/default'
import { Label, Tooltip } from 'jimu-ui'
import { type FontStyleSettings, type GeneralSettings } from '../../config'
import { ThemeColorPicker } from 'jimu-ui/basic/color-picker'
import { InfoOutlined } from 'jimu-icons/outlined/suggested/info'
import { getTheme2 } from 'jimu-theme'
import TextFormatSetting from './text-formatter'

interface Props {
  intl: IntlShape
  theme: IMThemeVariables
  config: GeneralSettings
  onGeneralSettingsUpdated: (prop: string, value: string | boolean | FontStyleSettings) => void
}

interface State {
  noResultsFoundMessage: string
  highlightColor: string
  promptMessage: string
}

export default class GeneralSetting extends React.PureComponent<Props, State> {
  constructor (props) {
    super(props)
    if (this.props.config) {
      this.state = {
        noResultsFoundMessage: this.props.config.noResultsFoundText,
        highlightColor: this.props.config.highlightColor ? this.props.config.highlightColor : '#00FFFF',
        promptMessage: this.props.config.promptTextMessage
      }
    }
  }

  nls = (id: string) => {
    const messages = Object.assign({}, defaultMessages)
    //for unit testing no need to mock intl we can directly use default en msg
    if (this.props.intl?.formatMessage) {
      return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] })
    } else {
      return messages[id]
    }
  }

  /**
   * Update the config as per the config changes
   * @param prevProps previous props of the config
   */
  componentDidUpdate = (prevProps: Props) => {
    if (prevProps.theme.colors.palette.primary[700] !== this.props.theme.colors.palette.primary[700]) {
      this.setState({
        highlightColor: this.props.theme.colors.palette.primary[700]
      }, () => {
        this.props.onGeneralSettingsUpdated('highlightColor', this.state.highlightColor)
      })
    }
  }

  /**
   * on change of color update the highlight color parameter
   * @param Highlight color
   */
  onHighlightColorChange = (color: string) => {
    this.setState({
      highlightColor: color
    }, () => {
      this.props.onGeneralSettingsUpdated('highlightColor', this.state.highlightColor)
    })
  }

  /**
   * Update text style
   * @param textStyle text style
   * @param textMessage text message
   */
  updateOnTextStyleChange = (textStyle: string | FontStyleSettings, textMessage: string) => {
    textMessage === 'noResultFound'
      ? this.props.onGeneralSettingsUpdated('noResultMsgStyleSettings', textStyle)
      : this.props.onGeneralSettingsUpdated('promptTextMsgStyleSettings', textStyle)
  }

  /**
   * Update text message
   * @param textMessage no results found text message
   * @param textStyle prompt text message
   */
  updateTextMessage = (textValue: string, textMessage: string) => {
    textMessage === 'noResultFound'
      ? this.props.onGeneralSettingsUpdated('noResultsFoundText', textValue)
      : this.props.onGeneralSettingsUpdated('promptTextMessage', textValue)
  }

  render () {
    return (
      <div style={{ height: '100%', width: '100%', marginTop: 10 }}>
        <SettingRow>
          <Label className='w-100 d-flex'>
            <div className='flex-grow-1 text-break setting-text-level-3'>
              {this.nls('highlightColor')}
            </div>
          </Label>
          <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('highlightColor') + ' ' + this.nls('highlightColorTooltip')}
            title={this.nls('highlightColorTooltip')} showArrow placement='top'>
             <div className='setting-text-level-2 mr-4 d-inline'>
              <InfoOutlined />
            </div>
          </Tooltip>
          <ThemeColorPicker aria-label={this.nls('highlightColor')} specificTheme={getTheme2()}
            value={(this.state.highlightColor ? this.state.highlightColor : '#00FFFF')}
            onChange={(color) => { this.onHighlightColorChange(color) }} />
        </SettingRow>

        <SettingRow flow={'wrap'}>
          <Label aria-label={this.nls('noResultsFoundLabel')} title={this.nls('noResultsFoundLabel')}
            className='w-100 d-flex'>
            <div className='text-truncate flex-grow-1 setting-text-level-3'>
              {this.nls('noResultsFoundLabel')}
            </div>
          </Label>
          <TextFormatSetting
            intl={this.props.intl}
            theme={this.props.theme}
            hintMessage={this.state.noResultsFoundMessage}
            noResultFound={'noResultFound'}
            textStyle={this.props.config.noResultMsgStyleSettings}
            onTextMessageChange={this.updateTextMessage}
            onTextFormatChange={this.updateOnTextStyleChange}
          />
        </SettingRow>

        <SettingRow>
          <Label aria-label={this.nls('promptMessageLabel')} title={this.nls('promptMessageLabel')}
            className='w-100 d-flex'>
            <div className='w-100 flex-grow-1 setting-text-level-3'>
              {this.nls('promptMessageLabel')}
            </div>
          </Label>
          <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('promptMessageLabelToolTip')}
            title={this.nls('promptMessageLabelToolTip')} showArrow placement='top'>
            <div className='setting-text-level-2 ml-2 d-inline'>
              <InfoOutlined />
            </div>
          </Tooltip>
        </SettingRow>

        <SettingRow>
          <TextFormatSetting
            intl={this.props.intl}
            theme={this.props.theme}
            hintMessage={this.state.promptMessage}
            promptTextMessage={'promtMessage'}
            textStyle={this.props.config.promptTextMsgStyleSettings}
            onTextMessageChange={this.updateTextMessage}
            onTextFormatChange={this.updateOnTextStyleChange}
          />
        </SettingRow>
      </div>
    )
  }
}
