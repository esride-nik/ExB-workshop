/** @jsx jsx */
import { type Expression, Immutable, jsx, utils as coreUtils, type IMThemeVariables, type UseDataSource, type DataRecord, ExpressionResolverComponent } from 'jimu-core'
import React from 'react'
import { utils, richTextUtils } from 'jimu-ui'
import { type SummaryAttributes, type SummaryFieldsInfo, type SumOfAreaLengthParam } from '../../config'
import SummaryFieldCard from './summary-field-card'

interface Props {
  widgetId: string
  theme: IMThemeVariables
  useDataSource: UseDataSource
  summaryFieldInfos: SummaryFieldsInfo[]
  records: DataRecord[]
  sumOfAreaOrLengthValue: string
  onSummaryFieldsResolved: (resolvedValues: SummaryAttributes) => void
  singleFieldColor?: string | null
}

interface State {
  formattedExpression: string | null
  summaryFieldCards: JSX.Element[]
}

export default class SummaryResult extends React.PureComponent<Props, State> {
  private resolvedSummaryValues: string[]
  constructor (props) {
    super(props)
    this.resolvedSummaryValues = []
    this.state = {
      formattedExpression: null,
      summaryFieldCards: []
    }
  }

  /**
   * On component mount update the summary value and summary text value
   */
  componentDidMount = () => {
    this.updateSummaryValue()
  }

  /**
   * Check the current config property or runtime property changed in live view
   * @param prevProps previous property
   */
  componentDidUpdate = (prevProps) => {
    //check if summaryDisplayValue is changed
    if (prevProps.sumOfAreaOrLengthValue !== this.props.sumOfAreaOrLengthValue) {
      this.updateSummaryValue()
    }
  }

  /**
   * Update summary value and get the formatted expression value depending on the config values
   */
  updateSummaryValue = () => {
    if (this.props.useDataSource && this.props.summaryFieldInfos) {
      this.resolvedSummaryValues = []
      const formattedExp: string[] = []
      this.props.summaryFieldInfos.forEach((eachFieldInfo) => {
        let formattedExpression: string
        const expression: SumOfAreaLengthParam & Expression = eachFieldInfo.summaryFieldInfo
        if (Object.prototype.hasOwnProperty.call(eachFieldInfo.summaryFieldInfo, 'summaryBy')) {
          formattedExpression = this.props.sumOfAreaOrLengthValue?.toString()
          formattedExp.push(formattedExpression)
          this.resolvedSummaryValues.push(formattedExpression)
          if (this.props.summaryFieldInfos.length === 1) {
            this.onTextExpResolveChange({})
          }
        } else {
          formattedExpression = this.getExpressionString(expression)
          formattedExp.push(formattedExpression)
        }
      })
      this.setState({
        formattedExpression: formattedExp.join('')
      })
    }
  }

  /**
   * get the formatted expression string value
   * @param expression configured expression
   * @returns formatted expression
   */
  getExpressionString = (expression: Expression): string => {
    try {
      let string = JSON.stringify(expression)
      string = encodeURIComponent(string)

      const { parts } = expression
      let functionDsid = ''
      let multiExpDom = ''

      parts?.forEach(part => {
        const { dataSourceId: dsid } = part
        if (dsid) functionDsid = dsid
        if (functionDsid !== '') return false
      })

      const uniqueid = coreUtils.getUUID()
      this.resolvedSummaryValues.push(uniqueid)
      const expDom = document && document.createElement('exp')
      expDom.setAttribute('data-uniqueid', uniqueid)
      expDom.setAttribute('data-dsid', functionDsid)
      expDom.setAttribute('data-expression', string)
      expDom.innerHTML = expression.name
      multiExpDom += expDom.outerHTML
      return multiExpDom
    } catch (error) {
      console.error(error)
      return ''
    }
  }

  /**
   * On expression resolve create the summary field cards to be displayed in widget panel
   * @param resultObj expression result obj
   */
  onTextExpResolveChange = (resultObj) => {
    const resolvedSummaryValues = {}
    const fieldCards: JSX.Element[] = []
    this.resolvedSummaryValues.forEach((key, index) => {
      let result = key
      if (resultObj[key]?.isSuccessful) {
        result = resultObj[key].value
      }
      if (result !== undefined) {
        const summaryField = this.props.summaryFieldInfos[index]
        //create attributes for output ds
        resolvedSummaryValues[summaryField.fieldLabel.replace(/ /g, '')] = result
        //create summary card to be displayed in widget panel
        fieldCards.push(<SummaryFieldCard
          widgetId={this.props.widgetId}
          theme={this.props.theme}
          fieldLabel={summaryField.fieldLabel}
          fieldColor={utils.getColorValue(this.props.singleFieldColor ? this.props.singleFieldColor : summaryField.fieldColor)}
          summaryDisplayValue={result}
          key={index}
        ></SummaryFieldCard>)
      }
    })
    this.setState({ summaryFieldCards: fieldCards })
    this.props.onSummaryFieldsResolved(resolvedSummaryValues)
  }

  render () {
    const recordInfo = {}
    recordInfo[this.props.useDataSource.dataSourceId] = this.props.records
    return (
      <React.Fragment>
        {this.props.useDataSource && this.state.formattedExpression &&
          <React.Fragment>
            {this.state.summaryFieldCards.length === 0 &&
              <ExpressionResolverComponent useDataSources={Immutable([this.props.useDataSource]) as any}
                expression={richTextUtils.getAllExpressions(this.state.formattedExpression)}
                records={recordInfo}
                onChange={this.onTextExpResolveChange} widgetId={this.props.widgetId}
              />
            }
            {
              this.state.summaryFieldCards
            }
          </React.Fragment>
        }
      </React.Fragment>
    )
  }
}
