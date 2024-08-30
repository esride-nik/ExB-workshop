/** @jsx jsx */ // <-- make sure to include the jsx pragma
import { React, jsx, type IntlShape, type IMThemeVariables, urlUtils, defaultMessages as jimuCoreDefaultMessages, type DataSource, type UseDataSource } from 'jimu-core'
import { Button, CollapsablePanel, Tooltip, Label, Alert, Checkbox } from 'jimu-ui'
import { SettingRow, SidePopper } from 'jimu-ui/advanced/setting-components'
import { MapViewManager } from 'jimu-arcgis'
import { getAnalysisSettingStyle, getSidePanelStyle } from '../lib/style'
import defaultMessages from '../translations/default'
import { type AnalysisSettings, type CurrentLayer, type LayersInfo, type DataSourceOptions, AnalysisTypeName, type SearchSettings, type ProximityAnalysis, type ClosestAnalysis } from '../../config'
import { analysisType, defaultAnalysis } from '../constants'
import LayersInfos from '../components/layers-info'
import EditAnalysisPopper from '../components/edit-analysis-popper'
import { getDisplayField, getSelectedLayerInstance, getUniqueAnalysisId } from '../../common/utils'
import { InfoOutlined } from 'jimu-icons/outlined/suggested/info'
import SidepopperBackArrow from './sidepopper-back-arrow'

interface Props {
  widgetId: string
  intl: IntlShape
  theme: IMThemeVariables
  activeDsSearchConfig: SearchSettings
  activeDsLayersConfig: AnalysisSettings
  allFeatureLayers: DataSourceOptions[]
  selectedDs: string
  useDataSourceConfig: UseDataSource[]
  onAnalysisSettingsUpdated: (prop: string, value: string | boolean | LayersInfo[]) => void
  getAddedLayersInfoUseDs: (eachLayersUseDs: UseDataSource[]) => void
}

interface State {
  showEditAnalysisPopper: boolean
  newAddedLayerAnalysis: LayersInfo[]
  updatedAddedLayerAnalysis: LayersInfo[]
  displayFeatureCount: boolean
  showDistFromInputLocation: boolean
  displayAnalysisIcon: boolean
  layersAnalysisType: string
  analysisIndex: number
  editCurrentLayer: CurrentLayer
  selectedLayerGeometryType: string
  popperFocusNode: HTMLElement
  disableSidePopperOkButton: boolean
  displayMapSymbols: boolean
  isResultSettingsOpen: boolean
  showLayersResultOption: boolean
}

let collectionLayersInfos = []

export default class AnalysisSetting extends React.PureComponent<Props, State> {
  analysisLayersPopperTrigger = React.createRef<HTMLDivElement>()
  backRef = React.createRef<SidepopperBackArrow>()
  readonly mvManager: MapViewManager = MapViewManager.getInstance()
  public allDsLayers: DataSource[] = []
  useDataSources: UseDataSource[]
  isAnalysisEdited: boolean
  constructor (props) {
    super(props)
    if (this.props.activeDsLayersConfig) {
      this.state = {
        showEditAnalysisPopper: false,
        newAddedLayerAnalysis: this.props.activeDsLayersConfig?.layersInfo?.length > 0 ? this.props.activeDsLayersConfig?.layersInfo : [],
        updatedAddedLayerAnalysis: this.props.activeDsLayersConfig?.layersInfo?.length > 0 ? this.props.activeDsLayersConfig?.layersInfo : [],
        displayFeatureCount: this.props.activeDsLayersConfig.displayFeatureCount,
        showDistFromInputLocation: this.props.activeDsLayersConfig.showDistFromInputLocation,
        displayAnalysisIcon: this.props.activeDsLayersConfig.displayAnalysisIcon,
        layersAnalysisType: '',
        analysisIndex: null,
        editCurrentLayer: { layerDsId: '', analysisType: '' },
        selectedLayerGeometryType: '',
        popperFocusNode: null,
        disableSidePopperOkButton: false,
        displayMapSymbols: this.props.activeDsLayersConfig.displayMapSymbols,
        isResultSettingsOpen: false,
        showLayersResultOption: this.props.activeDsLayersConfig.onlyShowLayersResult
      }
    }
    this.useDataSources = this.props.useDataSourceConfig
    this.isAnalysisEdited = false
  }

  nls = (id: string) => {
    const messages = Object.assign({}, defaultMessages, jimuCoreDefaultMessages)
    //for unit testing no need to mock intl we can directly use default en msg
    if (this.props.intl && this.props.intl.formatMessage) {
      return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] })
    } else {
      return messages[id]
    }
  }

  /**
   * Add all the added layers on mount of the component
   */
  componentDidMount = () => {
    collectionLayersInfos = this.collectionOfLayerInfos()
    const layerInfos = []// initial analysis layer delete
    if (this.props.activeDsLayersConfig?.layersInfo.length > 0) {
      this.props.activeDsLayersConfig?.layersInfo.map((result) => {
        layerInfos.push(result)
        return true
      })
      this.setState({
        newAddedLayerAnalysis: layerInfos
      })
    }
  }

  /**
   * Update the config as per the config changes
   * @param prevProps previous props of the config
   */
  componentDidUpdate = (prevProps) => {
    //check if search by active map area props changes in live view
    if (prevProps.activeDsSearchConfig.searchByActiveMapArea !== this.props.activeDsSearchConfig.searchByActiveMapArea) {
      collectionLayersInfos = this.collectionOfLayerInfos()
    }
  }

  /**
    * Update only show layer result property
    * @param evt only show results options event
    */
  onlyShowResultsOptionChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      showLayersResultOption: evt.target.checked
    }, () => {
      this.props.onAnalysisSettingsUpdated('onlyShowLayersResult', this.state.showLayersResultOption)
    })
  }

  /**
   * Toggle results on click of collapsible to expand or collapse the panel
   */
  onToggleResults = () => {
    this.setState({
      isResultSettingsOpen: !this.state.isResultSettingsOpen
    })
  }

  /**
   * Update the display feature count property
   * @param evt display feature count event
   */
  displayFeatureCountStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      displayFeatureCount: evt.target.checked
    }, () => {
      this.props.onAnalysisSettingsUpdated('displayFeatureCount', this.state.displayFeatureCount)
    })
  }

  /**
   * Update show distance from input location property
   * @param evt show distance from input location change event
   */
  onShowDistFromInputLocToolsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      showDistFromInputLocation: evt.target.checked
    }, () => {
      this.props.onAnalysisSettingsUpdated('showDistFromInputLocation', this.state.showDistFromInputLocation)
    })
  }

  /**
   * Update the display analysis icon property
   * @param evt display analysis icon change event
   */
  displayAnalysisIconStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      displayAnalysisIcon: evt.target.checked
    }, () => {
      this.props.onAnalysisSettingsUpdated('displayAnalysisIcon', this.state.displayAnalysisIcon)
    })
  }

  /**
   * Update the show map symbols property
   * @param evt display map symbol change event
   */
  displayMapSymbolsStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      displayMapSymbols: evt.target.checked
    }, () => {
      this.props.onAnalysisSettingsUpdated('displayMapSymbols', this.state.displayMapSymbols)
    })
  }

  /**
   * Create the collection of combinations of different layers with closest, proximity and summary analysis types
   * @returns combination of analysis type and configured feature layer
   */
  collectionOfLayerInfos = () => {
    const combinations = []
    //create combinations of different layers with 3 analysis types
    this.props.allFeatureLayers.forEach((layersConfig, index) => {
      if (layersConfig.value === this.props.selectedDs) {
        const allLayersIds = layersConfig.availableLayers
        allLayersIds.forEach((layer) => {
          const individualLayer: any = layer
          const getLayersInstance = getSelectedLayerInstance(individualLayer.layerDsId)
          this.allDsLayers.push(getLayersInstance)
        })
      }
    })
    for (let i = 0; i < this.allDsLayers.length; i++) {
      for (let j = 0; j < analysisType.length; j++) {
        if (!(this.props.activeDsSearchConfig.searchByActiveMapArea && analysisType[j] === AnalysisTypeName.Closest)) {
          combinations.push({
            analysisType: analysisType[j],
            featureLayer: this.allDsLayers[i]
          })
        }
      }
    }
    return combinations
  }

  /**
   * On add analysis click the analysis layers gets added with the respective types
   * eg. Closest, Proximity, Summary
  */
  onAddAnalysisClick = () => {
    if (this.props.activeDsLayersConfig?.layersInfo.length > 0) {
      const indexes = []
      //checks whether the layers and analysis type combinations matches with the configured analysis
      for (let i = 0; i < collectionLayersInfos.length; i++) {
        for (let j = 0; j < this.state.newAddedLayerAnalysis.length; j++) {
          if (collectionLayersInfos[i].analysisType === this.state.newAddedLayerAnalysis[j].analysisInfo.analysisType &&
            collectionLayersInfos[i].featureLayer.id === this.state.newAddedLayerAnalysis[j].useDataSource.dataSourceId) {
            indexes.push(i)
          }
        }
      }
      const unmatchedIndex = []
      collectionLayersInfos.forEach((result, index) => {
        if (!indexes.includes(index)) {
          unmatchedIndex.push(index)
        }
      })
      const createUseDs: UseDataSource = {
        dataSourceId: collectionLayersInfos[unmatchedIndex?.[0]]?.featureLayer?.id,
        mainDataSourceId: collectionLayersInfos[unmatchedIndex?.[0]]?.featureLayer?.id,
        rootDataSourceId: this.props.selectedDs
      }
      // Adds the analysis layer-wise and each layer with 3 different analysis types
      if (unmatchedIndex.length > 0) {
        const analysis: any = defaultAnalysis.find(result => result.analysisType === collectionLayersInfos[unmatchedIndex[0]].analysisType)
        const layerObj = getSelectedLayerInstance(collectionLayersInfos[unmatchedIndex[0]].featureLayer.id) as any
        const newAnalysis: LayersInfo = {
          useDataSource: createUseDs,
          label: layerObj?.getLabel(),
          analysisInfo: analysis
        }
        const analysisInfo: any = newAnalysis.analysisInfo
        analysisInfo.analysisId = getUniqueAnalysisId()
        if (collectionLayersInfos[unmatchedIndex[0]].analysisType === AnalysisTypeName.Proximity) {
          analysisInfo.displayField = getDisplayField(layerObj?.layerDefinition)
        }
        newAnalysis.analysisInfo = analysisInfo
        this.setState({
          newAddedLayerAnalysis: [...this.state.newAddedLayerAnalysis, newAnalysis],
          analysisIndex: this.state.newAddedLayerAnalysis.length,
          editCurrentLayer: { layerDsId: collectionLayersInfos[unmatchedIndex[0]].featureLayer.id, analysisType: collectionLayersInfos[unmatchedIndex[0]].analysisType },
          selectedLayerGeometryType: layerObj?.layerDefinition?.geometryType
        })
        this.setState({
          showEditAnalysisPopper: true
        })
      } else { //if all the layers with analysis types are added then add the closest/ proximity default analysis type again
        //depending on searchByActiveMapArea parameter
        this.displayDefaultClosestOrProximity(collectionLayersInfos, true)
      }
    } else { //if any analysis not configured then load the layer with closest/ proximity analysis type
      //depending on searchByActiveMapArea parameter
      this.displayDefaultClosestOrProximity(collectionLayersInfos, false)
    }
  }

  /**
  * Display the closest or proximity analysis type layer info
  * @param collectionLayersInfos Feature layer instance
  * @param isAdded Check if the layer is added
  */
  displayDefaultClosestOrProximity = (collectionLayersInfos, isAdded: boolean) => {
    const defaultUseDs: UseDataSource = {
      dataSourceId: collectionLayersInfos[0].featureLayer.id,
      mainDataSourceId: collectionLayersInfos[0].featureLayer.id,
      rootDataSourceId: this.props.selectedDs
    }

    const layerObj = getSelectedLayerInstance(collectionLayersInfos[0].featureLayer.id)
    const newAnalysis: LayersInfo = {
      useDataSource: defaultUseDs,
      label: layerObj?.getLabel(),
      analysisInfo: this.props.activeDsSearchConfig.searchByActiveMapArea ? defaultAnalysis[1] as ProximityAnalysis : defaultAnalysis[0] as ClosestAnalysis
    }
    const analysisInfo = newAnalysis.analysisInfo
    analysisInfo.analysisId = getUniqueAnalysisId()
    newAnalysis.analysisInfo = analysisInfo
    this.setState({
      newAddedLayerAnalysis: isAdded ? [...this.state.newAddedLayerAnalysis, newAnalysis] : [newAnalysis],
      analysisIndex: this.state.newAddedLayerAnalysis.length,
      editCurrentLayer: { layerDsId: collectionLayersInfos[0].featureLayer.id, analysisType: collectionLayersInfos[0].analysisType },
      showEditAnalysisPopper: true
    })
  }

  /**
   * Close the edit analysis side popper
   */
  closeEditAnalysisPopper = () => {
    this.setSidePopperAnchor(this.state.analysisIndex)
    const configuredLayersInfo: any = this.props.activeDsLayersConfig?.layersInfo
    this.setState({
      newAddedLayerAnalysis: this.props.activeDsLayersConfig?.layersInfo?.length > 0 ? configuredLayersInfo.asMutable() : [],
      showEditAnalysisPopper: false,
      analysisIndex: null,
      editCurrentLayer: { layerDsId: '', analysisType: '' }
    }, () => {
      this.props.onAnalysisSettingsUpdated('layersInfo', this.state.newAddedLayerAnalysis)
    })
  }

  /**
   * Update the config when analysis added or edited on OK button clicked
   */
  editOkButtonCLick = () => {
    this.setState({
      showEditAnalysisPopper: false,
      newAddedLayerAnalysis: this.isAnalysisEdited ? this.state.updatedAddedLayerAnalysis : this.state.newAddedLayerAnalysis
    }, () => {
      this.props.onAnalysisSettingsUpdated('layersInfo', this.state.newAddedLayerAnalysis)
      let tempUseDataSources = []
      this.state.newAddedLayerAnalysis.forEach((layer) => {
        tempUseDataSources = Object.assign(tempUseDataSources, this.useDataSources)
        tempUseDataSources.push(layer.useDataSource)
      })
      this.useDataSources = tempUseDataSources
      setTimeout(() => {
        this.props.getAddedLayersInfoUseDs(this.useDataSources)
      }, 100)
    })
    this.isAnalysisEdited = false
  }

  /**
  * On click opens the Edit side popper of the respective analysis layers settings
  * @param isOpen Check if analysis layer is in editing mode
  * @param layerDsId Specifies layer Ds id
  * @param analysisType Analysis type of respective layer
  * @param analysisIndex Edit analysis layer index
  */
  onEditButtonClick = (isOpen: boolean, layerDsId: string, analysisType: string, analysisIndex: number) => {
    this.setSidePopperAnchor(analysisIndex)
    this.setState({
      showEditAnalysisPopper: isOpen,
      analysisIndex: analysisIndex,
      editCurrentLayer: { layerDsId: layerDsId, analysisType: analysisType }
    })
  }

  /**
   * set side popper anchor
   * @param index index of the analysis
   */
  setSidePopperAnchor = (index?: number) => {
    const node: any = this.analysisLayersPopperTrigger.current?.getElementsByClassName('jimu-tree-item__body')[index]
    this.setState({
      popperFocusNode: node
    })
  }

  /**
   * On click deletes the respective layers shell and layers settings
   * @param addedLayerAnalysis Layer info that to be deleted
   * @param layerDsId Specifies layer Ds id
   * @param analysisType Analysis type of respective layer
   * @param index Delete analysis layer index
   */
  onDeleteButtonClick = (addedLayerAnalysis, layerDsId: string, analysisType: string, index: number) => {
    this.setState({
      newAddedLayerAnalysis: addedLayerAnalysis,
      analysisIndex: index
    }, () => {
      this.props.onAnalysisSettingsUpdated('layersInfo', addedLayerAnalysis)
      setTimeout(() => {
        this.props.getAddedLayersInfoUseDs(this.useDataSources)
      }, 100)
      if (this.state.analysisIndex === -1 && this.state.editCurrentLayer.layerDsId === layerDsId && this.state.editCurrentLayer.analysisType === analysisType) {
        this.setSidePopperAnchor(this.state.analysisIndex)
        this.setState({
          showEditAnalysisPopper: false,
          analysisIndex: null,
          editCurrentLayer: { layerDsId: '', analysisType: '' }
        }, () => {
          this.props.onAnalysisSettingsUpdated('layersInfo', this.state.newAddedLayerAnalysis)
        })
      }
    })
  }

  /**
   * On layer info settings update, update the config
   * @param updatedAnalysis Update layers info
   * @param analysisIndex Index of updated layer
   * @param layerDsId Specifies layer Ds id
   * @param analysisType Analysis type of respective layer
   */

  updateLayersInfoSettings = (updatedAnalysis, analysisIndex: number, layerDsId: string, analysisType: string) => {
    this.setState({
      newAddedLayerAnalysis: updatedAnalysis,
      analysisIndex: analysisIndex,
      editCurrentLayer: { layerDsId: layerDsId, analysisType: analysisType }
    }, () => {
      this.props.onAnalysisSettingsUpdated('layersInfo', updatedAnalysis)
    })
  }

  /**
   * On parameter update of analysis info
   * @param analysisListSettings Layer analysis list
   * @param layerDsId Specifies layer Ds id
   * @param analysisType Analysis type of respective layer
   * @param idx Index of updated layer
   */

  onAnalysisInfoUpdate = (analysisListSettings: LayersInfo[], layerDsId: string, analysisType: string, idx: number) => {
    this.isAnalysisEdited = true
    this.setState({
      updatedAddedLayerAnalysis: analysisListSettings,
      analysisIndex: idx,
      editCurrentLayer: { layerDsId: layerDsId, analysisType: analysisType }
    })
  }

  /**
   * Disable the OK button when search by active map area is enabled and closest analysis is configured
   * @param disable Disable only in case of closest analysis
   */
  onDisableOkButton = (disable: boolean) => {
    this.setState({
      disableSidePopperOkButton: disable
    })
  }

  render () {
    return (
      <div css={getAnalysisSettingStyle(this.props.theme, this.props.activeDsSearchConfig.searchByActiveMapArea)} style={{ height: '100%', width: '100%' }}>

        <SettingRow>
          <Button role={'button'} className={'w-100 text-dark'} type={'primary'} onClick={this.onAddAnalysisClick.bind(this)} >
            {this.nls('addAnalysisLabel')}
          </Button>
        </SettingRow>

        {this.state.newAddedLayerAnalysis.length === 0 &&
          <SettingRow>
            <Alert tabIndex={0} withIcon={true} text={this.nls('noAnalysisConfiguredMsg')} type={'warning'} />
          </SettingRow>
        }

        {this.state.newAddedLayerAnalysis && this.state.newAddedLayerAnalysis.length > 0 &&
          <div ref={this.analysisLayersPopperTrigger} tabIndex={-1} className='w-100 mb-4 mt-2'>
            <LayersInfos
              intl={this.props.intl}
              theme={this.props.theme}
              addedLayerAnalysis={this.state.newAddedLayerAnalysis}
              showEditAnalysisPopper={this.state.showEditAnalysisPopper}
              analysisIndex={this.state.analysisIndex}
              editCurrentLayer={this.state.editCurrentLayer}
              onEditAction={this.onEditButtonClick}
              onDeleteAction={this.onDeleteButtonClick.bind(this)}
              onLayersInfoSettingsUpdated={this.updateLayersInfoSettings}
              isActiveMapAreaSelected={this.props.activeDsSearchConfig.searchByActiveMapArea}/>
          </div>
        }

        <SettingRow className='border-top pt-3'>
          <CollapsablePanel
            label={this.nls('resultsCollapsible')}
            isOpen={this.state.isResultSettingsOpen}
            onRequestOpen={() => { this.onToggleResults() }}
            onRequestClose={() => { this.onToggleResults() }}>
            <div style={{ height: '100%', marginTop: 10 }}>

              <SettingRow className={'ml-2'}>
                <Label check centric style={{ cursor: 'pointer' }}>
                  <Checkbox role={'checkbox'} aria-label={this.nls('displayFeatureCountLabel')}
                    style={{ cursor: 'pointer' }} className='mr-2' checked={this.state.displayFeatureCount}
                    onChange={this.displayFeatureCountStateChange.bind(this)}
                  />
                  {this.nls('displayFeatureCountLabel')}
                </Label>
              </SettingRow>

              <SettingRow className={'ml-2'}>
                <Label check centric style={{ cursor: 'pointer' }}>
                  <Checkbox role={'checkbox'} aria-label={this.nls('displayAnalysisIconLabel')}
                    style={{ cursor: 'pointer' }} className='mr-2' checked={this.state.displayAnalysisIcon}
                    onChange={this.displayAnalysisIconStateChange.bind(this)}
                  />
                  {this.nls('displayAnalysisIconLabel')}
                </Label>
              </SettingRow>

              <SettingRow className={'ml-2'}>
                <Label check centric style={{ cursor: 'pointer' }}>
                  <Checkbox role={'checkbox'} aria-label={this.nls('mapSymbolsLabel')}
                    style={{ cursor: 'pointer' }} className='mr-2' checked={this.state.displayMapSymbols}
                    onChange={this.displayMapSymbolsStateChange.bind(this)}
                  />
                  {this.nls('mapSymbolsLabel')}
                </Label>
              </SettingRow>

              {!this.props.activeDsSearchConfig.searchByActiveMapArea &&
                <SettingRow className={'ml-2'}>
                  <Label check centric style={{ cursor: 'pointer' }}>
                    <Checkbox role={'checkbox'} aria-label={this.nls('showDistFromInputLoc')}
                      style={{ cursor: 'pointer' }} className='mr-2' checked={this.state.showDistFromInputLocation}
                      onChange={this.onShowDistFromInputLocToolsChange.bind(this)}
                    />
                    {this.nls('showDistFromInputLoc')}
                  </Label>
                </SettingRow>}

              {!this.props.activeDsSearchConfig.searchByActiveMapArea &&
                <SettingRow className={'ml-2'}>
                  <Label check centric style={{ cursor: 'pointer' }}>
                    <Checkbox role={'checkbox'} aria-label={this.nls('onlyShowResults')}
                      style={{ cursor: 'pointer' }} className='mr-2' checked={this.state.showLayersResultOption}
                      onChange={this.onlyShowResultsOptionChange.bind(this)}
                    />
                    {this.nls('onlyShowResults')}
                  </Label>
                  <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('onlyShowResults') + ' ' + this.nls('onlyShowResultsTooltip')}
                    title={this.nls('onlyShowResultsTooltip')} showArrow placement='top'>
                    <div className='setting-text-level-2 mr-2 d-inline'>
                      <InfoOutlined />
                    </div>
                  </Tooltip>
                </SettingRow>}
            </div>
          </CollapsablePanel>
        </SettingRow>

        {
          <SidePopper isOpen={this.state.showEditAnalysisPopper && !urlUtils.getAppIdPageIdFromUrl().pageId}
            position={'right'}
            toggle={this.closeEditAnalysisPopper.bind(this)}
            trigger={this.analysisLayersPopperTrigger?.current}
            backToFocusNode={this.state.popperFocusNode}>
            <div className='bg-light-300 border-color-gray-400' css={getSidePanelStyle(this.props.theme)}>
              <SidepopperBackArrow
                theme={this.props.theme}
                intl={this.props.intl}
                title={this.nls('editAnalysis')}
                ref={this.backRef}
                hideBackArrow={true}
                showCloseIcon={true}
                disableOkButton={this.state.disableSidePopperOkButton}
                onBack={this.closeEditAnalysisPopper}
                showOkButton
                onOkButtonClicked={this.editOkButtonCLick}>
                <EditAnalysisPopper
                  widgetId={this.props.widgetId}
                  intl={this.props.intl}
                  theme={this.props.theme}
                  isActiveMapAreaSelected={this.props.activeDsSearchConfig.searchByActiveMapArea}
                  activeDs={this.props.selectedDs}
                  analysisIndex={this.state.analysisIndex}
                  availableFeatureLayer={this.allDsLayers}
                  editCurrentLayer={this.state.editCurrentLayer}
                  analysisList={this.state.newAddedLayerAnalysis}
                  selectedLayerGeometry={this.state.selectedLayerGeometryType}
                  onAnalysisUpdate={this.onAnalysisInfoUpdate}
                  disableOkButton={this.onDisableOkButton}
                />
              </SidepopperBackArrow>
            </div>
          </SidePopper>
        }

      </div>
    )
  }
}
