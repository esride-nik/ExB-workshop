/** @jsx jsx */ // <-- make sure to include the jsx pragma
import { React, jsx, type IntlShape, classNames, type IMThemeVariables } from 'jimu-core'
import defaultMessages from '../translations/default'
import { type CurrentLayer, type LayersInfo, AnalysisTypeName } from '../../config'
import { CloseOutlined } from 'jimu-icons/outlined/editor/close'
import { List, TreeItemActionType, type TreeItemsType, type TreeItemType } from 'jimu-ui/basic/list-tree'
import { Button, Tooltip } from 'jimu-ui'
import { WarningOutlined } from 'jimu-icons/outlined/suggested/warning'

interface Props {
  intl: IntlShape
  theme: IMThemeVariables
  addedLayerAnalysis: LayersInfo[]
  analysisIndex: number
  showEditAnalysisPopper: boolean
  editCurrentLayer: CurrentLayer
  isActiveMapAreaSelected: boolean
  onEditAction: (isOpen: boolean, layerDsId: string, analysisType: string, analysisIndex: number) => void
  onDeleteAction: (addedLayerAnalysis, layerDsId: string, analysisType: string, index: number) => void
  onLayersInfoSettingsUpdated: (prop: LayersInfo[], analysisIndex: number, layerDsId: string, analysisType: string) => void
}

interface State {
  selectedAnalysis: number
  addedLayerAnalysis: LayersInfo[]
}

export default class LayersInfos extends React.PureComponent<Props, State> {
  analysisSettingPopperTrigger = React.createRef<HTMLDivElement>()
  constructor (props) {
    super(props)
    this.state = {
      selectedAnalysis: this.props.analysisIndex ? this.props.analysisIndex : -1,
      addedLayerAnalysis: this.props.addedLayerAnalysis
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

  componentDidMount = () => {
    if (this.state.addedLayerAnalysis.length === 1) {
      this.setState({
        selectedAnalysis: (this.props.addedLayerAnalysis.length - 1)
      })
    }
  }

  /**
   * Update the config as per the config changes
   * @param prevProps previous props of the config
   */
  componentDidUpdate = (prevProps) => {
    if (prevProps?.addedLayerAnalysis?.length !== this.props?.addedLayerAnalysis?.length) {
      this.setState({
        addedLayerAnalysis: this.props.addedLayerAnalysis,
        selectedAnalysis: (this.props.addedLayerAnalysis.length - 1) // highlight the layers shell when new analysis is added
      })
    }
    if (prevProps?.addedLayerAnalysis !== this.props?.addedLayerAnalysis) {
      this.setState({
        addedLayerAnalysis: this.props.addedLayerAnalysis
      })
    }
  }

  /**
   * On analysis order change, analysis settings re-arranges with the current sorted order
   * @param newSortedAnalysis new sorted analysis
   */
  onAnalysisOrderChanged = (newSortedAnalysis) => {
    let activeEditIdx = -1
    if (this.props.editCurrentLayer) {
      activeEditIdx = newSortedAnalysis.findIndex((result) => result?.useDataSource?.dataSourceId === this.props.editCurrentLayer.layerDsId &&
        result.analysisInfo.analysisType === this.props.editCurrentLayer.analysisType)
      this.setState({ selectedAnalysis: activeEditIdx })
    }
    this.setState({
      addedLayerAnalysis: newSortedAnalysis
    }, () => {
      this.props.onLayersInfoSettingsUpdated(this.state.addedLayerAnalysis, this.props.analysisIndex, this.props.editCurrentLayer.layerDsId, this.props.editCurrentLayer.analysisType)
    })
  }

  /**
  * On edit button click opens the Edit analysis popper and highlights the analysis which is in editing
  * @param layerDsId Specifies layer Ds id
  * @param analysisType Edit layer analysis type
  * @param analysisIndex Edit layer index
  */
  onEditAction = (layerDsId: string, analysisType: string, analysisIndex: number) => {
    this.props.onEditAction(true, layerDsId, analysisType, analysisIndex)
    this.state.addedLayerAnalysis.some((layer, index) => {
      if (analysisIndex === index) {
        this.setState({ selectedAnalysis: analysisIndex })
        return true
      }
      return false
    })
  }

  /**
   * On deleting the analysis, respective analysis will be removed and analysis settings list will get updated
   * @param e Event for the removed layer
   * @param layerDsId Specifies layer Ds id
   * @param analysisType Edit layer analysis type
   * @param analysisIndex Edit layer index
   */
  onRemoveAction = (e, layerDsId: string, analysisType: string, index: number) => {
    e.stopPropagation()
    const addedLayerAnalysis: LayersInfo[] = this.state.addedLayerAnalysis
    addedLayerAnalysis.splice(index, 1)

    let activeEditIdx = -1
    if (this.props.editCurrentLayer) {
      activeEditIdx = addedLayerAnalysis.findIndex((result) => result.useDataSource.dataSourceId === this.props.editCurrentLayer.layerDsId && result.analysisInfo.analysisType === this.props.editCurrentLayer.analysisType)
      this.setState({ selectedAnalysis: activeEditIdx })
    }

    this.setState({
      addedLayerAnalysis: addedLayerAnalysis
    }, () => {
      this.props.onDeleteAction(this.state.addedLayerAnalysis, layerDsId, analysisType, activeEditIdx)
    })
  }

  /**
  * Creates the analysis items contains analysis layer label, delete button, analysis type label
  * @param analysis Layer analysis
  * @param index Each layers index
  * @returns Returns the layer item
  */
  createAnalysisItem = (analysis, index: number) => {
    const layerItem = (
      <div className={classNames('flex-grow-1 analysis-item cursor-pointer')} key={index}>
        <div className='d-flex w-100 justify-content-between align-items-center'>
          {<div className='layer-analysis-name text-truncate' title={analysis.label}>
            {analysis.label}
          </div>}
          {this.props.isActiveMapAreaSelected && analysis.analysisInfo.analysisType === AnalysisTypeName.Closest &&
            <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('warningMsgIfActiveMapArea')}
              title={this.nls('warningMsgIfActiveMapArea')} showArrow placement='top'>
              <div className='setting-text-level-2 d-inline'>
                <WarningOutlined color='var(--warning-700)' />
              </div>
            </Tooltip>
          }
          <Button role={'button'} aria-label={this.nls('deleteOption')} title={this.nls('deleteOption')} type='tertiary' size='sm' icon
            onClick={(e) => { this.onRemoveAction(e, analysis.useDataSource.dataSourceId, analysis.analysisInfo.analysisType, index) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                this.onRemoveAction(e, analysis.useDataSource.dataSourceId, analysis.analysisInfo.analysisType, index)
              }
            }}>
            <CloseOutlined size='s' className='p-0' />
          </Button>
        </div>

        <div className='text-dark-600 d-flex align-items-center analysis-type-name'>
          <div className='w-100 text-truncate' title={this.nls(analysis?.analysisInfo?.analysisType)}>{this.nls(analysis?.analysisInfo?.analysisType)}</div>
        </div>
      </div>
    )
    return layerItem
  }

  /**
   * Create the analysis list when user adds the analysis
   */
  getLayersInfoList = () => {
    return (
      <div className={'nearme-analysis-list-items'}>
        <List
          itemsJson={Array.from(this.state.addedLayerAnalysis ? this.state.addedLayerAnalysis : null)?.map((field, index) => ({
            itemStateDetailContent: field,
            itemKey: `${index}`,
            itemStateChecked: this.props.showEditAnalysisPopper && this.state.selectedAnalysis === index
          }))}
          dndEnabled
          onUpdateItem={(actionData, refComponent) => {
            const { itemJsons } = refComponent.props
            const [, parentItemJson] = itemJsons as [TreeItemType, TreeItemsType]
            const newSortedAnalysis = parentItemJson.map(item => {
              return item.itemStateDetailContent
            })
            this.onAnalysisOrderChanged(newSortedAnalysis)
          }}
          onClickItemBody={(actionData, refComponent) => {
            const { itemJsons } = refComponent.props
            const currentItemJson = itemJsons[0]
            const listItemJsons = itemJsons[1] as any
            const analysis = currentItemJson.itemStateDetailContent
            this.onEditAction(analysis?.useDataSource?.dataSourceId, analysis.analysisInfo.analysisType, listItemJsons.indexOf(currentItemJson))
          }}
          overrideItemBlockInfo={({ itemBlockInfo }) => {
            return {
              name: TreeItemActionType.RenderOverrideItem,
              children: [{
                name: TreeItemActionType.RenderOverrideItemDroppableContainer,
                children: [{
                  name: TreeItemActionType.RenderOverrideItemDraggableContainer,
                  children: [{
                    name: TreeItemActionType.RenderOverrideItemBody,
                    children: [{
                      name: TreeItemActionType.RenderOverrideItemDragHandle
                    }, {
                      name: TreeItemActionType.RenderOverrideItemMainLine
                    }]
                  }]
                }]
              }]
            }
          }}
          renderOverrideItemMainLine={(actionData, refComponent) => {
            const { itemJsons } = refComponent.props
            const currentItemJson = itemJsons[0]
            const listItemJsons = itemJsons[1] as any
            return this.createAnalysisItem(currentItemJson.itemStateDetailContent, listItemJsons.indexOf(currentItemJson))
          }}
        />
      </div>
    )
  }

  render () {
    return (
      <React.Fragment>
        { this.getLayersInfoList() }
      </React.Fragment>
    )
  }
}
