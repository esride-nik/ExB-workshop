/** @jsx jsx */ // <-- make sure to include the jsx pragma
import { React, jsx, type IntlShape, type IMThemeVariables, urlUtils, type IMFieldSchema, Immutable, OrderRule, type DataSource, type Expression, classNames, getAppStore, DataSourceManager, DataSourceTypes, ArcGISDataSourceTypes, type UseDataSource, lodash } from 'jimu-core'
import { Button, defaultMessages as jimuUIDefaultMessages, Icon, Switch, TextInput, Radio, Label, Tooltip, Checkbox, Alert } from 'jimu-ui'
import { SettingRow, SettingSection, SidePopper } from 'jimu-ui/advanced/setting-components'
import { type ColorMatches, type CurrentLayer, type LayerDsId, type LayersInfo, type SelectedExpressionInfo, type SelectedLayers, type SummaryExpressionFieldInfo, type SummaryFieldsInfo, AnalysisTypeName } from '../../config'
import defaultMessages from '../translations/default'
import {
  transparentColor, NumberFormatting, CommonSummaryFieldValue, colorsStrip1, ColorMode, defaultHighlightResultsColor
} from '../constants'
import { getAnalysisSettingStyle, getSidePanelStyle } from '../lib/style'
import { List, TreeItemActionType, type TreeItemsType, type TreeItemType } from 'jimu-ui/basic/list-tree'
import { CloseOutlined } from 'jimu-icons/outlined/editor/close'
import { EditOutlined } from 'jimu-icons/outlined/editor/edit'
import { SettingOutlined } from 'jimu-icons/outlined/application/setting'
import SidepopperBackArrow from './sidepopper-back-arrow'
import ColorSettingPopper from './color-setting-selector-popper'
import { InfoOutlined } from 'jimu-icons/outlined/suggested/info'
import { AllDataSourceTypes, DataSourceSelector, FieldSelector } from 'jimu-ui/advanced/data-source-selector'
import { SortAscendingOutlined } from 'jimu-icons/outlined/directional/sort-ascending'
import { SortDescendingOutlined } from 'jimu-icons/outlined/directional/sort-descending'
import { getSelectedLayerInstance, getDisplayField } from '../../common/utils'
import SummaryFieldPopper from './summary-field-popper'
import EditSummaryIntersectedFieldsPopper from './edit-summary-intersected-field-popper'
import { ThemeColorPicker } from 'jimu-ui/basic/color-picker'
import { getTheme2 } from 'jimu-theme'

const IconAdd = require('../assets/add.svg')
let summaryFieldsArr = []

interface Props {
  widgetId: string
  intl: IntlShape
  theme: IMThemeVariables
  isActiveMapAreaSelected: boolean
  activeDs: string
  analysisIndex: number
  availableFeatureLayer: DataSource[]
  editCurrentLayer: CurrentLayer
  analysisList: LayersInfo[]
  selectedLayerGeometry: string
  onAnalysisUpdate: (prop: LayersInfo[], layerDsId: string, analysisType: string, index: number) => void
  disableOkButton: (value: boolean) => void
}

interface State {
  closestAnalysisType: boolean
  proximityAnalysisType: boolean
  summaryAnalysisType: boolean
  analysisListSettings: LayersInfo[]
  selectedLayers: SelectedLayers[]
  useDataSource: UseDataSource
  layerLabel: string
  analysisType: string
  displayField: string[]
  sortFeaturesByDistance: boolean
  sortFeaturesField: string[]
  sortFeaturesFieldOrder: string
  selectedFieldsDataSource: LayerDsId[]
  isGroupFeatures: boolean
  groupFeaturesField: string[]
  groupFeaturesFieldOrder: string
  isSortGroupsByCount: boolean
  expandOnOpen: boolean
  editSummaryAreaLengthFieldPopupOpen: boolean
  sumOfArea: boolean
  sumOfAreaLabel: string
  sumOfLengthLabel: string
  sumOfLength: boolean
  selectedLayerGeometry: string
  summaryFieldsList: SummaryExpressionFieldInfo[]
  intersectedSummaryFieldList: SummaryFieldsInfo[]
  summaryEditIndex: number
  summaryEditField: SummaryExpressionFieldInfo & SummaryFieldsInfo
  expressionInfo: Expression
  sumOfIntersectedFieldPopupTitle: string
  isAddNewSummaryField: boolean
  isNewFieldAdded: boolean
  showSummaryColorSettings: boolean
  singleColorFields: string
  byCategoryColorFields: ColorMatches
  singleColorMode: boolean
  colorstripValues: string[]
  popperFocusNode: HTMLElement
  expandFeatureDetails: boolean
  highlightResultsOnMap: boolean
  highlightColorOnMap: string
}

export default class EditAnalysisPopper extends React.PureComponent<Props, State> {
  supportedDsTypes = Immutable([AllDataSourceTypes.FeatureLayer])
  items = []
  backRef = React.createRef<SidepopperBackArrow>()
  colorSidePopperTrigger = React.createRef<HTMLDivElement>()
  colorButtonRef = React.createRef<HTMLButtonElement>()
  addSummaryFieldsRef = React.createRef<HTMLDivElement>()
  summaryFieldsSidePopperTrigger = React.createRef<HTMLDivElement>()
  public setEditIndex: number
  updateSummaryFieldListSettings: SummaryFieldsInfo[]
  allSelectedLayers = []
  private readonly defaultSelectedItem = {
    name: ''
  }

  constructor (props) {
    super(props)
    this.state = {
      closestAnalysisType: false,
      proximityAnalysisType: false,
      summaryAnalysisType: false,
      analysisListSettings: this.props.analysisList || [],
      selectedLayers: [],
      useDataSource: null,
      layerLabel: '',
      analysisType: '',
      displayField: [],
      sortFeaturesByDistance: true,
      sortFeaturesField: [],
      sortFeaturesFieldOrder: OrderRule.Asc,
      selectedFieldsDataSource: [],
      isGroupFeatures: false,
      groupFeaturesField: [],
      groupFeaturesFieldOrder: OrderRule.Asc,
      isSortGroupsByCount: false,
      expandOnOpen: false,
      editSummaryAreaLengthFieldPopupOpen: false,
      sumOfArea: false,
      sumOfLength: false,
      sumOfAreaLabel: this.nls('sumOfIntersectedArea'),
      sumOfLengthLabel: this.nls('sumOfIntersectedLength'),
      selectedLayerGeometry: this.props.selectedLayerGeometry,
      summaryFieldsList: [],
      intersectedSummaryFieldList: [],
      summaryEditIndex: null,
      summaryEditField: null,
      expressionInfo: null,
      sumOfIntersectedFieldPopupTitle: '',
      isAddNewSummaryField: false,
      isNewFieldAdded: false,
      showSummaryColorSettings: false,
      singleColorFields: transparentColor,
      byCategoryColorFields: null,
      singleColorMode: true,
      colorstripValues: colorsStrip1,
      popperFocusNode: null,
      expandFeatureDetails: false,
      highlightResultsOnMap: true,
      highlightColorOnMap: defaultHighlightResultsColor
    }
    this.setEditIndex = 0
    this.defaultSelectedItem.name = this.nls('noSelectionItemLabel')
    this.updateSummaryFieldListSettings = []
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

  componentDidMount = () => {
    this.props.availableFeatureLayer.forEach((layer, index) => {
      this.getLayerListProperty(layer.id)
    })
    //display updated layers list in config
    this.setState({
      selectedLayers: this.allSelectedLayers
    })
    this.editValueUpdate(false)
  }

  /**
   * Get the available layers list
   * @param layerDsId layer datasource id
   */
  getLayerListProperty = (layerDsId: string) => {
    const dsObj: DataSource = getSelectedLayerInstance(layerDsId)
    if (dsObj) {
      const label = dsObj.getLabel()
      const layerObj = {
        label: label,
        layer: { layerDsId: dsObj.id }
      }
      this.allSelectedLayers.push(layerObj)
    }
  }

  /**
   * Update the config as per the config changes
   * @param prevProps previous props of the config
   * @param prevState previous state of the config
   */
  componentDidUpdate = (prevProps, prevState) => {
    //update values on change of config
    if (this.props.editCurrentLayer.layerDsId !== prevProps.editCurrentLayer.layerDsId ||
      this.props.analysisIndex !== prevProps.analysisIndex ||
      !(lodash.isDeepEqual(this.props.analysisList, prevProps.analysisList))) {
      this.editValueUpdate(false)
    }

    if (!(lodash.isDeepEqual(this.state.analysisListSettings, prevState.analysisListSettings))) {
      this.editValueUpdate(true)
    }
  }

  /**
   * Set the intersected area or length field infos
   * @param commonSummaryFieldArr Intersected area or length summary fields
   * @param fieldInfo Field info of each layer
   * @returns Updated field inod
   */
  intersectedAreaLengthField = (commonSummaryFieldArr, fieldInfo) => {
    commonSummaryFieldArr.push({
      fieldLabel: fieldInfo.fieldLabel,
      fieldColor: fieldInfo.fieldColor,
      summaryFieldInfo: {
        summaryBy: fieldInfo.summaryFieldInfo.summaryBy,
        showSeparator: fieldInfo.summaryFieldInfo.showSeparator,
        numberFormattingOption: fieldInfo.summaryFieldInfo.numberFormattingOption,
        significantDigits: fieldInfo.summaryFieldInfo.significantDigits
      }
    })
    return commonSummaryFieldArr
  }

  /**
   * Set the layer info values to the respective summary analysis
   * @param layerAnalysisInfo layers analysis info
   */
  setSummaryValues = (layerAnalysisInfo) => {
    let commonSummaryFieldArr = []
    layerAnalysisInfo.summaryFields.forEach((fieldInfo) => {
      this.setState({
        singleColorFields: fieldInfo.fieldColor
      })
      if (fieldInfo.summaryFieldInfo?.summaryBy === CommonSummaryFieldValue.SumOfIntersectedArea) {
        commonSummaryFieldArr = this.intersectedAreaLengthField(commonSummaryFieldArr, fieldInfo)
        this.setState({
          sumOfAreaLabel: fieldInfo.fieldLabel,
          sumOfArea: true,
          intersectedSummaryFieldList: commonSummaryFieldArr
        })
      } else if (fieldInfo.summaryFieldInfo?.summaryBy === CommonSummaryFieldValue.SumOfIntersectedLength) {
        commonSummaryFieldArr = this.intersectedAreaLengthField(commonSummaryFieldArr, fieldInfo)
        this.setState({
          sumOfLengthLabel: fieldInfo.fieldLabel,
          sumOfLength: true,
          intersectedSummaryFieldList: commonSummaryFieldArr
        })
      } else {
        summaryFieldsArr.push({
          fieldLabel: fieldInfo.fieldLabel,
          fieldColor: fieldInfo.fieldColor,
          summaryFieldInfo: fieldInfo.summaryFieldInfo
        })
      }
    })
  }

  /**
   * On change of each analysis values update its values in config
   * @param isAnalysisEditedWithoutOkClick check if analysis edited without OK button click
   */
  editValueUpdate = (isAnalysisEditedWithoutOkClick: boolean) => {
    summaryFieldsArr = []
    this.getFieldsDs(this.props.editCurrentLayer.layerDsId)
    const updatedAnalysisList: LayersInfo[] = isAnalysisEditedWithoutOkClick ? this.state.analysisListSettings : this.props.analysisList
    // Set all the default values in the edit side popper according to its layer and analysis type
    updatedAnalysisList.forEach((layer, index) => {
      const layerAnalysisInfo: any = layer.analysisInfo
      const layerObj: any = getSelectedLayerInstance(layer.useDataSource?.dataSourceId)
      if (layer?.useDataSource?.dataSourceId === this.props.editCurrentLayer.layerDsId && layer.analysisInfo.analysisType === AnalysisTypeName.Closest && this.props.analysisIndex === index) {
        this.props.disableOkButton(layer.analysisInfo.analysisType === AnalysisTypeName.Closest && this.props.isActiveMapAreaSelected)
        this.setState({
          closestAnalysisType: true,
          proximityAnalysisType: false,
          summaryAnalysisType: false,
          useDataSource: layer.useDataSource,
          layerLabel: layer.label,
          analysisType: layer.analysisInfo.analysisType,
          highlightResultsOnMap: layerAnalysisInfo.highlightResultsOnMap,
          highlightColorOnMap: layerAnalysisInfo.highlightColorOnMap,
          expandOnOpen: layerAnalysisInfo.expandOnOpen
        })
        return true
      } else if (layer.useDataSource?.dataSourceId === this.props.editCurrentLayer.layerDsId && layer.analysisInfo.analysisType === AnalysisTypeName.Proximity && this.props.analysisIndex === index) {
        this.props.disableOkButton(false)
        this.setState({
          closestAnalysisType: false,
          proximityAnalysisType: true,
          summaryAnalysisType: false,
          useDataSource: layer.useDataSource,
          layerLabel: layer.label,
          analysisType: layer.analysisInfo.analysisType,
          displayField: layerAnalysisInfo.displayField ? [layerAnalysisInfo.displayField] : [getDisplayField(layerObj?.layerDefinition)],
          sortFeaturesByDistance: layerAnalysisInfo.sortFeaturesByDistance,
          sortFeaturesField: layerAnalysisInfo.sortFeatures.sortFeaturesByField ? [layerAnalysisInfo.sortFeatures.sortFeaturesByField] : [],
          sortFeaturesFieldOrder: layerAnalysisInfo.sortFeatures.sortFeaturesOrder,
          isGroupFeatures: layerAnalysisInfo.groupFeaturesEnabled,
          groupFeaturesField: layerAnalysisInfo.groupFeatures.groupFeaturesByField ? [layerAnalysisInfo.groupFeatures.groupFeaturesByField] : [],
          groupFeaturesFieldOrder: layerAnalysisInfo.groupFeatures.groupFeaturesOrder,
          isSortGroupsByCount: layerAnalysisInfo.sortGroupsByCount,
          expandOnOpen: layerAnalysisInfo.expandOnOpen,
          expandFeatureDetails: layerAnalysisInfo.expandFeatureDetails,
          highlightResultsOnMap: layerAnalysisInfo.highlightResultsOnMap,
          highlightColorOnMap: layerAnalysisInfo.highlightColorOnMap
        })
        return true
      } else if (layer.useDataSource?.dataSourceId === this.props.editCurrentLayer.layerDsId && layer.analysisInfo.analysisType === AnalysisTypeName.Summary && this.props.analysisIndex === index) {
        this.props.disableOkButton(false)
        this.setEditIndex = index
        const createLayerObj: any = getSelectedLayerInstance(this.props.editCurrentLayer.layerDsId)
        this.updateSummaryFieldListSettings = layerAnalysisInfo.summaryFields
        //if any summary fields are configured then display the same
        if (layerAnalysisInfo.summaryFields.length > 0) {
          this.setSummaryValues(layerAnalysisInfo)
        }
        this.setState({
          closestAnalysisType: false,
          proximityAnalysisType: false,
          summaryAnalysisType: true,
          useDataSource: layer.useDataSource,
          layerLabel: layer.label,
          analysisType: layer.analysisInfo.analysisType,
          singleColorMode: layerAnalysisInfo.isSingleColorMode,
          colorstripValues: layerAnalysisInfo.selectedColorStrip || colorsStrip1,
          singleColorFields: layerAnalysisInfo.summaryFields.length > 0 ? layerAnalysisInfo.singleFieldColor : transparentColor,
          summaryFieldsList: summaryFieldsArr,
          selectedLayerGeometry: createLayerObj?.layerDefinition?.geometryType,
          expandOnOpen: layerAnalysisInfo.expandOnOpen,
          highlightResultsOnMap: layerAnalysisInfo.highlightResultsOnMap,
          highlightColorOnMap: layerAnalysisInfo.highlightColorOnMap
        })
        return true
      }
    })
  }

  /**
   * Update the settings on change of any analysis settings
   * @param layerLabel Specifies layer label
   * @param useDataSource use data source
   */
  updateItemValue = (isEdited?: boolean, layerLabel?: string, useDataSource?: UseDataSource) => {
    const analysisSettings = this.state.analysisListSettings
    let updatedSettings
    // eslint-disable-next-line
    analysisSettings.some((analysisInfos, index) => {
      const layerObj: any = getSelectedLayerInstance(useDataSource?.dataSourceId ? useDataSource?.dataSourceId : this.props.editCurrentLayer.layerDsId)
      if ((analysisInfos?.useDataSource?.dataSourceId === useDataSource?.dataSourceId || this.props.editCurrentLayer.layerDsId) && (this.state.analysisType === AnalysisTypeName.Closest) && (this.props.analysisIndex === index)) {
        this.setEditIndex = index
        updatedSettings = {
          useDataSource: isEdited ? useDataSource : analysisInfos.useDataSource,
          label: isEdited ? layerLabel : analysisInfos.label,
          analysisInfo: {
            analysisId: analysisInfos.analysisInfo.analysisId,
            analysisType: this.state.analysisType,
            expandOnOpen: this.state.expandOnOpen,
            highlightResultsOnMap: this.state.highlightResultsOnMap,
            highlightColorOnMap: this.state.highlightColorOnMap
          }
        }
        return true
      } else if ((analysisInfos.useDataSource?.dataSourceId === useDataSource?.dataSourceId || this.props.editCurrentLayer.layerDsId) && (this.state.analysisType === AnalysisTypeName.Proximity) && (this.props.analysisIndex === index)) {
        this.setEditIndex = index
        updatedSettings = {
          useDataSource: isEdited ? useDataSource : analysisInfos.useDataSource,
          label: isEdited ? layerLabel : analysisInfos.label,
          analysisInfo: {
            analysisId: analysisInfos.analysisInfo.analysisId,
            analysisType: this.state.analysisType,
            displayField: this.state.displayField.length > 0 ? this.state.displayField[0] : getDisplayField(layerObj?.layerDefinition),
            sortFeaturesByDistance: this.state.sortFeaturesByDistance,
            sortFeatures: {
              sortFeaturesByField: this.state.sortFeaturesField.length > 0 ? this.state.sortFeaturesField[0] : '',
              sortFeaturesOrder: this.state.sortFeaturesFieldOrder
            },
            groupFeaturesEnabled: this.state.isGroupFeatures,
            groupFeatures: {
              groupFeaturesByField: this.state.groupFeaturesField.length > 0 ? this.state.groupFeaturesField[0] : '',
              groupFeaturesOrder: this.state.groupFeaturesFieldOrder
            },
            sortGroupsByCount: this.state.isSortGroupsByCount,
            expandOnOpen: this.state.expandOnOpen,
            expandFeatureDetails: this.state.expandFeatureDetails,
            highlightResultsOnMap: this.state.highlightResultsOnMap,
            highlightColorOnMap: this.state.highlightColorOnMap
          }
        }
        return true
      } else if ((analysisInfos.useDataSource?.dataSourceId === useDataSource?.dataSourceId || this.props.editCurrentLayer.layerDsId) && (this.state.analysisType === AnalysisTypeName.Summary) && (this.props.analysisIndex === index)) {
        this.setEditIndex = index
        this.updateSummaryFieldListSettings = this.state.summaryFieldsList.concat(this.state.intersectedSummaryFieldList) as SummaryFieldsInfo[]
        updatedSettings = {
          useDataSource: isEdited ? useDataSource : analysisInfos.useDataSource,
          label: isEdited ? layerLabel : analysisInfos.label,
          analysisInfo: {
            analysisId: analysisInfos.analysisInfo.analysisId,
            analysisType: this.state.analysisType,
            isSingleColorMode: this.state.singleColorMode,
            singleFieldColor: this.state.singleColorFields,
            selectedColorStrip: this.state.colorstripValues,
            summaryFields: this.updateSummaryFieldListSettings,
            expandOnOpen: this.state.expandOnOpen,
            highlightResultsOnMap: this.state.highlightResultsOnMap,
            highlightColorOnMap: this.state.highlightColorOnMap
          }
        }
        return true
      }
    })
    this.updateItem(this.setEditIndex, updatedSettings, useDataSource?.dataSourceId || this.props.editCurrentLayer.layerDsId, this.state.analysisType)
  }

  /**
   * Update each item of analysis info
   * @param formatIndex Edit analysis index
   * @param itemAttributes Updated info for the layer
   * @param layerDsId Layer Ds id
   * @param analysisType Layer analysis type
   */
  updateItem = (formatIndex: number, itemAttributes, layerDsId, analysisType) => {
    const index = formatIndex
    if (index > -1) {
      const updateSettings = [...this.props.analysisList.slice(0, index),
        Object.assign({}, this.props.analysisList[index], itemAttributes),
        ...this.props.analysisList.slice(index + 1)]
      // update the whole analysis settings
      this.props.onAnalysisUpdate(updateSettings, layerDsId, analysisType, index)
      this.setState({
        analysisListSettings: updateSettings
      })
    }
  }

  /**
   * Update the analysis type parameter
   * @param analysisType analysis type e.g Closest, Proximity, Summary
   */
  onAnalysisTypeChange = (analysisType) => {
    this.props.disableOkButton(false)
    if (analysisType === AnalysisTypeName.Closest) {
      this.setState({
        closestAnalysisType: true,
        proximityAnalysisType: false,
        summaryAnalysisType: false,
        expandOnOpen: true
      })
    } else if (analysisType === AnalysisTypeName.Proximity) {
      this.setState({
        closestAnalysisType: false,
        proximityAnalysisType: true,
        summaryAnalysisType: false,
        expandOnOpen: false,
        expandFeatureDetails: false
      })
    } else {
      this.setState({
        closestAnalysisType: false,
        proximityAnalysisType: false,
        summaryAnalysisType: true,
        expandOnOpen: false
      })
    }
    // On change of analysis type reset to the default values
    this.resetAnalysisValues(this.state.useDataSource)
    this.setState({
      analysisType: analysisType
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Update the layer label parameter
   * @param event event on layer label change
   */
  onLayerLabelChange = (event) => {
    if (event?.target) {
      const value = event.target.value
      this.setState({
        layerLabel: value
      })
    }
  }

  /**
   * Update the layer label
   * @param value layer label accepted value
   */
  onLayerLabelAcceptValue = (value: string) => {
    this.updateItemValue(true, value, this.state.useDataSource)
  }

  /**
   * Update sort features parameter
   * @param value sort feature option
   */
  handleSortFeaturesOptionsChange = (value: boolean) => {
    this.setState({
      sortFeaturesByDistance: value
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Update display field parameter
   * @param allSelectedFields Selected fields array
   */
  onDisplayField = (allSelectedFields: IMFieldSchema[]) => {
    if (allSelectedFields.length === 0) {
      this.setState({
        displayField: []
      }, () => {
        this.updateItemValue()
      })
    } else {
      this.setState({
        displayField: [allSelectedFields[0].jimuName]
      }, () => {
        this.updateItemValue()
      })
    }
  }

  /**
   * Update sort features field parameter
   * @param allSelectedFields Selected fields array
   */
  onSortFieldSelectChange = (allSelectedFields: IMFieldSchema[]) => {
    if (allSelectedFields.length === 0) {
      this.setState({
        sortFeaturesField: []
      }, () => {
        this.updateItemValue()
      })
    } else {
      this.setState({
        sortFeaturesField: [allSelectedFields[0].jimuName]
      }, () => {
        this.updateItemValue()
      })
    }
  }

  /**
   * Update group features field parameter
   * @param allSelectedFields Selected fields array
   */
  onGroupFieldSelectChange = (allSelectedFields: IMFieldSchema[]) => {
    if (allSelectedFields.length === 0) {
      this.setState({
        groupFeaturesField: []
      }, () => {
        this.updateItemValue()
      })
    } else {
      this.setState({
        groupFeaturesField: [allSelectedFields[0].jimuName]
      }, () => {
        this.updateItemValue()
      })
    }
  }

  /**
   * On Expand show the expand feature details config
   * @param evt on change event of expand
   */
  expandListOnChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    //for proximity analysis type if expand list is off then make expand feature details off
    if (!evt.target.checked && this.state.proximityAnalysisType) {
      this.setState({
        expandFeatureDetails: false
      })
    }
    this.setState({
      expandOnOpen: evt.target.checked
    }, () => {
      this.updateItemValue()
    })
  }

  /**
  * Reset the layer info when the layer or analysis type changes
  * @param useDataSource use data source
  */
  resetAnalysisValues = (useDataSource: UseDataSource) => {
    const layerObj: any = getSelectedLayerInstance(useDataSource.dataSourceId)
    this.setState({
      displayField: [],
      sortFeaturesByDistance: true,
      sortFeaturesField: [],
      sortFeaturesFieldOrder: OrderRule.Asc,
      isGroupFeatures: false,
      groupFeaturesField: [],
      groupFeaturesFieldOrder: OrderRule.Asc,
      isSortGroupsByCount: false,
      selectedLayerGeometry: layerObj?.layerDefinition?.geometryType,
      sumOfLength: false,
      sumOfArea: false,
      summaryFieldsList: [],
      intersectedSummaryFieldList: [],
      sumOfAreaLabel: this.nls('sumOfIntersectedArea'),
      sumOfLengthLabel: this.nls('sumOfIntersectedLength')
    }, () => {
      this.updateItemValue()
    })
  }

  //Add the new summary fields
  onAddSummaryFieldsClick = (e) => {
    e.stopPropagation()
    this.setState({
      isAddNewSummaryField: true,
      isNewFieldAdded: true,
      summaryEditIndex: null
    }, () => {
      this.backRef.current?.backRefFocus()
    })
  }

  /**
   * edit individual summary fields list
   * @param e Event of editing summary fields info
   * @param field Summary field
   * @param summaryFieldsEditIndex Summary field index
   */
  editSummaryFields = (e, field, summaryFieldsEditIndex: number) => {
    e.stopPropagation()
    this.setSidePopperAnchor(summaryFieldsEditIndex)
    this.setState({
      isAddNewSummaryField: true,
      isNewFieldAdded: false,
      summaryEditField: field,
      summaryEditIndex: summaryFieldsEditIndex
    }, () => {
      this.backRef.current?.backRefFocus()
    })
  }

  /**
   * set side popper anchor
   * @param index index of the analysis
   */
  setSidePopperAnchor = (index?: number) => {
    const node: any = this.summaryFieldsSidePopperTrigger.current.getElementsByClassName('jimu-tree-item__body')[index]
    this.setState({
      popperFocusNode: node
    })
  }

  /**
   * Delete individual summary fields list
   * @param e deleted analysis event
   * @param index deleted analysis index
   */
  deleteSummaryFields = (e, index) => {
    e.stopPropagation()
    let updatedSettings
    const summaryList = this.state.summaryFieldsList.concat(this.state.intersectedSummaryFieldList)
    summaryList.splice(index, 1)
    //if fields list is empty set the focus on add summary fields button
    summaryList.length === 0 ? this.addSummaryFieldsRef.current?.focus() : this.summaryFieldsSidePopperTrigger.current?.focus()
    this.state.analysisListSettings.forEach((layer) => {
      const layerAnalysisInfo: any = layer.analysisInfo
      if (layer.useDataSource.dataSourceId === this.props.editCurrentLayer.layerDsId &&
        layer.analysisInfo.analysisType === AnalysisTypeName.Summary) {
        updatedSettings = { // on delete of summary fields update the summary fields list
          useDataSource: layer.useDataSource,
          label: layer.label,
          analysisInfo: {
            analysisId: layer.analysisInfo.analysisId,
            analysisType: layer.analysisInfo.analysisType,
            isSingleColorMode: layerAnalysisInfo.isSingleColorMode,
            singleFieldColor: layerAnalysisInfo.singleFieldColor,
            selectedColorStrip: layerAnalysisInfo.selectedColorStrip,
            summaryFields: summaryList,
            expandOnOpen: layerAnalysisInfo.expandOnOpen,
            highlightResultsOnMap: layerAnalysisInfo.highlightResultsOnMap,
            highlightColorOnMap: layerAnalysisInfo.highlightColorOnMap
          }
        }
      }
    })
    this.updateItem(this.setEditIndex, updatedSettings, this.props.editCurrentLayer.layerDsId, this.state.analysisType)
  }

  /**
   * Edit intersected area or length summary field infos
   * @param summaryFieldLabel Summary field label
   * @param showThousandSeparator Show thousand separator parameter
   * @param formattingOptions Formatting options parameter
   * @param significantDigit Significant digits parameter
   */
  editExistingIntersectedSummaryField = (summaryFieldLabel: string, showThousandSeparator: boolean,
    formattingOptions: string, significantDigit: number) => {
    let updatedSummaryFieldInfos
    this.state.intersectedSummaryFieldList.forEach((summaryList, index) => {
      updatedSummaryFieldInfos = this.updateSummaryIntersectedFields(summaryFieldLabel, showThousandSeparator,
        formattingOptions, significantDigit, summaryList)
    })
    if (this.state.summaryEditField.summaryFieldInfo.summaryBy === CommonSummaryFieldValue.SumOfIntersectedArea) {
      this.setState({
        sumOfAreaLabel: summaryFieldLabel
      })
    } else if (this.state.summaryEditField.summaryFieldInfo.summaryBy === CommonSummaryFieldValue.SumOfIntersectedLength) {
      this.setState({
        sumOfLengthLabel: summaryFieldLabel
      })
    }
    //on edit update the intersected summary fields
    this.setState({
      intersectedSummaryFieldList: [
        ...this.state.intersectedSummaryFieldList.slice(0, 0),
        Object.assign({}, this.state.intersectedSummaryFieldList[0], updatedSummaryFieldInfos),
        ...this.state.intersectedSummaryFieldList.slice(0 + 1)
      ]
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Update the exiting intersected summary fields
   * @param summaryFieldLabel Summary field label
   * @param showThousandSeparator Show thousand separator parameter
   * @param formattingOptions Formatting options parameter
   * @param significantDigit Significant digits parameter
   * @param summaryList Updated summary fields list
   * @returns Summary fields info
   */
  updateSummaryIntersectedFields = (summaryFieldLabel: string, showThousandSeparator: boolean,
    formattingOptions: string, significantDigit: number, summaryList?) => {
    //get default intersected summary field depending upon the layer geometry type
    let updatedSummaryFieldInfos = {}
    let commonIntersectedFieldValue
    if (this.state.selectedLayerGeometry === 'esriGeometryPolyline') {
      commonIntersectedFieldValue = CommonSummaryFieldValue.SumOfIntersectedLength
    } else if (this.state.selectedLayerGeometry === 'esriGeometryPolygon') {
      commonIntersectedFieldValue = CommonSummaryFieldValue.SumOfIntersectedArea
    }
    updatedSummaryFieldInfos = {
      fieldLabel: summaryFieldLabel,
      fieldColor: summaryList.fieldColor,
      summaryFieldInfo: {
        summaryBy: commonIntersectedFieldValue,
        showSeparator: showThousandSeparator,
        numberFormattingOption: formattingOptions,
        significantDigits: significantDigit
      }
    }
    return updatedSummaryFieldInfos
  }

  /**
   * Update the existing summary fields
   * @param summaryFieldLabel Summary field label
   * @param showThousandSeparator Show thousand separator parameter
   * @param formattingOptions Formatting options parameter
   * @param significantDigit Significant digits parameter
   */
  onOkButtonClick = (summaryFieldLabel: string, showThousandSeparator: boolean,
    formattingOptions: string, significantDigit: number) => {
    this.editExistingIntersectedSummaryField(summaryFieldLabel, showThousandSeparator, formattingOptions, significantDigit)
  }

  /**
  * Create label and delete button elements in the individual summary field list items
  * @param field fields
  * @param index index of inidvidual fields
  * @returns fields option element
  */
  createFieldsOptionElement = (field, index: number) => {
    const _options = (
      <React.Fragment>
        <div tabIndex={0} aria-label={field.fieldLabel} className={'text-truncate labelAlign'}
          title={field.fieldLabel}>{field.fieldLabel}</div>
        <Button role={'button'} aria-label={field.fieldLabel + this.nls('editExpression')} className={'ml-1'}
          title={this.nls('editExpression')} icon type={'tertiary'} size={'sm'} onClick={(e) => { this.editSummaryFields(e, field, index) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              this.editSummaryFields(e, field, index)
            }
          }}>
          <EditOutlined size={'s'} />
        </Button>
        <Button role={'button'} aria-label={this.nls('deleteOption')} title={this.nls('deleteOption')}
          icon type={'tertiary'} size={'sm'} onClick={(e) => { this.deleteSummaryFields(e, index) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              this.deleteSummaryFields(e, index)
            }
          }}>
          <CloseOutlined size='s' />
        </Button>
      </React.Fragment>
    )
    return _options
  }

  //close the summary edit popper
  onEditPopperClose = () => {
    this.setState({
      editSummaryAreaLengthFieldPopupOpen: false
    })
  }

  /**
   * Update the sorted summary fields
   * @param sortedFields sorted fields
   */
  updateSortedSummaryFields = (sortedFields: SummaryFieldsInfo[]) => {
    this.setState({
      summaryFieldsList: sortedFields
    }, () => {
      this.updateItemValue()
    })
  }

  onColorSettingClick = () => {
    this.openColorSetting(true)
  }

  /**
*On click of back and arrow button close the color settings panel and come back to the edit analysis settings panel
*/
  closeColorSettingsPanel = () => {
    this.openColorSetting(false)
    this.focusColorSetting()
  }

  focusColorSetting = () => {
    setTimeout(() => {
      this.colorButtonRef.current?.focus()
    }, 50)
  }

  /**
   * Show summary color settings
   * @param isOpen if color setting is open
   */
  openColorSetting = (isOpen: boolean) => {
    this.setState({
      showSummaryColorSettings: isOpen
    }, () => {
      this.backRef.current?.backRefFocus()
      setTimeout(() => {
        this.colorSidePopperTrigger.current?.focus()
      }, 50)
    })
  }

  /**
   * On change of individual colors, update field colors and summary fields list in the configuration
   * @param byCategoryColorFields by category color fields
   * @param colors respective color array
   * @param isByCategoryEnable if by category fields option enable
   */
  onUpdateFieldColorByCategory = (byCategoryColorFields: ColorMatches, colors: string[], isByCategoryEnable?: boolean) => {
    const updatedSummaryFieldsList = this.state.summaryFieldsList?.map((fieldsInfo, index) => {
      return {
        ...fieldsInfo,
        fieldColor: byCategoryColorFields?.[fieldsInfo.fieldLabel + '_' + index]?._fillColor
          ? byCategoryColorFields?.[fieldsInfo.fieldLabel + '_' + index]?._fillColor
          : isByCategoryEnable ? this.state.colorstripValues[index % this.state.colorstripValues.length] : colors?.[index % colors?.length]
      }
    })
    const updateSummaryIntersectedFieldsList = this.state.intersectedSummaryFieldList?.map((fieldsInfo, index) => {
      return {
        ...fieldsInfo,
        fieldColor: byCategoryColorFields?.[fieldsInfo.fieldLabel + '_' + this.state.summaryFieldsList.length]?._fillColor
          ? byCategoryColorFields?.[fieldsInfo.fieldLabel + '_' + this.state.summaryFieldsList.length]?._fillColor
          : isByCategoryEnable ? this.state.colorstripValues[index % this.state.colorstripValues.length] : colors?.[index % colors?.length]
      }
    })
    this.setState({
      summaryFieldsList: updatedSummaryFieldsList,
      intersectedSummaryFieldList: updateSummaryIntersectedFieldsList,
      byCategoryColorFields: byCategoryColorFields,
      colorstripValues: colors
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Handle the states on color type change e.g by category or single color
   * @param updateColorType updated color type
   */
  handleColorTypeChange = (updateColorType: string) => {
    if (updateColorType === ColorMode.SingleColor) {
      this.updateFieldColorBySingleColor(this.state.singleColorFields)
    } else if (updateColorType === ColorMode.ByCategory) {
      this.onUpdateFieldColorByCategory(this.state.byCategoryColorFields, this.state.colorstripValues, true)
    }
    this.setState({
      singleColorMode: updateColorType === ColorMode.SingleColor
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Handle the states on single color option change
   * @param singleColor single color option
   */
  handleSingleColorChange = (singleColor: string) => {
    this.setState({
      singleColorFields: singleColor
    }, () => {
      this.updateFieldColorBySingleColor(this.state.singleColorFields)
    })
  }

  /**
   * Update the field color by single color
   * @param singleColor single color option
   */
  updateFieldColorBySingleColor = (singleColor: string) => {
    const updatedSummaryFieldList = this.state.summaryFieldsList?.map((fieldsInfo, index) => {
      return { ...fieldsInfo, fieldColor: singleColor }
    })
    const updatedSummaryIntersectedFieldList = this.state.intersectedSummaryFieldList?.map((fieldsInfo, index) => {
      return { ...fieldsInfo, fieldColor: singleColor }
    })
    this.setState({
      summaryFieldsList: updatedSummaryFieldList,
      intersectedSummaryFieldList: updatedSummaryIntersectedFieldList
    }, () => {
      this.updateItemValue()
    })
  }

  handleByCategorySettingColorChange = () => {
    this.openColorSetting(true)
  }

  handleSortOrderKeyUp = (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      this.setState({
        sortFeaturesFieldOrder: this.state.sortFeaturesFieldOrder === OrderRule.Asc ? OrderRule.Desc : OrderRule.Asc
      }, () => {
        this.updateItemValue()
      })
    }
  }

  handleGroupOrderKeyUp = (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      this.setState({
        groupFeaturesFieldOrder: this.state.groupFeaturesFieldOrder === OrderRule.Asc ? OrderRule.Desc : OrderRule.Asc
      }, () => {
        this.updateItemValue()
      })
    }
  }

  /**
   * Get fields from layers
   * @param currentLayerDsId current layer datasource id
   */
  getFieldsDs = (currentLayerDsId: string) => {
    const selectedDs = []
    const createLayerObj: any = getSelectedLayerInstance(currentLayerDsId)
    selectedDs.push({
      layerDsId: currentLayerDsId
    })
    this.setState({
      selectedFieldsDataSource: selectedDs,
      selectedLayerGeometry: createLayerObj?.layerDefinition?.geometryType
    })
  }

  /**
   * Create field selector for display field
   * @param selectedLayerDataSource selected layer datasource
   * @returns field options
   */
  createDisplayFieldOption = (selectedLayerDataSource: any): any => {
    const dsObj: DataSource = getSelectedLayerInstance(selectedLayerDataSource.layerDsId)
    const _options = (
      <FieldSelector
        dataSources={dsObj ? [dsObj] : []}
        onChange={this.onDisplayField.bind(this)}
        isDataSourceDropDownHidden={true}
        useDropdown={true}
        selectedFields={Immutable(this.state.displayField)}
        isMultiple={false}
      />
    )
    return _options
  }

  /**
   * Create field selector includes sorting fields capability
   * @param selectedLayerDataSource selected layer datasource
   * @param index field index
   * @returns field selector options
   */
  createSortFieldSelectorOption = (selectedLayerDataSource: any, index: number): any => {
    const dsObj: DataSource = getSelectedLayerInstance(selectedLayerDataSource.layerDsId)
    const _options = (
      <div className='sort-field-section p-1'>
        {
          <div className='sort-field-selector'>
            <FieldSelector
              dataSources={dsObj ? [dsObj] : []}
              onChange={this.onSortFieldSelectChange.bind(this)}
              isDataSourceDropDownHidden
              useDropdown
              selectedFields={Immutable(this.state.sortFeaturesField)}
              isMultiple={false}
              noSelectionItem={this.defaultSelectedItem}
              dropdownProps={{ useKeyUpEvent: true }}
            />
          </div>
        }
        <div className='sort-icon'>
          <Button
            size='sm'
            icon
            type='tertiary'
            className='order-button padding-0'
            title={this.state.sortFeaturesFieldOrder === OrderRule.Asc ? this.nls('ascending') : this.nls('decending')}
            onKeyUp={(e) => { this.handleSortOrderKeyUp(e) }}
            onClick={() => {
              this.setState({
                sortFeaturesFieldOrder: this.state.sortFeaturesFieldOrder === OrderRule.Asc ? OrderRule.Desc : OrderRule.Asc
              }, () => {
                this.updateItemValue()
              })
            }}>
            {this.state.sortFeaturesFieldOrder === OrderRule.Desc && <SortDescendingOutlined size='s' className='sort-arrow-down-icon ml-0' />}
            {this.state.sortFeaturesFieldOrder === OrderRule.Asc && <SortAscendingOutlined size='s' className='sort-arrow-down-icon ml-0' />}
          </Button>
        </div>
      </div>
    )
    return _options
  }

  /**
   * Create field selector includes group and sorting fields capability
   * @param selectedLayerDataSource selected layer datasource
   * @param index field index
   * @returns group field selector options
   */
  createGroupFieldSelectorOption = (selectedLayerDataSource: any, index: number): any => {
    const dsObj = getSelectedLayerInstance(selectedLayerDataSource.layerDsId)
    const _options = (
      <div className='sort-field-section p-1'>
        {
          <div className='sort-field-selector'>
            <FieldSelector
              dataSources={dsObj ? [dsObj] : []}
              onChange={(e) => { this.onGroupFieldSelectChange(e) }}
              isDataSourceDropDownHidden
              useDropdown
              selectedFields={Immutable(this.state.groupFeaturesField)}
              isMultiple={false}
              noSelectionItem={this.defaultSelectedItem}
              dropdownProps={{ useKeyUpEvent: true }}
            />
          </div>
        }
        <div className='sort-icon'>
          <Button
            size='sm'
            icon
            type='tertiary'
            className='order-button padding-0'
            title={this.state.groupFeaturesFieldOrder === OrderRule.Asc ? this.nls('ascending') : this.nls('decending')}
            onKeyUp={(e) => { this.handleGroupOrderKeyUp(e) }}
            onClick={() => {
              this.setState({
                groupFeaturesFieldOrder: this.state.groupFeaturesFieldOrder === OrderRule.Asc ? OrderRule.Desc : OrderRule.Asc
              }, () => {
                this.updateItemValue()
              })
            }}>
            {this.state.groupFeaturesFieldOrder === OrderRule.Desc && <SortDescendingOutlined size='s' className='sort-arrow-down-icon ml-0' />}
            {this.state.groupFeaturesFieldOrder === OrderRule.Asc && <SortAscendingOutlined size='s' className='sort-arrow-down-icon ml-0' />}
          </Button>
        </div>
      </div>
    )
    return _options
  }

  /**
   * Upadte the group features option
   * @param evt group feature change event
   */
  groupFeaturesOnChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const layerObj = getSelectedLayerInstance(this.state.useDataSource.dataSourceId) as any
    const uniqueRendererField = layerObj.layer.renderer.type === 'unique-value' ? [layerObj.layer.renderer.field] : []
    this.setState({
      isGroupFeatures: evt.target.checked,
      groupFeaturesField: uniqueRendererField
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Upadte the groups by count option
   * @param evt group by count change event
   */
  sortGroupsByCountOnChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      isSortGroupsByCount: evt.target.checked
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Update the sum of area option
   * @param evt sum of area option event
   * @param sumOfArea if sum of area selected
   */
  onSumOfAreaChange = (evt, sumOfArea: string) => {
    this.updateIntersectedFields(evt.target.checked, sumOfArea)
    this.setState({
      sumOfArea: evt.target.checked
    })
  }

  /**
   * Update the sum of length option
   * @param evt sum of length option event
   * @param sumOfArea if sum of length selected
   */
  onSumOfLengthChange = (evt, sumOfLength: string) => {
    this.updateIntersectedFields(evt.target.checked, sumOfLength)
    this.setState({
      sumOfLength: evt.target.checked
    })
  }

  /**
   * Update intersected fields info
   * @param isIntersectedField Intersected field
   * @param intersectedFieldValue Intersected field parameter value
   */
  updateIntersectedFields = (isIntersectedField: boolean, intersectedFieldValue: string) => {
    if (isIntersectedField) {
      const updateSettings = {
        fieldLabel: intersectedFieldValue === CommonSummaryFieldValue.SumOfIntersectedLength ? this.state.sumOfLengthLabel : this.state.sumOfAreaLabel,
        fieldColor: this.state.singleColorMode ? this.state.singleColorFields : transparentColor,
        summaryFieldInfo: {
          summaryBy: intersectedFieldValue,
          showSeparator: true,
          numberFormattingOption: NumberFormatting.NoFormatting,
          significantDigits: 0
        }
      }
      this.setState({
        intersectedSummaryFieldList: [
          ...this.state.intersectedSummaryFieldList.slice(0, 0),
          Object.assign({}, this.state.intersectedSummaryFieldList[0], updateSettings),
          ...this.state.intersectedSummaryFieldList.slice(0 + 1)
        ]
      }, () => {
        if (!this.state.singleColorMode) {
          this.onUpdateFieldColorByCategory(this.state.byCategoryColorFields, this.state.colorstripValues)
        } else {
          this.updateItemValue()
        }
      })
    } else {
      this.state.intersectedSummaryFieldList.splice(0, 1)
      this.updateItemValue()
    }
  }

  /**
   * Edit the sum of area option
   * @param sumOfArea if sum of area selected
   */
  onSumOfAreaEditClick = (sumOfArea: string) => {
    this.onIntersectedFieldEdit(sumOfArea)
  }

  /**
   * Edit the sum of length option
   * @param sumOfArea if sum of length selected
   */
  onSumOfLengthEditClick = (sumOfLength: string) => {
    this.onIntersectedFieldEdit(sumOfLength)
  }

  /**
   * Edit the intersected field option
   * @param intersectedField intersected field
   */
  onIntersectedFieldEdit = (intersectedField: string) => {
    this.setState({
      editSummaryAreaLengthFieldPopupOpen: true,
      sumOfIntersectedFieldPopupTitle: intersectedField === CommonSummaryFieldValue.SumOfIntersectedArea ? this.nls('editSumOfIntersectedArea') : this.nls('editSumOfIntersectedLength')
    })
    this.state.intersectedSummaryFieldList.forEach((field) => {
      if (field.summaryFieldInfo.summaryBy === intersectedField) {
        this.setState({
          summaryEditField: field
        })
      }
    })
  }

  /**
*On click of back and close button close the add summary field panel and come back to the edit analysis settings panel
*/
  closeAddSummaryFieldPanel = () => {
    this.setState({
      isAddNewSummaryField: false
    }, () => {
      this.addSummaryFieldsRef.current.focus()
    })
  }

  /**
   * Update the selected expression of existing or newly added summary fields
   * @param expressionInfo selected expression info
   */
  onExpressionInfoUpdate = (expressionInfo: SelectedExpressionInfo) => {
    this.setState({
      isAddNewSummaryField: false
    })
    const updatedSummaryFieldInfos = {
      fieldLabel: expressionInfo.fieldLabel,
      fieldColor: this.state.singleColorMode ? this.state.singleColorFields : transparentColor,
      summaryFieldInfo: expressionInfo.selectedExpression
    }
    if (this.state.isNewFieldAdded) {
      this.setState({
        summaryFieldsList: [...this.state.summaryFieldsList, updatedSummaryFieldInfos],
        expressionInfo: expressionInfo.selectedExpression
      }, () => {
        this.setSidePopperAnchor(this.state.summaryFieldsList.length - 1)
        if (!this.state.singleColorMode) {
          this.onUpdateFieldColorByCategory(this.state.byCategoryColorFields, this.state.colorstripValues)
        } else {
          this.updateItemValue()
        }
      })
    } else {
      this.setState({
        expressionInfo: expressionInfo.selectedExpression
      }, () => {
        this.updateExistingField(updatedSummaryFieldInfos)
      })
    }
  }

  /**
   * Update the existing added field
   * @param updatedSummaryFieldInfos updated summary field infos
   */
  updateExistingField = (updatedSummaryFieldInfos) => {
    const index = this.state.summaryEditIndex
    if (index > -1) {
      //on edit update the summary fields list
      this.setState({
        summaryFieldsList: [
          ...this.state.summaryFieldsList.slice(0, index),
          Object.assign({}, this.state.summaryFieldsList[index], updatedSummaryFieldInfos),
          ...this.state.summaryFieldsList.slice(index + 1)
        ]
      }, () => {
        if (!this.state.singleColorMode) {
          this.onUpdateFieldColorByCategory(this.state.byCategoryColorFields, this.state.colorstripValues)
        } else {
          this.updateItemValue()
        }
      })
    }
  }

  /**
   * Get the data source root ids from the appconfig datasources
   * @returns array of root data source ids
   */
  getDsRootIdsByWidgetId = () => {
    const appConfig = getAppStore().getState()?.appStateInBuilder?.appConfig
    const widgetJson = appConfig
    const rootIds = []
    const ds = widgetJson.dataSources[this.props.activeDs]
    if (ds?.type === ArcGISDataSourceTypes.WebMap || ds?.type === ArcGISDataSourceTypes.WebScene) { // is root ds
      rootIds.push(this.props.activeDs)
    }

    return rootIds.length > 0 ? Immutable(rootIds) : undefined
  }

  /**
   *  save currentSelectedDs to array
   * @param useDataSources use data source
   * @returns returns if no use data sources
   */
  dataSourceChangeSave = (useDataSources: UseDataSource[]) => {
    if (!useDataSources) {
      return
    }
    const availableFeatureLayer = this.props?.availableFeatureLayer.find(result => result.id === useDataSources[0].dataSourceId) as any
    // On change of layer reset to the default values
    this.resetAnalysisValues(useDataSources[0])
    this.setState({
      layerLabel: availableFeatureLayer?.getLabel() ? availableFeatureLayer.getLabel() : '',
      useDataSource: useDataSources[0]
    }, () => {
      this.updateItemValue(true, this.state.layerLabel, this.state.useDataSource)
    })
  }

  /**
   * Handles change event of expand feature details checkbox
   * @param evt check box current state
   */
  expandFeatureOnChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      expandFeatureDetails: evt.target.checked
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Handles change event of highlight results switch
   * @param evt switch current state
   */
  highlightResultsOnMapOnChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      highlightResultsOnMap: evt.target.checked
    }, () => {
      this.updateItemValue()
    })
  }

  /**
   * Update highlightColorOnMap property in the config
   * @param color changed highlight color
   */
  onHighlightColorOnMapChange = (color: string) => {
    this.setState({
      highlightColorOnMap: color
    }, () => {
      this.updateItemValue()
    })
  }

  render () {
    const ds = DataSourceManager.getInstance().getDataSource(this.props.activeDs)
    const childDs = ds?.getChildDataSources()
    let dsAdded = false
    const dsRootIdsArr = []
    if (childDs) {
      childDs.forEach((layer) => {
        const getLayer: any = layer
        if (getLayer?.layerDefinition?.type !== 'Table') {
          if (layer?.type === DataSourceTypes.MapService || layer?.type === DataSourceTypes.GroupLayer) {
            const recursiveCheckForGroupLayers = (grpLayer) => {
              const grpChildlayers = grpLayer.getChildDataSources()
              grpChildlayers.forEach((subLayers) => {
                if (subLayers?.type === DataSourceTypes.GroupLayer) {
                  recursiveCheckForGroupLayers(subLayers)
                } else {
                  dsRootIdsArr.push(subLayers.id)
                }
              })
            }
            recursiveCheckForGroupLayers(layer)
          } else { //for feature layer
            if (dsRootIdsArr.length > 0) { //check for if map service child data source is same as feature layer ds id
              const matchedLayerWithMapService = dsRootIdsArr.find(item => item.id === layer.id)
              if (!matchedLayerWithMapService) {
                dsAdded = true
              }
              if (dsAdded) dsRootIdsArr.push(layer.id)
            } else {
              dsRootIdsArr.push(layer.id)
            }
          }
        }
      })
    }

    const dsRootIds = this.getDsRootIdsByWidgetId()

    //dsObject parameters used to pass to the ds selector
    const dsSelectorSource = {
      fromRootDsIds: dsRootIds,
      fromDsIds: Immutable(dsRootIdsArr)
    }

    return <div css={getAnalysisSettingStyle(this.props.theme, this.props.isActiveMapAreaSelected)} style={{ height: 'calc(100% - 112px)', width: '100%', overflow: 'auto' }}>
      <SettingSection>
        <SettingRow label={this.nls('selectLayer')} flow={'wrap'}>
          <DataSourceSelector
            types={this.supportedDsTypes}
            useDataSources={this.state.useDataSource ? Immutable([this.state.useDataSource]) : Immutable([])}
            fromRootDsIds={dsSelectorSource.fromRootDsIds}
            fromDsIds={dsSelectorSource.fromDsIds}
            mustUseDataSource={true}
            onChange={this.dataSourceChangeSave}
            enableToSelectOutputDsFromSelf={false}
            closeDataSourceListOnChange
            hideAddDataButton={true}
            disableRemove={() => true}
            hideDataView={true}
            useDataSourcesEnabled
          />
        </SettingRow>

        <SettingRow label={this.nls('label')} flow={'wrap'}>
          <TextInput className='w-100' role={'textbox'} aria-label={this.nls('label') + this.state.layerLabel} title={this.state.layerLabel}
            size={'sm'} value={this.state.layerLabel} onAcceptValue={this.onLayerLabelAcceptValue} onChange={this.onLayerLabelChange} />
        </SettingRow>
      </SettingSection>

      <SettingSection>
        <SettingRow>
          <Label className='w-100 d-flex'>
            <div className='flex-grow-1 text-break setting-text-level-1'>
              {this.nls('analysisTypeLabel')}
            </div>
          </Label>
        </SettingRow>

        <SettingRow className={'mt-4'} flow='wrap'>
          <Label className='m-0 analysisTypeWidth' centric>
            <Radio role={'radio'} aria-label={this.nls(AnalysisTypeName.Closest)}
              className={'cursor-pointer'}
              value={this.nls(AnalysisTypeName.Closest)}
              onChange={() => { this.onAnalysisTypeChange(AnalysisTypeName.Closest) }}
              checked={this.state.analysisType === AnalysisTypeName.Closest}
              disabled={this.props.isActiveMapAreaSelected} />
            <div tabIndex={0} className={classNames('ml-1 text-break', this.props.isActiveMapAreaSelected ? 'disabled-label' : 'cursor-pointer')}
              onClick={() => { !this.props.isActiveMapAreaSelected && !(this.state.analysisType === AnalysisTypeName.Closest) && this.onAnalysisTypeChange(AnalysisTypeName.Closest) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  !this.props.isActiveMapAreaSelected && !(this.state.analysisType === AnalysisTypeName.Closest) && this.onAnalysisTypeChange(AnalysisTypeName.Closest)
                }
              }}>
              {this.nls(AnalysisTypeName.Closest)}
            </div>
          </Label>
          <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('closestAnalysisTypeTooltip')}
            title={this.nls('closestAnalysisTypeTooltip')} showArrow placement='top'>
            <div className='setting-text-level-2 d-inline'>
              <InfoOutlined />
            </div>
          </Tooltip>
        </SettingRow>

        {this.props.isActiveMapAreaSelected && this.state.analysisType === AnalysisTypeName.Closest &&
          <Alert tabIndex={0} withIcon size='small' type='warning' className='w-100 shadow mb-2 mt-2'>
            <div className='flex-grow-1 text-break settings-text-level'>
              {this.nls('warningMsgIfActiveMapArea')}
            </div>
          </Alert>
        }

        <SettingRow className={'mt-2'} flow='wrap'>
          <Label className='m-0 analysisTypeWidth' centric>
            <Radio role={'radio'} aria-label={this.nls(AnalysisTypeName.Proximity)}
              className={'cursor-pointer'}
              value={this.nls(AnalysisTypeName.Proximity)}
              onChange={() => { this.onAnalysisTypeChange(AnalysisTypeName.Proximity) }}
              checked={this.state.analysisType === AnalysisTypeName.Proximity} />
            <div tabIndex={0} className='ml-1 cursor-pointer text-break' onClick={() => { !(this.state.analysisType === AnalysisTypeName.Proximity) && this.onAnalysisTypeChange(AnalysisTypeName.Proximity) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  !(this.state.analysisType === AnalysisTypeName.Proximity) && this.onAnalysisTypeChange(AnalysisTypeName.Proximity)
                }
              }}>
              {this.nls(AnalysisTypeName.Proximity)}
            </div>
          </Label>
          <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('proximityAnalysisTypeTooltip')}
            title={this.nls('proximityAnalysisTypeTooltip')} showArrow placement='top'>
            <div className='setting-text-level-2 d-inline'>
              <InfoOutlined />
            </div>
          </Tooltip>
        </SettingRow>

        <SettingRow className={'mt-2'} flow='wrap'>
          <Label className='m-0 analysisTypeWidth' centric>
            <Radio role={'radio'} aria-label={this.nls(AnalysisTypeName.Summary)}
              className={'cursor-pointer'}
              value={this.nls(AnalysisTypeName.Summary)}
              onChange={() => { this.onAnalysisTypeChange(AnalysisTypeName.Summary) }}
              checked={this.state.analysisType === AnalysisTypeName.Summary} />
            <div tabIndex={0} className='ml-1 cursor-pointer text-break' onClick={() => { !(this.state.analysisType === AnalysisTypeName.Summary) && this.onAnalysisTypeChange(AnalysisTypeName.Summary) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  !(this.state.analysisType === AnalysisTypeName.Summary) && this.onAnalysisTypeChange(AnalysisTypeName.Summary)
                }
              }}>
              {this.nls(AnalysisTypeName.Summary)}
            </div>
          </Label>
          <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('summaryAnalysisTypeTooltip')}
            title={this.nls('summaryAnalysisTypeTooltip')} showArrow placement='top'>
            <div className='setting-text-level-2 d-inline'>
              <InfoOutlined />
            </div>
          </Tooltip>
        </SettingRow>

        {/* Proximity Analysis section */}
        {this.state.proximityAnalysisType && this.state.analysisType === AnalysisTypeName.Proximity &&
          <React.Fragment>
            <SettingRow label={this.nls('displayFieldLabel')} flow={'wrap'}>
              {this.createDisplayFieldOption(this.state.selectedFieldsDataSource[0])}
            </SettingRow>

            <SettingRow flow={'wrap'}>
              <Label tabIndex={0} aria-label={this.nls('sortFeaturesLabel')} title={this.nls('sortFeaturesLabel')}
                className='w-100 d-flex'>
                <div className='text-truncate flex-grow-1 setting-text-level-3'>
                  {this.nls('sortFeaturesLabel')}
                </div>
              </Label>
            </SettingRow>

            <SettingRow className={'mt-1 ml-4'} flow={'wrap'}>
              <Label className='m-0' centric>
                <Radio role={'radio'} aria-label={this.nls('distanceLabel')}
                  className={'cursor-pointer'}
                  value={'distanceLabel'}
                  onChange={() => { this.handleSortFeaturesOptionsChange(true) }}
                  checked={this.state.sortFeaturesByDistance} />
                <div tabIndex={0} className='ml-1 text-break cursor-pointer' onClick={() => { this.handleSortFeaturesOptionsChange(true) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      this.handleSortFeaturesOptionsChange(true)
                    }
                  }}>
                  {this.nls('distanceLabel')}
                </div>
              </Label>
            </SettingRow>

            <SettingRow className={'mt-2 ml-4'} flow={'wrap'}>
                <Label className='m-0' centric>
                  <Radio role={'radio'} aria-label={this.nls('field')}
                    className={'cursor-pointer'}
                    value={'field'}
                    onChange={() => { this.handleSortFeaturesOptionsChange(false) }}
                    checked={!this.state.sortFeaturesByDistance} />
                  <div tabIndex={0} className='ml-1 text-break cursor-pointer' onClick={() => { this.handleSortFeaturesOptionsChange(false) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      this.handleSortFeaturesOptionsChange(false)
                    }
                  }}>
                    {this.nls('field')}
                  </div>
                </Label>
            </SettingRow>

            {/* Sort Features */}
            {!this.state.sortFeaturesByDistance &&
              <List className='pt-4 pb-4'
                size='sm'
                itemsJson={Array.from(this.state.selectedFieldsDataSource)?.map((layer, index) => ({
                  itemStateDetailContent: layer,
                  itemKey: `${index}`
                }))}
                dndEnabled={false}
                overrideItemBlockInfo={({ itemBlockInfo }) => {
                  return {
                    name: TreeItemActionType.RenderOverrideItem,
                    children: [{
                      name: TreeItemActionType.RenderOverrideItemBody,
                      children: [{
                        name: TreeItemActionType.RenderOverrideItemMainLine
                      }]
                    }]
                  }
                }}
                renderOverrideItemMainLine={(actionData, refComponent) => {
                  const { itemJsons } = refComponent.props
                  const currentItemJson = itemJsons[0]
                  const listItemJsons = itemJsons[1] as any
                  return this.createSortFieldSelectorOption(currentItemJson.itemStateDetailContent, listItemJsons.indexOf(currentItemJson))
                }}
              />
            }

            <SettingRow label={this.nls('groupFeaturesLabel')}>
              <Switch role={'switch'} aria-label={this.nls('groupFeaturesLabel')} title={this.nls('groupFeaturesLabel')}
               checked={this.state.isGroupFeatures} onChange={this.groupFeaturesOnChange} />
            </SettingRow>

            {/* Group features */}
            {this.state.isGroupFeatures &&
              <React.Fragment>
                <List className='pt-4 pb-4'
                  size='sm'
                  itemsJson={Array.from(this.state.selectedFieldsDataSource)?.map((layer, index) => ({
                    itemStateDetailContent: layer,
                    itemKey: `${index}`
                  }))}
                  dndEnabled={false}
                  overrideItemBlockInfo={({ itemBlockInfo }) => {
                    return {
                      name: TreeItemActionType.RenderOverrideItem,
                      children: [{
                        name: TreeItemActionType.RenderOverrideItemBody,
                        children: [{
                          name: TreeItemActionType.RenderOverrideItemMainLine
                        }]
                      }]
                    }
                  }}
                  renderOverrideItemMainLine={(actionData, refComponent) => {
                    const { itemJsons } = refComponent.props
                    const currentItemJson = itemJsons[0]
                    const listItemJsons = itemJsons[1] as any
                    return this.createGroupFieldSelectorOption(currentItemJson.itemStateDetailContent, listItemJsons.indexOf(currentItemJson))
                  }}
                />

                <SettingRow label={this.nls('sortGroupsByCount')}>
                  <Switch role={'switch'} aria-label={this.nls('sortGroupsByCount')} title={this.nls('sortGroupsByCount')}
                    checked={this.state.isSortGroupsByCount} onChange={this.sortGroupsByCountOnChange} />
                </SettingRow>
              </React.Fragment>
            }
          </React.Fragment>
        }

        {/* Summary Analysis section */}
        {this.state.summaryAnalysisType && this.state.analysisType === AnalysisTypeName.Summary &&
          <React.Fragment>
            <div tabIndex={-1} className='pt-2 pb-1'>
              <div ref={this.addSummaryFieldsRef} tabIndex={0} aria-label={this.nls('addSummaryFields')} title={this.nls('addSummaryFields')} className='d-flex align-items-center add-summary-field'
                onClick={(e) => { this.onAddSummaryFieldsClick(e) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    this.onAddSummaryFieldsClick(e)
                  }
                }}>
                <div tabIndex={-1} className='add-summary-field-icon-container d-flex align-items-center justify-content-center mr-2'>
                  <Icon tabIndex={-1} icon={IconAdd} size={12} />
                </div>
                <div tabIndex={-1} className='pt-1 text-truncate flex-grow-1'>{this.nls('addSummaryFields')}</div>
              </div>
              {this.state.summaryFieldsList.length === 0 &&
                <Label tabIndex={0} aria-label={this.nls('addSummaryHintMsg')} className='font-italic w-100 d-flex'>
                  <div className='flex-grow-1 text-break setting-text-level-3'>
                    {this.nls('addSummaryHintMsg')}
                  </div>
                </Label>}
            </div>

            {/* Summary fields list */}
            {this.state.summaryFieldsList.length > 0 &&
              <div ref={this.summaryFieldsSidePopperTrigger} className={classNames('nearme-summary-fields-list-items', this.state.selectedLayerGeometry === 'esriGeometryPoint' ? 'pb-2' : '')}>
                <List
                  itemsJson={Array.from(this.state.summaryFieldsList || null)?.map((field, index) => ({
                    itemStateDetailContent: field,
                    itemKey: `${index}`
                  }))}
                  dndEnabled
                  onUpdateItem={(actionData, refComponent) => {
                    const { itemJsons } = refComponent.props
                    const [, parentItemJson] = itemJsons as [TreeItemType, TreeItemsType]
                    const newSortedSummaryFields = parentItemJson.map(item => {
                      return item.itemStateDetailContent
                    })
                    this.updateSortedSummaryFields(newSortedSummaryFields)
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
                    return this.createFieldsOptionElement(currentItemJson.itemStateDetailContent, listItemJsons.indexOf(currentItemJson))
                  }}
                />
              </div>
            }

            {!this.props.isActiveMapAreaSelected &&
              <React.Fragment>
                {(this.state.selectedLayerGeometry === 'esriGeometryPolyline' || this.state.selectedLayerGeometry === 'esriGeometryPolygon') &&
                  <SettingRow label={this.state.selectedLayerGeometry === 'esriGeometryPolyline'
                    ? this.nls('sumOfIntersectedLength')
                    : (this.state.selectedLayerGeometry === 'esriGeometryPolygon'
                        ? this.nls('sumOfIntersectedArea')
                        : '')}>

                    <Tooltip role={'tooltip'} tabIndex={0}
                      aria-label={this.state.selectedLayerGeometry === 'esriGeometryPolyline'
                        ? this.nls('sumOfLengthTooltip')
                        : (this.state.selectedLayerGeometry === 'esriGeometryPolygon'
                            ? this.nls('sumOfAreaTooltip')
                            : '')}
                      title={this.state.selectedLayerGeometry === 'esriGeometryPolyline'
                        ? this.nls('sumOfLengthTooltip')
                        : (this.state.selectedLayerGeometry === 'esriGeometryPolygon'
                            ? this.nls('sumOfAreaTooltip')
                            : '')} showArrow placement='top'>

                      <div className='setting-text-level-2 ml-2 d-inline'>
                        <InfoOutlined />
                      </div>
                    </Tooltip>
                  </SettingRow>
                }

                {this.state.selectedLayerGeometry === 'esriGeometryPolyline' &&
                  <div className={classNames('pb-2 d-flex align-items-center justify-content-between')}>
                    <Label title={this.state.sumOfLengthLabel} className='pt-2 pl-1 text-truncate cursor-pointer'>
                      <Checkbox className={'mr-2 font-13'} checked={this.state.sumOfLength}
                        role={'checkbox'} aria-label={this.nls('sumOfIntersectedLength')}
                        onChange={(e) => { this.onSumOfLengthChange(e, CommonSummaryFieldValue.SumOfIntersectedLength) }}
                      />
                      {this.state.sumOfLengthLabel}
                    </Label>
                    {this.state.sumOfLength && (
                      <Button role={'button'} aria-label={this.nls('edit')} title={this.nls('edit')} icon type={'tertiary'} aria-haspopup={'dialog'}
                        size={'sm'} onClick={() => { this.onSumOfLengthEditClick(CommonSummaryFieldValue.SumOfIntersectedLength) }}>
                        <EditOutlined size={'s'} />
                      </Button>
                    )}
                  </div>
                }

                {this.state.selectedLayerGeometry === 'esriGeometryPolygon' &&
                  <div className={classNames('pb-2 d-flex align-items-center justify-content-between')}>
                    <Label title={this.state.sumOfAreaLabel} className='pt-2 pl-1 text-truncate cursor-pointer'>
                      <Checkbox className={'mr-2 font-13'} checked={this.state.sumOfArea}
                        role={'checkbox'} aria-label={this.nls('sumOfIntersectedArea')}
                        onChange={(e) => { this.onSumOfAreaChange(e, CommonSummaryFieldValue.SumOfIntersectedArea) }}
                      />
                      {this.state.sumOfAreaLabel}
                    </Label>
                    {this.state.sumOfArea && (
                      <Button role={'button'} aria-label={this.nls('edit')} title={this.nls('edit')} icon type={'tertiary'} aria-haspopup={'dialog'}
                        size={'sm'} onClick={() => { this.onSumOfAreaEditClick(CommonSummaryFieldValue.SumOfIntersectedArea) }}>
                        <EditOutlined size={'s'} />
                      </Button>
                    )}
                  </div>
                }
              </React.Fragment>
            }

            {/* show color mode section only if at least one summary is present */}
            {((this.updateSummaryFieldListSettings?.length > 0 && !this.props.isActiveMapAreaSelected) || (this.state.summaryFieldsList?.length > 0 && this.props.isActiveMapAreaSelected)) &&
              <React.Fragment>
                <SettingRow className={classNames('pt-4', this.state.summaryFieldsList.length > 0 || (this.state.sumOfArea || this.state.sumOfLength) ? 'pt-2 nearme-divider' : '')}
                  label={this.nls('themeSettingColorMode')} flow='wrap'>
                </SettingRow>
                <SettingRow className={'mt-0'} flow='wrap'>
                  <Label className='mt-1 colorModesWidth' centric>
                    <Radio role={'radio'} aria-label={this.nls('singleColor')}
                      className={'cursor-pointer'}
                      value={'singleColor'}
                      onChange={() => { this.handleColorTypeChange(ColorMode.SingleColor) }}
                      checked={this.state.singleColorMode} />
                    <div tabIndex={0} className='ml-1 text-break cursor-pointer' onClick={() => { this.handleColorTypeChange(ColorMode.SingleColor) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          this.handleColorTypeChange(ColorMode.SingleColor)
                        }
                      }}>
                      {this.nls('singleColor')}
                    </div>
                  </Label>
                  {this.state.singleColorMode && (
                    <ThemeColorPicker specificTheme={getTheme2()} value={this.state.singleColorFields} onChange={(color) => { this.handleSingleColorChange(color) }} />
                  )}
                </SettingRow>
                <SettingRow className={'mt-0'} flow='wrap'>
                  <Label className='mt-1 mb-1 colorModesWidth' centric>
                    <Radio role={'radio'} aria-label={this.nls('byCategory')}
                      className={'cursor-pointer'}
                      value={'byCategory'}
                      onChange={() => { this.handleColorTypeChange(ColorMode.ByCategory) }}
                      checked={!this.state.singleColorMode} />
                    <div tabIndex={0} className='ml-1 text-break cursor-pointer' onClick={() => { this.handleColorTypeChange(ColorMode.ByCategory) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          this.handleColorTypeChange(ColorMode.ByCategory)
                        }
                      }}>
                      {this.nls('byCategory')}
                    </div>
                  </Label>
                  {!this.state.singleColorMode && (
                    <Button ref={this.colorButtonRef} role={'button'} aria-label={this.nls('byCategory')} title={this.nls('byCategory')} icon type={'tertiary'}
                      size={'sm'} onClick={this.handleByCategorySettingColorChange.bind(this)}>
                      <SettingOutlined />
                    </Button>
                  )}
                </SettingRow>
              </React.Fragment>
            }

            {/* Sidepopper for adding and editing summary fields */}
            <SidePopper isOpen={this.state.isAddNewSummaryField && !urlUtils.getAppIdPageIdFromUrl().pageId}
              position='right'
              toggle={this.closeAddSummaryFieldPanel}
              trigger={this.summaryFieldsSidePopperTrigger?.current}
              backToFocusNode={this.state.popperFocusNode}>
              <div className='bg-light-300 border-color-gray-400' css={getSidePanelStyle(this.props.theme)}>
                <SidepopperBackArrow
                  theme={this.props.theme}
                  intl={this.props.intl}
                  title={this.state.summaryEditIndex !== null ? this.nls('editSummaryField') : this.nls('addSummaryFields')}
                  ref={this.backRef}
                  onBack={this.closeAddSummaryFieldPanel}>
                      <SummaryFieldPopper
                        intl={this.props.intl}
                        theme={this.props.theme}
                        widgetId={this.props.widgetId}
                        currentLayerDsId={this.props.editCurrentLayer}
                        fieldsEditIndex={this.state.summaryEditIndex}
                        editingField={this.state.summaryEditField}
                        expressionInfoUpdate={this.onExpressionInfoUpdate.bind(this)}
                      />
                </SidepopperBackArrow>
              </div>
            </SidePopper>

            {/* Sidepopper for editing summary fields color */}
            <SidePopper isOpen={this.state.showSummaryColorSettings && !urlUtils.getAppIdPageIdFromUrl().pageId} position='right' toggle={this.closeColorSettingsPanel} trigger={this.colorSidePopperTrigger?.current}>
              <div className='bg-light-300 border-color-gray-400' css={getSidePanelStyle(this.props.theme)}>
                <SidepopperBackArrow
                  theme={this.props.theme}
                  intl={this.props.intl}
                  title={this.nls('summaryFieldColor')}
                  ref={this.backRef}
                  onBack={this.closeColorSettingsPanel}>
                  <div className={'setting-container'}>
                    <ColorSettingPopper
                      intl={this.props.intl}
                      theme={this.props.theme}
                      summaryFieldsInfo={this.props.isActiveMapAreaSelected ? this.state.summaryFieldsList : this.updateSummaryFieldListSettings}
                      colorstripValue={this.state.colorstripValues}
                      updateFieldColorsValues={this.onUpdateFieldColorByCategory}
                    />
                  </div>
                </SidepopperBackArrow>
              </div>
            </SidePopper>

            {/* Dialog for editing default summary fields */}
            {this.state.editSummaryAreaLengthFieldPopupOpen &&
              <EditSummaryIntersectedFieldsPopper
                theme={this.props.theme}
                intl={this.props.intl}
                isOpen={this.state.editSummaryAreaLengthFieldPopupOpen}
                editSummaryFields={this.state.summaryEditField}
                sumOfIntersectedFieldPopupTitle={this.state.sumOfIntersectedFieldPopupTitle}
                onClose={this.onEditPopperClose}
                onOkClick={this.onOkButtonClick}>
              </EditSummaryIntersectedFieldsPopper>
            }
          </React.Fragment>
        }

        {/* highlight results on map settings */}
        {!this.props.isActiveMapAreaSelected &&
          <React.Fragment>
            <SettingRow label={this.nls('highlightResultsOnMapLabel')}>
              <Switch role={'switch'} aria-label={this.nls('highlightResultsOnMapLabel')} title={this.nls('highlightResultsOnMapLabel')}
                checked={this.state.highlightResultsOnMap} onChange={this.highlightResultsOnMapOnChange} />
            </SettingRow>
            {this.state.highlightResultsOnMap &&
              <SettingRow label={this.nls('highlightColorLabel')}>
                <ThemeColorPicker specificTheme={getTheme2()} value={this.state.highlightColorOnMap ? this.state.highlightColorOnMap : defaultHighlightResultsColor}
                  onChange={(color) => { this.onHighlightColorOnMapChange(color) }} />
              </SettingRow>
            }
          </React.Fragment>
        }

        {/* expand on open settings */}
        <SettingRow label={this.nls('expandOnOpen')}>
          <Switch role={'switch'} aria-label={this.nls('expandOnOpen')} title={this.nls('expandOnOpen')}
            checked={this.state.expandOnOpen} onChange={this.expandListOnChange} />
        </SettingRow>

        {/*expand feature details settings */}
        {(this.state.proximityAnalysisType && this.state.expandOnOpen) &&
          <SettingRow flow='wrap'>
            <Label title={this.nls('expandFeatureDetails')} className='m-0 w-100' centric>
              <Checkbox className={'mr-2 font-13'} checked={this.state.expandFeatureDetails}
                role={'checkbox'} aria-label={this.nls('expandFeatureDetails')}
                onChange={(e) => { this.expandFeatureOnChange(e) }}
              />
              <div className='ml-1 w-100 text-break' onClick={(e: any) => {
                //if div is clicked then don't propagate its click event
                //in order to not change the state of checkbox on blank area click
                if (e.target.tagName.toLowerCase() !== 'span') {
                  e.preventDefault()
                }
              }}>
                <span className={'cursor-pointer'}>
                  {this.nls('expandFeatureDetails')}
                </span>
              </div>
              <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('expandListTooltip')}
                title={this.nls('expandListTooltip')} showArrow placement='top'>
                <div className='setting-text-level-2 d-inline' onClick={(e) => { e.preventDefault() }}>
                  <InfoOutlined />
                </div>
              </Tooltip>
            </Label>
          </SettingRow>
        }
      </SettingSection>
    </div>
  }
}
