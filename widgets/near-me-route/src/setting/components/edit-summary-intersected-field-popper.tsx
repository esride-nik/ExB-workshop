/** @jsx jsx */ // <-- make sure to include the jsx pragma
import { React, jsx, css, type IntlShape, type IMThemeVariables } from 'jimu-core'
import { TextInput, AlertPopup, Label, defaultMessages as jimuUIDefaultMessages, Switch, Radio, NumericInput } from 'jimu-ui'
import defaultMessages from '../translations/default'
import { NumberFormatting } from '../constants'
import { type SummaryExpressionFieldInfo, type SummaryFieldsInfo } from '../../config'

interface Props {
  intl?: IntlShape
  isOpen?: boolean
  theme?: IMThemeVariables
  editSummaryFields: SummaryExpressionFieldInfo & SummaryFieldsInfo
  sumOfIntersectedFieldPopupTitle: string
  children?: React.ReactNode
  onClose?: () => void
  onOkClick?: (
    summaryFieldLabel: string,
    showThousandSeparator: boolean,
    formattingOptions?: string,
    significantDigit?: number
  ) => void
}

interface IState {
  isEditSummaryPopperActive: boolean
  showThousandSeparator: boolean
  summaryFieldLabel: string
  formattingOptions: string
  significantDigit: number
}

export default class EditSummaryIntersectedFieldsPopper extends React.PureComponent<Props, IState> {
  constructor (props) {
    super(props)
    // if summary intersected fields are in editing then get the edited summary field info
    this.state = {
      isEditSummaryPopperActive: this.props.isOpen,
      showThousandSeparator: this.props.editSummaryFields.summaryFieldInfo?.showSeparator,
      summaryFieldLabel: this.props.editSummaryFields?.fieldLabel,
      formattingOptions: this.props.editSummaryFields.summaryFieldInfo?.numberFormattingOption,
      significantDigit: this.props.editSummaryFields.summaryFieldInfo?.significantDigits
    }
  }

  nls = (id: string) => {
    //for unit testing no need to mock intl we can directly use default en msg
    const messages = Object.assign({}, defaultMessages, jimuUIDefaultMessages)
    if (this.props.intl?.formatMessage) {
      return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] })
    } else {
      return messages[id]
    }
  }

  /**
   * Update the summary field label
   * @param e event on field label change
   */
  onFieldLabelChange = (e) => {
    const value = e.target.value
    this.setState({
      summaryFieldLabel: value
    })
  }

  /**
   * Update and trim the summary field label
   * @param e event on field label accept value
   */
  onFieldLabelAcceptValue = (value) => {
    this.setState({
      summaryFieldLabel: value.trim()
    })
  }

  /**
   * Update the selected values on OK button click and close the summary popper
   */

  onOkButtonClicked = () => {
    if (this.state.summaryFieldLabel === '') {
      return
    }
    this.setState({
      isEditSummaryPopperActive: false
    })
    this.props.onOkClick(
      this.state.summaryFieldLabel,
      this.state.showThousandSeparator,
      this.state.formattingOptions,
      this.state.significantDigit
    )
    this.props.onClose()
  }

  /**
   * Close the edit summary popper
   */
  onCancelButtonClicked = () => {
    this.setState({
      isEditSummaryPopperActive: false
    })
    this.props.onClose()
  }

  /**
   * Update the show thousand separator parameter
   * @param evt event on separator change
   */
  onSeparatorChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      showThousandSeparator: evt.target.checked
    })
  }

  /**
   * Update the formatting options and respective significant digits
   * @param e event on formatting change
   */
  handleFormattingChange = (e) => {
    this.setState({
      formattingOptions: e.target.value
    })
    if (e.target.value === NumberFormatting.Round || e.target.value === NumberFormatting.Truncate) {
      this.setState({
        significantDigit: 2
      })
    }
  }

  /**
   * Update the significant digits parameter
   * @param value digits value
   */
  onDigitsChange = (value: number | undefined) => {
    const updatedDigits = Math.floor(value)
    this.setState({
      significantDigit: updatedDigits
    })
  }

  render () {
    const editPopperCSS = css`
      .hidden{
        display: none;
      }

      .cursor-pointer {
        cursor: pointer;
      }

      .separatorSwitch {
        margin-left: 130px;
      }

      .modal-content  {
        background: var(--light-300);
      }

      .invalid-value {
        border: 1px solid  ${this.props.theme.colors.danger};
        box-shadow: 0 0 5px  ${this.props.theme.colors.danger};
      }
    `
    return <div>
      <AlertPopup css={editPopperCSS}
        aria-expanded={this.state.isEditSummaryPopperActive}
        isOpen={this.state.isEditSummaryPopperActive}
        onClickOk={this.onOkButtonClicked.bind(this)}
        onClickClose={this.onCancelButtonClicked.bind(this)}
        title={this.props.sumOfIntersectedFieldPopupTitle}>
        <table cellPadding={10}>
          <tbody>
            <tr>
              <td><Label className={'mt-2'}>{this.nls('label')}</Label></td>
              <td colSpan={2}>
                <TextInput role={'textbox'} aria-label={this.nls('label') + this.state.summaryFieldLabel} size={'sm'} title={this.state.summaryFieldLabel}
                  className={this.state.summaryFieldLabel === '' ? 'invalid-value' : ''}
                  value={this.state.summaryFieldLabel} onAcceptValue={this.onFieldLabelAcceptValue} onChange={this.onFieldLabelChange} />
              </td>
            </tr>
            <tr>
              <td><Label className={'mt-2'}>{this.nls('showSeparator')}</Label></td>
              <td colSpan={2}>
                <Switch className={'separatorSwitch'} role={'switch'} aria-label={this.nls('showSeparator')} title={this.nls('showSeparator')}
                  checked={this.state.showThousandSeparator} onChange={this.onSeparatorChange} />
              </td>
            </tr>
            <tr>
              <td>
                <Label className='m-0' centric>
                  <Radio role={'radio'} aria-label={this.nls('noFormatting')}
                    className={'cursor-pointer'}
                    value={'noFormatting'}
                    onChange={(e) => { this.handleFormattingChange(e) }}
                    checked={this.state.formattingOptions === 'noFormatting'} />
                  <div tabIndex={0} className='ml-1 text-break cursor-pointer'>
                    {this.nls('noFormatting')}
                  </div>

                </Label>
              </td>

              <td>
                <Label className='m-0' centric>
                  <Radio role={'radio'} aria-label={this.nls('round')}
                    className={'cursor-pointer'}
                    value={'round'}
                    onChange={(e) => { this.handleFormattingChange(e) }}
                    checked={this.state.formattingOptions === 'round'} />
                  <div tabIndex={0} className='ml-1 text-break cursor-pointer'>
                    {this.nls('round')}
                  </div>
                </Label>
              </td>

              <td>
                <Label className='m-0' centric>
                  <Radio role={'radio'} aria-label={this.nls('truncate')}
                    className={'cursor-pointer'}
                    value={'truncate'}
                    onChange={(e) => { this.handleFormattingChange(e) }}
                    checked={this.state.formattingOptions === 'truncate'} />
                  <div tabIndex={0} className='ml-1 text-break cursor-pointer'>
                    {this.nls('truncate')}
                  </div>
                </Label>
              </td>
            </tr>
            {this.state.formattingOptions !== 'noFormatting' &&
              <tr>
                <td tabIndex={0} aria-label={this.nls('significantDigitsLabel')}><Label>{this.nls('significantDigitsLabel')}</Label></td>
                <td colSpan={2}>
                  <NumericInput aria-label={this.nls('significantDigitsLabel')} className={'significantDigitsLabel'}
                    size={'sm'} min={0} max={10} defaultValue={this.state.significantDigit} value={this.state.significantDigit}
                    onChange={this.onDigitsChange} />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </AlertPopup>
    </div>
  }
}
