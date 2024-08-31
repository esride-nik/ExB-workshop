/**@jsx jsx */
import { React, jsx, type IntlShape, type IMThemeVariables, Immutable, JimuFieldType, type Expression, type UseDataSource } from 'jimu-core'
import defaultMessages from '../translations/default'
import { ExpressionBuilder, ExpressionBuilderType } from 'jimu-ui/advanced/expression-builder'
import { type CurrentLayer, type SelectedExpressionInfo, type SummaryExpressionFieldInfo, type SummaryFieldsInfo } from '../../config'
import { getSelectedLayerInstance } from '../../common/utils'
import { getExpressionBuilderPanelStyle } from '../lib/style'

interface Props {
  intl: IntlShape
  theme: IMThemeVariables
  widgetId: string
  currentLayerDsId: CurrentLayer
  fieldsEditIndex: number
  editingField: SummaryExpressionFieldInfo & SummaryFieldsInfo
  expressionInfoUpdate: (expressionInfo: SelectedExpressionInfo) => void
}

interface State {
  useDataSource: UseDataSource[]
  updatedFieldExpression: Expression
}

export default class SummaryFieldPopper extends React.PureComponent<Props, State> {
  constructor (props) {
    super(props)
    const currentLayer = getSelectedLayerInstance(this.props.currentLayerDsId.layerDsId)
    const createUseDataSource: UseDataSource[] = [{
      dataSourceId: currentLayer.id,
      mainDataSourceId: currentLayer.id,
      rootDataSourceId: currentLayer.parentDataSource.id
    }]
    this.state = {
      useDataSource: createUseDataSource,
      updatedFieldExpression: this.props.fieldsEditIndex !== null ? this.props.editingField.summaryFieldInfo : null
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
   * On summary expression added or update change the settings
   * @param exp entered expression
   * @returns returns if null expression
   */
  handleExpressionChange = (exp: Expression) => {
    if (exp == null) {
      return
    }
    //If Expression is configured then it returns the dataSource id with selection
    //our expression works only on default so use the dataSourceId from useDataSources
    exp.parts.forEach(part => {
      if (part.dataSourceId) {
        part.dataSourceId = this.state.useDataSource?.[0].dataSourceId
      }
    })
    this.setState({
      updatedFieldExpression: exp
    })
    this.updateSummaryField(exp.name, exp)
  }

  /**
   * Update the summary field values
   * @param fieldLabel Specifies the field lan=bel
   * @param exp Selected Expression
   */
  updateSummaryField = (fieldLabel: string, exp: Expression) => {
    const expressionInfo: SelectedExpressionInfo = {
      fieldLabel: fieldLabel,
      selectedExpression: exp
    }
    this.props.expressionInfoUpdate(expressionInfo)
  }

  render () {
    return (
        <ExpressionBuilder className='p-2' css={getExpressionBuilderPanelStyle(this.props.theme)}
          fieldTypes={Immutable([JimuFieldType.Number])}
          widgetId={this.props.widgetId}
          types={Immutable([ExpressionBuilderType.Statistics, ExpressionBuilderType.Expression])}
          useDataSources={Immutable([this.state.useDataSource?.[0]]) as any}
          expression={this.state.updatedFieldExpression}
          onChange={this.handleExpressionChange}
        />
    )
  }
}
