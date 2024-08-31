/** @jsx jsx */ // <-- make sure to include the jsx pragma
import { React, jsx, type IntlShape, type IMThemeVariables } from 'jimu-core'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import defaultMessages from '../translations/default'
import { TextArea, type FontFamilyValue } from 'jimu-ui'
import { type FontSize, type FontStyleSettings } from '../../config'
import { ThemeColorPicker } from 'jimu-ui/basic/color-picker'
import { getTheme2 } from 'jimu-theme'
import { FontStyle, type FontStyles, InputUnit } from 'jimu-ui/advanced/style-setting-components'
import { FontFamily } from 'jimu-ui/advanced/rich-text-editor'

const MIN_FONT_SIZE = 4
const MAX_FONT_SIZE = 72

interface Props {
  intl: IntlShape
  theme: IMThemeVariables
  hintMessage: string
  noResultFound?: string
  promptTextMessage?: string
  textStyle: FontStyleSettings
  onTextFormatChange: (textStyle: FontStyleSettings, textMessage?: string) => void
  onTextMessageChange: (textValue: string, textMessage?: string) => void
}

interface State {
  promptMessage: string
  fontFamily: FontFamilyValue
  fontBold: boolean
  fontItalic: boolean
  fontUnderline: boolean
  fontStrike: boolean
  fontColor: string
  fontSize: string
}

export default class TextFormatSetting extends React.PureComponent<Props, State> {
  constructor (props) {
    super(props)
    this.state = {
      promptMessage: this.props.hintMessage,
      fontFamily: this.props.textStyle?.fontFamily,
      fontBold: this.props.textStyle?.fontBold,
      fontItalic: this.props.textStyle?.fontItalic,
      fontUnderline: this.props.textStyle?.fontUnderline,
      fontStrike: this.props.textStyle?.fontStrike,
      fontColor: this.props.textStyle?.fontColor,
      fontSize: this.props.textStyle?.fontSize
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
   * Check the props has changed
   * @param prevProps previous property
   */
  componentDidUpdate = (prevProps) => {
    if (prevProps.hintMessage !== this.props.hintMessage) {
      this.setState({
        promptMessage: this.props.hintMessage
      })
    }
  }

  /**
   * Update the text message
   * @param textValue text message
   */
  onTextAccept = (textValue: string) => {
    this.props.noResultFound
      ? this.props.onTextMessageChange(textValue, this.props.noResultFound)
      : this.props.onTextMessageChange(textValue, this.props.promptTextMessage)
  }

  onTextChange = (value: string) => {
    this.setState({
      promptMessage: value
    })
  }

  /**
   * Updates the text style config if any parameter is updated
   * @param fontFamily Updated font family
   * @param fontBold Updated font style
   * @param fontItalic Updated font style
   * @param fontUnderline Updated font style
   * @param fontStrike Updated font style
   * @param fontColor Updated font color
   * @param fontSize Updated font size
   */
  textStyleObj = (fontFamily: FontFamilyValue, fontBold: boolean, fontItalic: boolean, fontUnderline: boolean, fontStrike: boolean,
    fontColor: string, fontSize: string) => {
    const textStyle: FontStyleSettings = {
      fontFamily: fontFamily,
      fontBold: fontBold,
      fontItalic: fontItalic,
      fontUnderline: fontUnderline,
      fontStrike: fontStrike,
      fontColor: fontColor,
      fontSize: fontSize
    }
    this.props.noResultFound
      ? this.props.onTextFormatChange(textStyle, this.props.noResultFound)
      : this.props.onTextFormatChange(textStyle, this.props.promptTextMessage)
  }

  /**
   * Gets updated font family on change of config
   * @param font Updated font family
   */
  handleFontChange = (fontFamily: FontFamilyValue) => {
    this.setState({
      fontFamily: fontFamily
    }, () => {
      this.textStyleObj(fontFamily, this.state.fontBold, this.state.fontItalic,
        this.state.fontUnderline, this.state.fontStrike, this.state.fontColor, this.state.fontSize)
    })
  }

  /**
   * Set the font style values
   */
  setFontStyleValues = () => {
    this.textStyleObj(this.state.fontFamily, this.state.fontBold, this.state.fontItalic,
      this.state.fontUnderline, this.state.fontStrike, this.state.fontColor, this.state.fontSize)
  }

  /**
   * Gets updated font style on change of config
   * @param fontStyle Updated font styles
   */
  handleFontStyleChange = (fontStyle: FontStyles, selected: boolean) => {
    switch (fontStyle) {
      case 'bold':
        this.setState({
          fontBold: selected
        }, () => {
          this.setFontStyleValues()
        })
        break
      case 'italic':
        this.setState({
          fontItalic: selected
        }, () => {
          this.setFontStyleValues()
        })
        break
      case 'underline'://as underline and strike having the same style 'text-decoration'
        this.setState({
          fontUnderline: selected,
          fontStrike: false
        }, () => {
          this.setFontStyleValues()
        })
        break
      case 'strike'://as underline and strike having the same style 'text-decoration'
        this.setState({
          fontUnderline: false,
          fontStrike: selected
        }, () => {
          this.setFontStyleValues()
        })
        break
    }
  }

  /**
   * Gets updated font color on change of config
   * @param color Updated font color
   */
  handleColorChange = (color: string) => {
    const defaultColor: string = 'var(--black)'
    this.setState({
      fontColor: color || defaultColor
    }, () => {
      this.textStyleObj(this.state.fontFamily, this.state.fontBold, this.state.fontItalic,
        this.state.fontUnderline, this.state.fontStrike, this.state.fontColor, this.state.fontSize)
    })
  }

  /**
   * Gets updated font size on change of config
   * @param size Updated font size
   */
  handleFontSizeChange = (size: FontSize) => {
    if (!size || size.distance < MIN_FONT_SIZE) return
    this.setState({
      fontSize: size.distance + size.unit
    }, () => {
      this.textStyleObj(this.state.fontFamily, this.state.fontBold, this.state.fontItalic,
        this.state.fontUnderline, this.state.fontStrike, this.state.fontColor, this.state.fontSize)
    })
  }

  render () {
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <SettingRow flow={'wrap'}>
          <TextArea tabIndex={0} className='w-100' spellCheck={false} aria-label={this.state.promptMessage} value={this.state.promptMessage}
            onChange={evt => { this.onTextChange(evt.target.value) }}
            onAcceptValue={this.onTextAccept}
          />
        </SettingRow>

        <div className={'w-100 pt-2'}>
          <FontFamily className='w-100' font={this.state.fontFamily} onChange={this.handleFontChange} />
          <div className='d-flex justify-content-between mt-2'>
            <FontStyle
              style={{ width: '103px' }}
              onChange={this.handleFontStyleChange}
              bold={this.state.fontBold}
              italic={this.state.fontItalic}
              underline={this.state.fontUnderline}
              strike={this.state.fontStrike}
            />
            <ThemeColorPicker
              style={{ width: '25px' }}
              specificTheme={getTheme2()}
              value={this.state.fontColor}
              onChange={this.handleColorChange}
            />
            <InputUnit
              style={{ width: '76px' }}
              min={MIN_FONT_SIZE} max={MAX_FONT_SIZE}
              value={this.state.fontSize}
              onChange={this.handleFontSizeChange}
            />
          </div>
        </div>
      </div>
    )
  }
}
