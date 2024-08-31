/** @jsx jsx */
import { jsx, type IMThemeVariables, ReactResizeDetector } from 'jimu-core'
import { Row } from 'jimu-ui'
import React from 'react'
import { getSummaryCardStyle } from '../lib/style'

interface Props {
  widgetId: string
  theme: IMThemeVariables
  fieldLabel: string
  fieldColor: string
  summaryDisplayValue: string
}

interface State {
  textColor: string
  fieldLabelWidth: string
}

export default class SummaryFieldCard extends React.PureComponent<Props, State> {
  private readonly summaryValue: React.RefObject<HTMLDivElement>
  private readonly summaryField: React.RefObject<HTMLDivElement>
  private readonly summaryCardParent: React.RefObject<HTMLDivElement>
  constructor (props) {
    super(props)
    this.summaryValue = React.createRef()
    this.summaryField = React.createRef()
    this.summaryCardParent = React.createRef()
    this.state = {
      textColor: '',
      fieldLabelWidth: ''
    }
  }

  /**
   * On component mount update the summary value and summary text value
   */
  componentDidMount = () => {
    this.updateTextColor()
  }

  /**
   * Check the current config property or runtime property changed in live view
   * @param prevProps previous property
   */
  componentDidUpdate = (prevProps) => {
    //check if field color is changed
    if (prevProps.fieldColor !== this.props.fieldColor) {
      this.updateTextColor()
    }
  }

  /**
   * Update text color according to the configured field color
   */
  updateTextColor = () => {
    const textColor = this.getTextColor(this.props.fieldColor)
    this.setState({
      textColor: textColor
    })
  }

  /**
   * Adjust the field label width on resize of the widget
   * @param widgetWidth widget width
   */
  onResize = (widgetWidth: number) => {
    if (widgetWidth > 0) {
      setTimeout(() => {
        // if widget size is below 280 then show value in next row
        // else show label and value in one row
        if (widgetWidth < 280) {
          this.setState({
            fieldLabelWidth: '100%'
          })
        } else {
          const summaryValueWidth = this.summaryValue.current.offsetWidth + 9
          const summaryFieldWidth = this.summaryField.current.offsetWidth
          const summaryCardWidth = this.summaryCardParent.current.offsetWidth - 16
          const totalFieldValueWidth = summaryFieldWidth + summaryValueWidth
          //change card width is less than its content or label width is 100%
          if (totalFieldValueWidth <= summaryCardWidth || summaryCardWidth === summaryFieldWidth + 8) {
            if (summaryValueWidth > 0) {
              this.setState({
                fieldLabelWidth: 'calc(100% -' + ' ' + summaryValueWidth + 'px)'
              })
            }
          }
        }
      }, 50)
    }
  }

  /**
   * get the text color depending on the field color
   * @param hexcolor configured field color
   * @returns text color
   */
  getTextColor = (hexcolor) => {
    const r = parseInt(hexcolor.substr(1, 2), 16)
    const g = parseInt(hexcolor.substr(3, 2), 16)
    const b = parseInt(hexcolor.substr(4, 2), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    // Return white color if to dark, else black
    return (yiq < 60) ? '#FFFFFF' : '#000000'
  }

  render () {
    const classes = 'summaryCard pl-2 pr-2 pt-5 pb-5 mb-2 rounded-lg summaryBgColor shadow-sm'
    return (
      <div css={getSummaryCardStyle(this.props.theme, this.props.fieldColor, this.state.textColor, this.state.fieldLabelWidth)}>
        <Row flow='wrap'>
          <div className={classes} ref={this.summaryCardParent}>
            <div ref={this.summaryField} className='field textColor text-break mr-2'>
              <label className='w-100 mb-0'>{this.props.fieldLabel}</label>
            </div>
            {this.props.summaryDisplayValue &&
                <div ref={this.summaryValue}>
                  <div className={'font-weight-bold summary-value textColor'}>{this.props.summaryDisplayValue}</div>
                </div>
            }
          </div>
        </Row>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
      </div>
    )
  }
}
