/* eslint-disable no-prototype-builtins */
/** @jsx jsx */
import { type JimuMapView, JimuMapViewComponent, geometryUtils, type FeatureLayerDataSource, MapViewManager } from 'jimu-arcgis'
import {
  React, type AllWidgetProps, jsx, BaseWidget, type ImmutableObject, getAppStore, OrderRule, lodash,
  type DataRecord, DataSourceManager, type DataSource, WidgetState, type IMState, type UseDataSource,
  DataActionManager, Immutable, DataSourceTypes, ReactResizeDetector, DataLevel, type QueryParams, type QueriableDataSource, DataSourceStatus, dataSourceUtils, JimuFieldType, type IMDataSourceSchema,
  MessageManager, DataRecordsSelectionChangeMessage, urlUtils
} from 'jimu-core'
import { type IconComponentProps, Loading, LoadingType, WidgetPlaceholder, utils, Alert, Label, Button, defaultMessages as jimuUIDefaultMessages, ConfirmDialog } from 'jimu-ui'
import { type SearchSettings, type AnalysisSettings, type GeneralSettings, type IMConfig, type LayersInfo, type SumOfAreaLengthParam, AnalysisTypeName, type SummaryFieldsInfo, type SummaryAttributes } from '../config'
import defaultMessages from './translations/default'
import { getStyle } from './lib/style'
import LayerAccordion from './components/layer-accordion'
import AoiTool, { type AoiGeometries } from './components/aoi-tool'
import { getAllAvailableLayers, getDisplayField, getPortalUnit, getSelectedLayerInstance, getSearchWorkflow, getOutputDsId } from '../common/utils'
import { getALLFeatures } from '../common/query-feature-utils'
import FeatureSet from './components/features-set'
import { distanceUnitWithAbbr } from './constant'
import { getDistance } from '../common/closest-distance-utils'
import geometryEngine from 'esri/geometry/geometryEngine'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import type Geometry from 'esri/geometry/Geometry'
import { getHighLightSymbol } from '../common/highlight-symbol-utils'
import { type FormatNumberOptions } from 'react-intl'
import { CommonSummaryFieldValue, NumberFormatting, defaultHighlightResultsColor, transparentColor } from '../setting/constants'
import { RefreshOutlined } from 'jimu-icons/outlined/editor/refresh'
import { TrashOutlined } from 'jimu-icons/outlined/editor/trash'
import FeatureLayer from 'esri/layers/FeatureLayer'
import Graphic from 'esri/Graphic'
import SummaryResult from './components/summary-result'
import { versionManager } from '../version-manager'

const widgetIcon = require('./assets/icons/nearme-icon.svg')
const closestIconComponent = require('jimu-icons/svg/outlined/gis/service-find-closest.svg')
const proximityIconComponent = require('jimu-icons/svg/outlined/gis/service-proximity.svg')
const summaryComponent = require('jimu-icons/svg/outlined/gis/service-summarize-within.svg')

interface ExtraProps {
  selectedIncidentLocation: DataRecord[]
  selectedDataSource: DataSource
}

interface State {
  jimuMapView: JimuMapView
  searchSettings: SearchSettings
  analysisSettings: ImmutableObject<AnalysisSettings>
  activeDataSource: string
  generalSettings: GeneralSettings
  aoiGeometries: AoiGeometries
  displayLayerAccordion: JSX.Element[]
  isClosestAddressShowing: boolean
  isMapAreaWarningMsgShowing: boolean
  listMaxHeight: string
  noResultsFoundMsg: string
  showNoResultsFoundMsg: boolean
  msgActionGeometry: __esri.Geometry
  showExportButton: boolean
  isLayerAvailable: boolean
  isAnalysisLayerConfigured: boolean
  widgetWidth: number
  loadingAllFeaturesFromDs: boolean
  promptForDataAction: boolean
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig> & ExtraProps, State> {
  //all required graphics layers for the widget
  public drawingLayer: __esri.GraphicsLayer
  public bufferLayer: __esri.GraphicsLayer
  public flashLayer: __esri.GraphicsLayer
  public highlightGraphicsLayers: __esri.GraphicsLayer[]
  public featuresByDsId: any
  public closestFeaturesByIndexAndDsId: any
  public mapView: __esri.MapView | __esri.SceneView
  public portalUnit: string
  public activeCurrentDs: string
  public availableLayersIds: string[]
  public readonly divRef: React.RefObject<HTMLDivElement>
  public geometriesFromAction: any
  public actionTimeout: any
  private filtersAppliedOnDsId: string[]
  aoiToolRef = React.createRef<AoiTool>()
  private selectedPopupContainer: HTMLDivElement | null
  private selectedRecordsKey: string
  private selectedRecord: DataRecord

  static versionManager = versionManager
  static mapExtraStateProps = (state: IMState,
    props: AllWidgetProps<IMConfig>): ExtraProps => {
    return {
      selectedIncidentLocation: props?.mutableStateProps?.selectedIncidentLocation,
      selectedDataSource: props?.mutableStateProps?.selectedDataSource
    }
  }

  constructor (props) {
    super(props)
    this.divRef = React.createRef()
    this.featuresByDsId = {}
    this.closestFeaturesByIndexAndDsId = {}
    this.highlightGraphicsLayers = []
    this.geometriesFromAction = {}
    this.actionTimeout = null
    this.filtersAppliedOnDsId = []
    this.selectedPopupContainer = null
    this.selectedRecordsKey = ''
    this.selectedRecord = null
    this.state = {
      jimuMapView: null,
      searchSettings: null,
      activeDataSource: null,
      analysisSettings: null,
      generalSettings: this.props.config.generalSettings,
      aoiGeometries: null,
      displayLayerAccordion: [],
      isClosestAddressShowing: false,
      isMapAreaWarningMsgShowing: false,
      listMaxHeight: '',
      noResultsFoundMsg: this.props.config.generalSettings.noResultsFoundText !== '' ? this.props.config.generalSettings.noResultsFoundText : this.nls('noDataMessageDefaultText'),
      showNoResultsFoundMsg: false,
      msgActionGeometry: null,
      showExportButton: this.props.enableDataAction !== undefined ? this.props.enableDataAction : true,
      isLayerAvailable: true,
      isAnalysisLayerConfigured: true,
      widgetWidth: null,
      loadingAllFeaturesFromDs: false,
      promptForDataAction: false
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

  componentDidMount = () => {
    if (this.props.mutableStatePropsVersion?.selectedDataSource && this.props.selectedDataSource) {
      this.setState({
        promptForDataAction: true
      })
    } else if (this.props.mutableStatePropsVersion?.selectedIncidentLocation) {
      this.geometriesByDsIdFromAction(this.props?.selectedIncidentLocation)
    }
  }

  /**
   * Check the current config property or runtime property changed in live view
   * @param prevProps previous property
   * @param prevState previous state
   */
  componentDidUpdate = (prevProps, prevState) => {
    const currentWidgetState = getAppStore()?.getState()?.widgetsRuntimeInfo[this.props.id]?.state
    if (currentWidgetState === WidgetState.Opened || !currentWidgetState) {
      //check for feature selected using message action
      // if featureRecord found and prev selected record is not matching with the current then only load the analysis info for selected feature location
      if (this.props?.selectedIncidentLocation) {
        const geometriesByDsId: any = this.props?.selectedIncidentLocation
        if (geometriesByDsId && (!prevProps || !prevProps.mutableStatePropsVersion || !prevProps.mutableStatePropsVersion.selectedIncidentLocation ||
          prevProps?.mutableStatePropsVersion?.selectedIncidentLocation !== this.props.mutableStatePropsVersion?.selectedIncidentLocation)) {
          this.geometriesByDsIdFromAction(geometriesByDsId)
        }
      } if (this.props?.selectedDataSource) {
        if ((!prevProps || !prevProps.mutableStatePropsVersion || !prevProps.mutableStatePropsVersion.selectedDataSource ||
          prevProps?.mutableStatePropsVersion?.selectedDataSource !== this.props.mutableStatePropsVersion?.selectedDataSource)) {
          this.setState({
            promptForDataAction: true
          })
        }
      }
    }

    //if map is changed, then get the updated active jimuMapView or if map gets undo/redo
    if (prevProps.useMapWidgetIds !== this.props.useMapWidgetIds) {
      const jimuMapView = MapViewManager.getInstance().getJimuMapViewById(this.state.jimuMapView?.id)
      if (jimuMapView) {
        this.setState({
          jimuMapView: jimuMapView
        })
      }
    }

    //check if active datasource is changed
    if (prevState.state?.activeDataSource !== this.state.activeDataSource) {
      this.setState({
        activeDataSource: this.state.activeDataSource
      })
    }

    //check if the search settings are changed
    if (this.state.activeDataSource) {
      const currentActiveDsConfig = this.props.config.configInfo?.[this.state.activeDataSource]
      const prevActiveDsConfig = prevProps.config.configInfo?.[this.state.activeDataSource]
      if (!lodash.isDeepEqual(prevActiveDsConfig?.searchSettings, currentActiveDsConfig?.searchSettings)) {
        if (this.didSearchSettingsChanged(prevActiveDsConfig?.searchSettings, currentActiveDsConfig?.searchSettings)) {
          //clear incident/buffer geometries if any search settings changed except heading label
          this.setState({
            aoiGeometries: null,
            searchSettings: currentActiveDsConfig?.searchSettings
          }, () => {
            this.isValidLayerConfigured()
            const { showAllFeatures } = getSearchWorkflow(this.state.searchSettings)
            if (showAllFeatures && this.state.jimuMapView) {
              this.onClear()
              this.queryLayers()
              this.resizeLayerListHeight()
            } else {
              this.setState({
                showNoResultsFoundMsg: false,
                displayLayerAccordion: []
              })
            }
          })
        } else {
          //only heading label is changed
          this.setState({
            searchSettings: currentActiveDsConfig?.searchSettings
          }, () => {
            this.resizeLayerListHeight()
          })
        }
      }

      //check if analysis settings is changed
      if (this.didAnalysisSettingsChanged(prevActiveDsConfig?.analysisSettings?.layersInfo,
        currentActiveDsConfig?.analysisSettings?.layersInfo) ||
        prevActiveDsConfig?.analysisSettings?.displayAnalysisIcon !== currentActiveDsConfig?.analysisSettings?.displayAnalysisIcon ||
        prevActiveDsConfig?.analysisSettings?.displayFeatureCount !== currentActiveDsConfig?.analysisSettings?.displayFeatureCount ||
        prevActiveDsConfig?.analysisSettings?.displayMapSymbols !== currentActiveDsConfig?.analysisSettings?.displayMapSymbols ||
        prevActiveDsConfig?.analysisSettings?.showDistFromInputLocation !== currentActiveDsConfig?.analysisSettings?.showDistFromInputLocation ||
        prevActiveDsConfig?.analysisSettings?.onlyShowLayersResult !== currentActiveDsConfig?.analysisSettings?.onlyShowLayersResult) {
        this.setState({
          analysisSettings: currentActiveDsConfig?.analysisSettings
        }, () => {
          this.isValidLayerConfigured()
          // if only show layers results changed update the filter according to current state
          if (this.state.analysisSettings?.onlyShowLayersResult !== prevState.analysisSettings?.onlyShowLayersResult) {
            this.onOnlyShowLayerResultsChanged()
          } else if (this.isLayerQueryNeeded(prevActiveDsConfig?.analysisSettings?.layersInfo,
            currentActiveDsConfig?.analysisSettings?.layersInfo)) {
            this.queryLayers()
          } else {
            this.displayAnalysisLayerInfo()
          }
        })
      }
    }

    //check if general settings is changed
    if (!lodash.isDeepEqual(prevProps.config.generalSettings, this.props.config.generalSettings)) {
      this.setState({
        generalSettings: this.props.config.generalSettings
      })
    }

    //check if enable data section props is changed
    if (prevProps.enableDataAction !== this.props.enableDataAction) {
      this.setState({
        showExportButton: this.props.enableDataAction
      }, () => {
        this.displayAnalysisLayerInfo()
      })
    }

    //update the highlight bar in popup details
    if (this.selectedPopupContainer && prevProps.theme?.colors?.primary !== this.props.theme?.colors?.primary) {
      this.selectedPopupContainer.style.borderColor = this.props.theme?.colors?.primary
    }

    //On font size percentage change update the list to avoid double scrollbar
    if (prevProps.theme.typography.fontSizeRoot !== this.props.theme.typography.fontSizeRoot) {
      this.resizeLayerListHeight()
    }
  }

  /**
   * On widget delete clear all the graphics from the map
   */
  componentWillUnmount = () => {
    this.onClear()
  }

  /**
   * Get all features from datasource and each geometries by ds id from action
   */
  getAllFeaturesFromSelectedDs = () => {
    const geometriesByDsId = {}
    let dsID: string = ''
    dsID = this.props.selectedDataSource?.id
    if (!geometriesByDsId[dsID]) {
      geometriesByDsId[dsID] = []
    }
    this.setState({
      loadingAllFeaturesFromDs: true
    }, () => {
      getALLFeatures(this.props.selectedDataSource, null, true, this.state.jimuMapView.view.spatialReference).then((features) => {
        if (features?.length > 0) {
          features.forEach((eachFeature: any) => {
            geometriesByDsId[dsID].push(eachFeature.feature.geometry)
          })
          this.geometriesByDsIdFromAction(geometriesByDsId)
        } else {
          this.setState({
            loadingAllFeaturesFromDs: false
          })
        }
      }, () => {
        this.setState({
          loadingAllFeaturesFromDs: false
        })
      })
    })
  }

  /**
   * On Proceed button click close the prompt and get all the features and perform the analysis
   */
  analyzeAllFeatures = () => {
    this.setState({
      promptForDataAction: false
    })
    this.getAllFeaturesFromSelectedDs()
  }

  /**
   * On prompt close button click do not perform any process
   */
  onCancelButtonClicked = () => {
    this.setState({
      promptForDataAction: false,
      loadingAllFeaturesFromDs: false
    })
  }

  /**
   * Set the multiple features selected by other widgets as a set location in NM
   * @param selectedGeometriesByDsId selected feature geometry from action
   */
  geometriesByDsIdFromAction = (selectedGeometriesByDsId) => {
    const dsIds = Object.keys(selectedGeometriesByDsId)
    //Get the keys of each selected geometries and
    //loop through the array of datasource id and assign geometry of selected features to the class level variable
    dsIds.forEach((dsId) => {
      this.geometriesFromAction[dsId] = selectedGeometriesByDsId[dsId]
    })
    if (this.actionTimeout) {
      clearTimeout(this.actionTimeout)
    }
    this.actionTimeout = setTimeout(async () => {
      const geometryByTypes = {
        point: [],
        polyline: [],
        polygon: []
      }
      const uniqueGeometryTypes = []
      const dsIds = Object.keys(this.geometriesFromAction)
      const dsManager = DataSourceManager.getInstance()
      //1. create array of unique geometry types
      //2. create object of geometries by geometry type
      dsIds.forEach((dsId) => {
        const dataSource = dsManager?.getDataSource(dsId)
        const geometryType = dataSourceUtils.changeRestAPIGeometryTypeToJSAPIGeometryType(dataSource.getGeometryType())
        if (!uniqueGeometryTypes.includes(geometryType)) {
          uniqueGeometryTypes.push(geometryType)
        }
        geometryByTypes[geometryType] = geometryByTypes[geometryType].concat(this.geometriesFromAction[dsId])
      })
      let unionGeometry = null
      //If all the geometries are of one type
      if (uniqueGeometryTypes.length === 1) {
        //If multiple features are selected then get the union of all the geometries else get the only one selected geometry
        if (geometryByTypes[uniqueGeometryTypes[0]].length > 1) {
          unionGeometry = geometryEngine.union(geometryByTypes[uniqueGeometryTypes[0]]) //union
        } else {
          unionGeometry = geometryByTypes[uniqueGeometryTypes[0]][0]
        }
      } else if (uniqueGeometryTypes.length > 1) {
        //If geometries with different types are selected, create buffer for all the points and lines geometries
        //and then union the buffer geometries with selected polygon geometry.
        //As a result we will get only one polygon geometry at the end
        const pointLineArray = geometryByTypes.point.concat(geometryByTypes.polyline)
        const bufferGeometry: any = await geometryUtils.createBuffer(pointLineArray, [0.1], 'meters')
        const allPolygonsArray = bufferGeometry.concat(geometryByTypes.polygon)
        unionGeometry = geometryEngine.union(allPolygonsArray) //union
      }
      this.recordSelectedFromAction(unionGeometry)
      this.geometriesFromAction = {}
    }, 1000)
  }

  /**
   * Once received the features from RecordSelectionChange or after searching in the search tool of the map
   * set it in the state and the analysis will be performed using it
   * @param featureRecordGeometry selected feature record geometry
   */
  recordSelectedFromAction = async (featureRecordGeometry: any) => {
    //whenever record is selected, perform the action only when search by location is enabled,
    //in case of show all features and show features in current map area, skip the selection
    const { searchByLocation } = getSearchWorkflow(this.state.searchSettings)
    if (searchByLocation) {
      const mapSR = this.state.jimuMapView?.view?.spatialReference
      if (mapSR) {
        const projectedGeometries = await geometryUtils.projectToSpatialReference([featureRecordGeometry], mapSR)
        if (projectedGeometries?.length > 0 && projectedGeometries[0]) {
          this.setState({
            msgActionGeometry: projectedGeometries[0]
          })
        }
      }
    }
  }

  /**
   * check valid analysis layers are configured or not based on search settings
   */
  isValidLayerConfigured = () => {
    let validLayers: Immutable.ImmutableArray<LayersInfo>
    //filter closest analysis in case of current map extent or show all features
    const { showAllFeatures, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)
    if ((showAllFeatures || searchCurrentExtent) && this.state.analysisSettings?.layersInfo?.length > 0) {
      validLayers = this.state.analysisSettings?.layersInfo.filter((layerInfo: any) => {
        const analysisType = layerInfo.analysisInfo.analysisType
        return analysisType === AnalysisTypeName.Proximity || analysisType === AnalysisTypeName.Summary
      })
    }
    if (validLayers) {
      ///define search is off or search by map area is on and proximity and summary layers also configured
      this.setState({
        isAnalysisLayerConfigured: validLayers?.length > 0
      })
    } else {
      this.setState({
        isAnalysisLayerConfigured: this.state.analysisSettings?.layersInfo?.length > 0
      }, () => {
        //clear all highlights, geometries.... no analysis layer is configured
        if (!this.state.isAnalysisLayerConfigured) {
          this.onClear()
        }
      })
    }
  }

  /**
   * check analysis Settings Changed or not
   * @param prevSettings old props
   * @param newSettings new props
   * @returns  boolean analysis Settings Change true or false
   */
  didAnalysisSettingsChanged = (prevSettings, newSettings): boolean => {
    let analysisSettingsChange = false
    //eslint-disable-next-line
    newSettings?.some((newSettings, index: number) => {
      if (!prevSettings || newSettings.useDataSource.dataSourceId !== prevSettings[index]?.useDataSource.dataSourceId ||
        newSettings.label !== prevSettings[index]?.label ||
        !lodash.isDeepEqual(newSettings.analysisInfo, prevSettings[index]?.analysisInfo)) {
        analysisSettingsChange = true
        return true
      }
    })
    return newSettings?.length !== prevSettings?.length ? true : analysisSettingsChange
  }

  /**
   * check search Settings Changed or not
   * @param prevSearchSettings old search settings
   * @param newSearchSettings new searchSettings props
   * @returns  boolean search Settings Change true or false
  */
  didSearchSettingsChanged = (prevSearchSettings: SearchSettings, newSearchSettings: SearchSettings): boolean => {
    let searchSettingsChange = false
    if (!prevSearchSettings || !newSearchSettings || newSearchSettings.includeFeaturesOutsideMapArea !== prevSearchSettings.includeFeaturesOutsideMapArea ||
      newSearchSettings.bufferDistance !== prevSearchSettings.bufferDistance ||
      newSearchSettings.distanceUnits !== prevSearchSettings.distanceUnits ||
      newSearchSettings.searchByActiveMapArea !== prevSearchSettings.searchByActiveMapArea) {
      searchSettingsChange = true
      return true
    }
    return searchSettingsChange
  }

  /**
  * check layer query is needed or not based on analysis settings parameter change(dataSourceId,type,analysis settings length)
  * @param prevSettings old props
  * @param newSettings new props
  * @returns  boolean analysis Settings (dataSourceId,type,analysis settings length) Change true or false
  */
  isLayerQueryNeeded = (prevSettings, newSettings): boolean => {
    let analysisSettingsChange = false
    //eslint-disable-next-line
    newSettings?.some((newSettings, index: number) => {
      if (!prevSettings || newSettings.useDataSource.dataSourceId !== prevSettings[index]?.useDataSource.dataSourceId) {
        analysisSettingsChange = true
        return true
      }
    })
    return newSettings?.length !== prevSettings?.length ? true : analysisSettingsChange
  }

  /**
   * Wait for all the jimu layers and dataSource loaded
   * @param jmv JimuMapView
   * @returns data source
   */
  waitForChildDataSourcesReady = async (jmv: JimuMapView): Promise<DataSource> => {
    await jmv?.whenAllJimuLayerViewLoaded()
    const ds = DataSourceManager.getInstance().getDataSource(jmv?.dataSourceId)
    if (ds?.isDataSourceSet && !ds.areChildDataSourcesCreated()) {
      return ds.childDataSourcesReady().then(() => ds).catch(err => ds)
    }
    return Promise.resolve(ds)
  }

  /**
   * handles map view change event
   * @param jimuMapView active map view
   */
  onActiveViewChange = async (jimuMapView: JimuMapView) => {
    this.availableLayersIds = []
    if (!(jimuMapView && jimuMapView.view)) {
      this.setState({
        isLayerAvailable: false,
        loadingAllFeaturesFromDs: false
      })
      return
    }
    this.waitForChildDataSourcesReady(jimuMapView).finally(() => {
      getAllAvailableLayers(jimuMapView.id).then((allDsLayers) => {
        if (allDsLayers.length > 0) {
          allDsLayers.forEach((layer) => {
            this.availableLayersIds.push(layer.id)
          })
          this.setState({
            isLayerAvailable: true
          })
        } else {
          this.setState({
            isLayerAvailable: false
          })
        }
        this.mapView = jimuMapView.view
        if (this.state.jimuMapView) {
          this.onClear()
          this.setState({
            analysisSettings: null
          })
        }
        if (jimuMapView) {
          //Check for the search tool from the map, and handle the select-result event
          //so that if anything is searched in the tool we can use that location as incident geometry
          jimuMapView.jimuMapTools?.forEach((tools) => {
            if (tools?.instance && tools.name === 'Search') {
              tools.instance.on('select-result', (selection) => {
                if (selection?.result?.feature?.geometry) {
                  this.recordSelectedFromAction(selection.result.feature.geometry)
                }
              })
            }
          })
          this.setState({
            jimuMapView: jimuMapView
          }, () => {
            this.createGraphicsLayers()
            if (jimuMapView.dataSourceId === null) {
              this.setState({
                activeDataSource: null
              })
            } else if (this.state.jimuMapView.dataSourceId || this.props.config.configInfo[this.state.jimuMapView.dataSourceId]) {
              this.setState({
                activeDataSource: this.state.jimuMapView.dataSourceId
              }, () => {
                this.setConfigForDataSources()
              })
            } else if (this.state.jimuMapView.dataSourceId &&
              this.props.config.configInfo[this.state.jimuMapView.dataSourceId]) {
              let configDs = this.state.jimuMapView.dataSourceId
              if (this.state.jimuMapView && this.state.jimuMapView.dataSourceId) {
                if (this.props.config.configInfo.hasOwnProperty(this.state.jimuMapView.dataSourceId)) {
                  configDs = this.state.jimuMapView.dataSourceId
                } else {
                  configDs = null
                }
                this.setState({
                  activeDataSource: configDs
                }, () => {
                  this.setConfigForDataSources()
                })
              }
            }
          })
        }
      })
    })
  }

  /**
   * Set the configured settings for the respective datasource
   */
  setConfigForDataSources = () => {
    if (this.state.jimuMapView.dataSourceId !== '') {
      const activeDsConfig = this.props.config.configInfo[this.state.jimuMapView.dataSourceId]
      this.setState({
        searchSettings: activeDsConfig?.searchSettings,
        analysisSettings: activeDsConfig?.analysisSettings
      }, () => {
        this.isValidLayerConfigured()
        const { showAllFeatures } = getSearchWorkflow(this.state.searchSettings)
        //only in case of show all features query the layers once the active data source is changed
        if (showAllFeatures && this.state.jimuMapView && this.state.analysisSettings) {
          this.queryLayers()
          this.resizeLayerListHeight()
        }
      })
    }
  }

  /**
   * handles aoiComplete event of aoi-tool component
   * @param aoiGeometries current aoi(buffer/incident) geometries
   */
  onAoiComplete = (aoiGeometries: AoiGeometries) => {
    this.featuresByDsId = {}
    this.closestFeaturesByIndexAndDsId = {}
    this.setState({
      aoiGeometries: aoiGeometries
    }, () => {
      this.queryLayers()
    })
  }

  /**
   * handles clear event of aoi-tool component, clears aoiGeometries state
   */
  onClear = () => {
    this.destroyHighlightGraphicsLayer()
    this.flashLayer?.removeAll()
    this.featuresByDsId = {}
    this.closestFeaturesByIndexAndDsId = {}
    this.resetFilters()
    this.clearMessageAction()
    this.props?.outputDataSources?.forEach((outputDsId) => {
      this.getOutputDataSource(outputDsId)?.setStatus(DataSourceStatus.NotReady)
    })
    this.setState({
      aoiGeometries: null,
      displayLayerAccordion: [],
      isClosestAddressShowing: false,
      msgActionGeometry: null,
      showNoResultsFoundMsg: false
    })
  }

  /**
   * Handles refresh button clicked event and refresh the result with same AOI
   */
  onRefreshResult = () => {
    this.destroyHighlightGraphicsLayer()
    this.flashLayer?.removeAll()
    this.featuresByDsId = {}
    this.closestFeaturesByIndexAndDsId = {}
    this.resetFilters()
    this.clearMessageAction()
    this.props?.outputDataSources?.forEach((outputDsId) => {
      this.getOutputDataSource(outputDsId)?.setStatus(DataSourceStatus.NotReady)
    })
    this.queryLayers()
  }

  /**
   * get analysis type icon for layer
   * @param analysisType analysis type
   * @returns analysis type icon
   */
  getAnalysisTypeIcon = (analysisType: string): IconComponentProps => {
    let analysisTypeIcon: IconComponentProps
    if (analysisType === AnalysisTypeName.Closest) {
      analysisTypeIcon = closestIconComponent
    }
    if (analysisType === AnalysisTypeName.Proximity) {
      analysisTypeIcon = proximityIconComponent
    }
    if (analysisType === AnalysisTypeName.Summary) {
      analysisTypeIcon = summaryComponent
    }
    return analysisTypeIcon
  }

  /**
   * get the features distance using distance units
   * @param selectedFeatures selected features on the map
   * @returns selected features
   */
  getFeaturesDistance = (selectedFeatures: DataRecord[]) => {
    const { showAllFeatures, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)
    const portalUnit = getPortalUnit()
    //Use portal unit in case of show all features OR search by extent
    const distanceUnit = showAllFeatures || searchCurrentExtent
      ? portalUnit
      : this.state.aoiGeometries.distanceUnit || this.state.searchSettings.distanceUnits || portalUnit
    const incidentGeometry = this.state.aoiGeometries.incidentGeometry4326 || this.state.aoiGeometries.incidentGeometry
    const featureRecordsWithDistance = selectedFeatures
    for (let i = 0; i < featureRecordsWithDistance.length; i++) {
      const featureRecord = featureRecordsWithDistance as any
      if (incidentGeometry && featureRecord[i].feature.geometry) {
        featureRecord[i].feature.distance = getDistance(incidentGeometry,
          featureRecord[i].feature.geometry, distanceUnit as __esri.LinearUnits)
      } else {
        featureRecord[i].feature.distance = 0
      }
    }
    return featureRecordsWithDistance
  }

  /**
   * Get the sorted features
   * @param selectedFeatures selected features on the map
   * @param layerInfo analysis layers info
   * @param isShowAllFeatures show all features parameter
   * @param objectIdField field of the layer
   * @returns selected features and group features
   */
  getSortedFeatures = (selectedFeatures: DataRecord[], layerInfo: LayersInfo, isSortByObjId: boolean, objectIdField?: string) => {
    let sortingField = 'distance'
    let groupEnabled = false
    let sortByFieldEnabled = false
    let groupField = ''
    let groupsArr = []
    const layerAnalysisInfo = layerInfo.analysisInfo as any
    if (layerAnalysisInfo.analysisType === AnalysisTypeName.Proximity) {
      if (!layerAnalysisInfo.sortFeaturesByDistance && layerAnalysisInfo.sortFeatures?.sortFeaturesByField) {
        sortingField = layerAnalysisInfo.sortFeatures.sortFeaturesByField
        sortByFieldEnabled = true
      }
      if (layerAnalysisInfo.groupFeaturesEnabled && layerAnalysisInfo.groupFeatures.groupFeaturesByField !== '') {
        groupEnabled = true
        groupField = layerAnalysisInfo.groupFeatures.groupFeaturesByField
      }
    }
    //For show all features and search by map area if sort by distance is enabled then sort proximity features by objectId
    if (layerAnalysisInfo.analysisType === AnalysisTypeName.Proximity && isSortByObjId && !sortByFieldEnabled) {
      sortingField = objectIdField
    }
    if (groupEnabled) {
      for (let i = 0; i < selectedFeatures.length; i++) {
        const featureRecord = selectedFeatures[i] as any
        const featureValue = featureRecord.feature.attributes[groupField]
        const groupLabel = featureRecord.getFormattedFieldValue(groupField, this.props.intl)
        const gId = 'group_' + layerInfo.useDataSource.dataSourceId + '_' + groupField + '_' + featureValue
        let addGroup = true
        let group
        if (groupsArr.length > 0) {
          for (let j = 0; j < groupsArr.length; j++) {
            const groupInfo = groupsArr[j]
            if (gId === groupInfo.id) {
              if (featureValue === groupInfo.value) {
                addGroup = false
                group = groupInfo
                break
              }
            }
          }
        }
        if (addGroup) {
          groupsArr.push({
            id: gId,
            value: featureValue,
            count: 1,
            label: groupLabel
          })
        } else {
          groupsArr.forEach(g => {
            if (g.id === (gId)) {
              group = g
            }
          })
          group.count += 1
        }
      }
    }

    if (groupEnabled && groupsArr.length > 0) {
      let groupSortingField = ''
      if (layerAnalysisInfo.sortGroupsByCount) {
        groupSortingField = 'count'
      } else {
        groupSortingField = 'value'
      }
      const groups = this.divideGroupsByEmptyValue(groupsArr, groupSortingField)
      groupsArr = groups.groupsWithNonEmptyValue.sort(this.sortGroups(groupSortingField, layerAnalysisInfo.groupFeatures.groupFeaturesOrder))
      const sortedEmptyValueGroups = groups.groupsWithEmptyValue.sort(this.sortGroups(groupSortingField, layerAnalysisInfo.groupFeatures.groupFeaturesOrder))
      //show group with no value always at bottom
      if (groupSortingField && layerAnalysisInfo.groupFeatures.groupFeaturesOrder === OrderRule.Desc) {
        groupsArr = sortedEmptyValueGroups.concat(groupsArr)
      } else {
        groupsArr = groupsArr.concat(sortedEmptyValueGroups)
      }
    }

    if (layerAnalysisInfo.analysisType === AnalysisTypeName.Proximity) {
      const records = this.sortRecords(selectedFeatures, sortingField)
      selectedFeatures = records.notEmptyRecordsArr.sort(this.sortFeatureList(sortingField, layerAnalysisInfo.analysisType, objectIdField))
      const featuresWithNullValue = records.emptyRecordArr.sort(this.sortFeatureList(sortingField, layerAnalysisInfo.analysisType, objectIdField))
      if (sortByFieldEnabled && layerAnalysisInfo?.sortFeatures?.sortFeaturesOrder === OrderRule.Desc) {
        selectedFeatures = featuresWithNullValue.concat(selectedFeatures)
      } else {
        selectedFeatures = selectedFeatures.concat(featuresWithNullValue)
      }
    } else {
      //for closet type
      selectedFeatures = selectedFeatures.sort(this.sortFeatureList(sortingField, layerAnalysisInfo.analysisType))
    }

    if (groupEnabled && groupsArr.length > 0) {
      groupsArr.forEach(group => {
        selectedFeatures.forEach(record => {
          const selectedRecord = record as any
          if (group.value === selectedRecord.feature.attributes[groupField]) {
            if (!group.features) {
              group.features = []
            }
            group.features.push(record)
          }
        })
      })
    }
    return {
      features: selectedFeatures,
      featuresGroup: groupsArr
    }
  }

  /**
   * Sort records according to sorting field
   * @param features features
   * @param sortingField configure field for sorting
   * @returns records array
   */
  sortRecords = (features: DataRecord[], sortingField: string) => {
    const emptyRecordArr: DataRecord[] = []
    const notEmptyRecordsArr: DataRecord[] = []
    features.forEach((record: DataRecord, i) => {
      const featureRecord = record as any
      const sortFieldValue = sortingField === 'distance' ? featureRecord.feature[sortingField] : featureRecord.feature.attributes[sortingField]
      if (typeof (sortFieldValue) === 'undefined' || sortFieldValue === null || sortFieldValue === '') {
        emptyRecordArr.push(record)
      } else {
        notEmptyRecordsArr.push(record)
      }
    })
    return {
      emptyRecordArr: emptyRecordArr,
      notEmptyRecordsArr: notEmptyRecordsArr
    }
  }

  /**
   * Divide Groups By EmptyValue and NonEmptyValue to show EmptyValue always at bottom
   * @param groups groups
   * @param groupSortingField configure field for group sorting
   * @returns records array
   */
  divideGroupsByEmptyValue = (groups: any[], groupSortingField: string) => {
    const groupsWithEmptyValue = []
    const groupsWithNonEmptyValue = []
    groups.forEach((group) => {
      const sortFieldValue = group[groupSortingField]
      if (typeof (sortFieldValue) === 'undefined' || sortFieldValue === null || sortFieldValue === '') {
        groupsWithEmptyValue.push(group)
      } else {
        groupsWithNonEmptyValue.push(group)
      }
    })
    return {
      groupsWithEmptyValue: groupsWithEmptyValue,
      groupsWithNonEmptyValue: groupsWithNonEmptyValue
    }
  }

  /**
   * Sort groups according to the group sorting field
   * @param groupSortingField configured group sorting field
   * @param groupSortFieldOrder configured group field sorting order
   * @returns sorting field object
   */
  sortGroups = (groupSortingField: string, groupSortFieldOrder: OrderRule) => {
    return (a: any, b: any) => {
      //proximity grouping enabled and groups are sort by count
      //sort same feature count group with group value and group field sort order
      if (a[groupSortingField] === b[groupSortingField] || (a[groupSortingField] === null && b[groupSortingField] === null)) {
        if (a.value < b.value) {
          return groupSortFieldOrder === OrderRule.Desc ? -1 : 1
        }
        if (a.value > b.value) {
          return groupSortFieldOrder === OrderRule.Desc ? 1 : -1
        }
      }
      if (a[groupSortingField] < b[groupSortingField]) {
        return -1
      }
      if (a[groupSortingField] > b[groupSortingField]) {
        return 1
      }
      return 0
    }
  }

  /**
   * Sorted features list
   * @param sortingField configured sorting field
   * @param analysisType configured analysis type
   * @param objectIdField field of the layer
   * @returns Object of data records
   */
  sortFeatureList = (sortingField: string, analysisType: string, objectIdField?: string) => {
    return (aRecord: DataRecord, bRecord: DataRecord) => {
      const aFeatureRecord = aRecord as any
      let a = aFeatureRecord.feature
      const bFeatureRecord = bRecord as any
      let b = bFeatureRecord.feature
      const _a = a
      const _b = b
      if (sortingField !== 'distance') {
        a = a.attributes
        b = b.attributes
      }

      if (analysisType === AnalysisTypeName.Proximity) {
        if (a[sortingField] === b[sortingField] || (a[sortingField] === null && b[sortingField] === null)) {
          if (sortingField !== 'distance') {
            if (_a.distance !== _b.distance) {
              if (_a.distance < _b.distance) {
                return -1
              }
              if (_a.distance > _b.distance) {
                return 1
              }
            } else {
              if (a[objectIdField] < b[objectIdField]) {
                return -1
              }
              if (a[objectIdField] > b[objectIdField]) {
                return 1
              }
            }
          } else {
            if (a.attributes[objectIdField] < b.attributes[objectIdField]) {
              return -1
            }
            if (a.attributes[objectIdField] > b.attributes[objectIdField]) {
              return 1
            }
          }
        }
      }

      if (a[sortingField] < b[sortingField]) {
        return -1
      }
      if (a[sortingField] > b[sortingField]) {
        return 1
      }
    }
  }

  /**
   * Get the selected units abbreviation
   * @param selectedUnit selected unit
   * @returns selected unit with abbreviation
   */
  getSelectedUnitsAbbr = (selectedUnit: __esri.LinearUnits): string => {
    const distanceUnit = distanceUnitWithAbbr.find(unit => unit.value === selectedUnit)
    const selectedUnitAbbreviation = this.nls(distanceUnit.abbreviation)
    return selectedUnitAbbreviation
  }

  /**
   * Check if to display approximate distance UI
   * @param layerInfo analysis layers info
   * @returns whether to approximate distance UI
   */
  displayApproximateDistanceUI = (layerInfo: LayersInfo): boolean => {
    let showApproximateDistanceUI: boolean = false
    const layerAnalysisInfo: any = layerInfo.analysisInfo
    const analysisType = layerInfo.analysisInfo.analysisType
    const { searchByLocation } = getSearchWorkflow(this.state.searchSettings)
    //search by distance settings is enabled show approximate distance for closet and for proximity if expand list and expand feature details are on
    //for search by map area and show all features don't show approximate distance
    if (searchByLocation) {
      if ((analysisType === AnalysisTypeName.Closest) || (analysisType === AnalysisTypeName.Proximity && layerAnalysisInfo.expandOnOpen &&
        layerAnalysisInfo.expandFeatureDetails)) {
        showApproximateDistanceUI = true
      }
    }
    return showApproximateDistanceUI
  }

  /**
   * Create each graphics layers to show on the map
   */
  createGraphicsLayers = () => {
    if (this.bufferLayer) {
      this.bufferLayer.destroy()
    }
    if (this.drawingLayer) {
      this.drawingLayer.destroy()
    }
    if (this.flashLayer) {
      this.flashLayer.destroy()
    }
    this.bufferLayer = new GraphicsLayer({ listMode: 'hide' })
    this.drawingLayer = new GraphicsLayer({ listMode: 'hide' })
    this.flashLayer = new GraphicsLayer({ listMode: 'hide', effect: 'bloom(0.8, 1px, 0)' })
    this.state.jimuMapView?.view?.map?.addMany([this.bufferLayer, this.drawingLayer, this.flashLayer])
  }

  /**
   * Clears the record selection change message action executed by widget
   * Removes the highlight bar
   */
  clearMessageAction = () => {
    //unselects all the records selected by widget
    MessageManager.getInstance().publishMessage(new DataRecordsSelectionChangeMessage(this.props.id, []))
    //removes the highlight bar from popup
    if (this.selectedPopupContainer) {
      this.selectedPopupContainer.style.borderColor = transparentColor
    }
    this.selectedPopupContainer?.classList?.remove('record-selected')
    //clears the highlight selection of the record from map
    this.selectedRecord?.dataSource?.clearSelection()
    //clear all the variables related to selected record
    this.selectedRecord = null
    this.selectedPopupContainer = null
    this.selectedRecordsKey = ''
  }

  /**
   * Highlights the popup html dom and publish record selection change message action
   * @param record DataRecord to be selected
   */
  selectMessageAction = (record: DataRecord) => {
    //add class to show highlight bar in popup
    if (this.selectedPopupContainer) {
      this.selectedPopupContainer.style.borderColor = this.props.theme?.colors?.primary
    }
    this.selectedPopupContainer?.classList?.add('record-selected')
    //publish record select message
    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(this.props.id, [record])
    )
    //highlight the record on map
    record.dataSource?.selectRecordsByIds([record.getId()], [record])
    this.selectedRecord = record
  }

  /**
   * On clicking or opening the feature details selects or unselect the records
   * Currently only single selection is supported
   * @param key Unique index for each feature
   * @param popupContainer HTML dom ref to show the highlight bar
   * @param record DataRecord to be selected/unselected
   */
  executeSelectMessageAction = (key: string, popupContainer: HTMLDivElement, record: DataRecord) => {
    if (this.selectedRecordsKey === key) {
      this.clearMessageAction()
    } else if (this.selectedRecordsKey !== key) {
      if (this.selectedRecordsKey) {
        this.clearMessageAction()
      }
      this.selectedPopupContainer = popupContainer
      this.selectedRecordsKey = key
      this.selectMessageAction(record)
    }
  }

  /**
    * On clicking or closing the feature details unselect the records
    * Clear only when the key is of previously selected record
    * @param key Unique index for each feature
    */
  executeClearMessageAction = (key: string) => {
    if (this.selectedRecordsKey === key) {
      this.clearMessageAction()
    }
  }

  /**
   * Create the feature set list
   * @param featureList features list
   * @param layerInfo Analysis Layers info
   * @param objIdField ObjectId field
   * @param distanceUnit distance unit
   * @param analysisId configured analysis id
   * @returns Object of feature set, features count, layers info and records
   */
  createFeatureSet = (featureList: DataRecord[], layerInfo: LayersInfo, objIdField: string, distanceUnit: __esri.LinearUnits, analysisId: string, isReturnOneAnalysisResult: boolean) => {
    const jsxElements: JSX.Element[] = []
    let features: DataRecord[] = []
    const layerAnalysisInfo = layerInfo.analysisInfo as any
    let featuresAndGroup
    let popupTitleField: string = ''
    if (layerAnalysisInfo.analysisType === AnalysisTypeName.Proximity && layerAnalysisInfo.displayField !== '') {
      popupTitleField = layerAnalysisInfo.displayField
    } else {
      const dsId: string = layerInfo.useDataSource.dataSourceId
      const ds = getSelectedLayerInstance(dsId) as any
      const layerDefinition = ds?.layerDefinition
      //Get the default selected display field for proximity
      popupTitleField = getDisplayField(layerDefinition)
    }
    //check config parameters to decide feature details/groups should be expanded or collapse
    const expandFeaturesOrGroups = layerInfo.analysisInfo.analysisType === AnalysisTypeName.Proximity
      ? (layerAnalysisInfo.expandOnOpen && layerAnalysisInfo.expandFeatureDetails)
      : true
    features = featureList
    const { searchByLocation, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)
    if (searchByLocation) {
      //show feature distance only in case of define search area with distance
      features = this.getFeaturesDistance(features)
      //search by distance - 1.sort feature by distance is selected then sort features by distance
      //2.sort feature by field is selected then sort features by field value
      featuresAndGroup = this.getSortedFeatures(features, layerInfo, false, objIdField)
      features = featuresAndGroup.features
    } else {
      //show all features and search by map area - 1.sort feature by distance is selected then sort features by objectId
      //2.sort feature by field is selected then sort features by field value
      featuresAndGroup = this.getSortedFeatures(features, layerInfo, true, objIdField)
      features = featuresAndGroup.features
    }
    if (layerAnalysisInfo.analysisType === AnalysisTypeName.Closest) {
      //use only one record for closest analysis
      if (features.length > 1) {
        features = features.splice(0, 1)
      }
    }
    if (layerAnalysisInfo.analysisType === AnalysisTypeName.Proximity) {
      if (!layerAnalysisInfo.sortFeaturesByDistance && layerAnalysisInfo.sortFeatures?.sortFeaturesByField &&
        layerAnalysisInfo.sortFeatures.sortFeaturesOrder === OrderRule.Desc) {
        features = features.reverse()
      }
      if (layerAnalysisInfo.groupFeaturesEnabled && (layerAnalysisInfo.groupFeatures.groupFeaturesOrder === OrderRule.Desc ||
        layerAnalysisInfo.sortGroupsByCount)) {
        featuresAndGroup.featuresGroup = featuresAndGroup.featuresGroup.reverse()
      }
    }
    if (layerAnalysisInfo.analysisType === AnalysisTypeName.Proximity && featuresAndGroup?.featuresGroup?.length > 0) {
      const layerObj = getSelectedLayerInstance(layerInfo.useDataSource.dataSourceId) as any
      //show group symbol only when displayMapSymbols is on in config and
      //the analysis layer having the unique-value renderer and
      //the group features field matches with unique-renderer field of the layer
      const showGroupSymbol = this.state.analysisSettings?.displayMapSymbols &&
        layerObj.layer?.renderer?.type === 'unique-value' &&
        layerAnalysisInfo.groupFeatures.groupFeaturesByField === layerObj.layer?.renderer?.field
      featuresAndGroup.featuresGroup.forEach((group, groupIndex: number) => {
        //sort features inside group based on sort field order
        if (!layerAnalysisInfo.sortFeaturesByDistance && layerAnalysisInfo.sortFeatures?.sortFeaturesByField &&
          layerAnalysisInfo.sortFeatures.sortFeaturesOrder === OrderRule.Desc) {
          group.features = group.features.reverse()
        }

        const featureItems: JSX.Element[] = []
        group.features.forEach((feature, featureIndex: number) => {
          featureItems.push(
            <FeatureSet
              index={groupIndex + '_' + analysisId + '_' + featureIndex}
              key={analysisId + '_' + featureIndex}
              widgetId={this.props.id}
              intl={this.props.intl}
              theme={this.props.theme}
              config={this.props.config}
              jimuMapView={this.state.jimuMapView}
              popupTitleField={layerAnalysisInfo.analysisType === AnalysisTypeName.Proximity ? popupTitleField : null}
              selectedRecord={feature}
              distanceUnit={(searchByLocation || searchCurrentExtent) ? this.getSelectedUnitsAbbr(distanceUnit) : null}
              selectedFeatureLength={features.length}
              ifOneAnalysisResult={isReturnOneAnalysisResult}
              isExpanded={expandFeaturesOrGroups}
              expandOnOpen={layerAnalysisInfo.expandOnOpen}
              approximateDistanceUI={this.displayApproximateDistanceUI(layerInfo)}
              showDistFromInputLocation={this.state.analysisSettings?.showDistFromInputLocation}
              displayMapSymbol={this.state.analysisSettings?.displayMapSymbols}
              isGroup={true}
              selectRecord={this.executeSelectMessageAction}
              clearRecord={this.executeClearMessageAction}
              graphicLayer={this.flashLayer}></FeatureSet>)
        })
        jsxElements.push(<LayerAccordion
          theme={this.props.theme}
          key={groupIndex}
          index={groupIndex}
          intl={this.props.intl}
          label={group.label}
          analysisIcon={null}
          featureCount={this.state.analysisSettings?.displayFeatureCount ? group.count : null}
          isExpanded={expandFeaturesOrGroups}
          dsId={layerInfo.useDataSource.dataSourceId}
          analysisType={layerAnalysisInfo.analysisType}
          onDownload={this.downloadIndividualCsv}
          isListView={false}
          canShowMoreFeatures={true}
          selectedRecord={group.features[0]}
          displayMapSymbol={showGroupSymbol}
          canToggle>
          {featureItems}
        </LayerAccordion>)
      })
    } else {
      features.forEach((feature, featureIndex: number) => {
        jsxElements.push(
          <FeatureSet
            intl={this.props.intl}
            widgetId={this.props.id}
            index={analysisId + '_' + featureIndex}
            key={analysisId + '_' + featureIndex}
            theme={this.props.theme}
            config={this.props.config}
            popupTitleField={layerAnalysisInfo.analysisType === AnalysisTypeName.Proximity ? popupTitleField : null}
            jimuMapView={this.state.jimuMapView}
            selectedRecord={feature}
            distanceUnit={(searchByLocation || searchCurrentExtent) ? this.getSelectedUnitsAbbr(distanceUnit) : null}
            selectedFeatureLength={features.length}
            ifOneAnalysisResult={isReturnOneAnalysisResult}
            isExpanded={expandFeaturesOrGroups}
            expandOnOpen={layerAnalysisInfo.expandOnOpen}
            approximateDistanceUI={this.displayApproximateDistanceUI(layerInfo)}
            showDistFromInputLocation={this.state.analysisSettings?.showDistFromInputLocation}
            displayMapSymbol={this.state.analysisSettings?.displayMapSymbols}
            isGroup={false}
            selectRecord={this.executeSelectMessageAction}
            clearRecord={this.executeClearMessageAction}
            graphicLayer={this.flashLayer}></FeatureSet>)
      })
    }
    return ({
      items: jsxElements,
      count: features.length,
      layerInfo: layerInfo,
      records: features
    })
  }

  /**
   * Get the feature record list
   * @param useDataSource configured use datasource
   * @returns records promise
   */
  getRecords = async (useDataSource: ImmutableObject<UseDataSource>) => {
    const dsId = useDataSource.dataSourceId
    const ds = getSelectedLayerInstance(useDataSource.dataSourceId) as any
    if (!ds) {
      return Promise.resolve()
    }
    const promise = new Promise((resolve) => {
      let bufferGeometry = null
      //in case of show all features return geometry will be false, we will get geometry only when search area is defined
      const { searchByLocation, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)
      let returnGeometry: boolean = false
      if (searchByLocation || searchCurrentExtent) {
        //set return geometry to true only in case of search by distance
        //as we need geometry to show closest distance when search area is defined
        if (!searchCurrentExtent) {
          returnGeometry = true
        }
        //set buffer geometry
        if (this.state.aoiGeometries?.bufferGeometry) {
          bufferGeometry = this.state.aoiGeometries.bufferGeometry
        } else {
          bufferGeometry = this.state.aoiGeometries.incidentGeometry
        }
      }
      getALLFeatures(ds, bufferGeometry, returnGeometry, this.state.jimuMapView.view.spatialReference).then((recordsList: DataRecord[]) => {
        this.featuresByDsId[dsId] = recordsList
        resolve(recordsList)
      })
    })
    return promise
  }

  /**
   * perform the analysis on the features
   * @param layerInfo configured layers info
   * @param analysisId configured analysis id
   * @returns promise of the feature set
   */
  performAnalysis = async (layerInfo, analysisId: string, isReturnOneAnalysisResult: boolean) => {
    const promise = new Promise((resolve, reject) => {
      const dsId: string = layerInfo.useDataSource.dataSourceId
      const ds = getSelectedLayerInstance(dsId) as any
      const objIdField = ds?.layerDefinition.objectIdField
      let bufferGeometry = null
      const { showAllFeatures, searchByLocation, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)
      if (searchByLocation || searchCurrentExtent) {
        //set buffer geometry
        if (this.state.aoiGeometries?.bufferGeometry) {
          bufferGeometry = this.state.aoiGeometries.bufferGeometry
        } else {
          bufferGeometry = this.state.aoiGeometries.incidentGeometry
        }
      }
      if (this.featuresByDsId.hasOwnProperty(dsId)) {
        //clone the featuresByDsId array
        const featureList = [...this.featuresByDsId[dsId]]
        let featureSet = {
          items: [],
          count: featureList.length,
          layerInfo: layerInfo,
          records: featureList
        }
        const portalUnit = getPortalUnit()
        //Use portal unit in case of show all features OR search by extent
        const distanceUnit = showAllFeatures || searchCurrentExtent
          ? portalUnit
          : this.state.aoiGeometries.distanceUnit || this.state.searchSettings.distanceUnits || portalUnit

        if (featureList.length > 0) {
          if (layerInfo.analysisInfo.analysisType === AnalysisTypeName.Summary) {
            featureSet = this.summaryAnalysis(featureList, layerInfo, distanceUnit, bufferGeometry, analysisId)
            resolve(featureSet)
          } else if ((layerInfo.analysisInfo.analysisType === AnalysisTypeName.Closest && searchByLocation) ||
            layerInfo.analysisInfo.analysisType === AnalysisTypeName.Proximity) {
            featureSet = this.createFeatureSet(featureList, layerInfo, objIdField, distanceUnit as __esri.LinearUnits, analysisId, isReturnOneAnalysisResult)
            resolve(featureSet)
          }
        } else {
          resolve(featureSet)
        }
      }
    })
    return promise
  }

  /**
   * Render the summary fields cards according to its config
   * @param featureList Summary features list
   * @param layerInfo config layers info
   * @param distanceUnit config distance units
   * @param geometry calculated geometry
   * @param analysisId configured analysis id
   * @returns result for summary analysis
   */
  summaryAnalysis = (featureList: DataRecord[], layerInfo: LayersInfo, distanceUnit: string, geometry: Geometry, analysisId: string) => {
    const jsxElements: JSX.Element[] = []
    let value
    value = null
    const analysisInfo: any = layerInfo.analysisInfo
    const analysisLabel: string = layerInfo.label
    const { showAllFeatures, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)
    //skip the length or area field when search by location is not enabled
    const skipAreaOrLengthField = showAllFeatures || searchCurrentExtent
    if (analysisInfo.summaryFields.length > 0) {
      // get the value of SumOfIntersectedArea/SumOfIntersectedLength
      analysisInfo.summaryFields.forEach((summaryField: SummaryFieldsInfo, index: number) => {
        //if define search is off or search by map are is on then skip sum of intersected area/length fields of summary
        if (!(skipAreaOrLengthField && summaryField.summaryFieldInfo.hasOwnProperty('summaryBy'))) {
          if (summaryField.summaryFieldInfo?.summaryBy === CommonSummaryFieldValue.SumOfIntersectedArea) {
            value = this.getArea(featureList, geometry, distanceUnit)
            value = this.getSummaryDisplayValue(value, summaryField.summaryFieldInfo, distanceUnit, true)
          }
          if (summaryField.summaryFieldInfo?.summaryBy === CommonSummaryFieldValue.SumOfIntersectedLength) {
            value = this.getLength(featureList, geometry, distanceUnit)
            value = this.getSummaryDisplayValue(value, summaryField.summaryFieldInfo, distanceUnit, false)
          }
        }
      })
      //If skipAreaOrLengthField and only SumOfIntersectedArea/SumOfIntersectedLength then we don't need any summary fields
      //as in search by current map area we cannot calculate SumOfIntersectedArea/SumOfIntersectedLength
      //else create the list of summary fields
      // eslint-disable-next-line no-prototype-builtins
      if (skipAreaOrLengthField && analysisInfo.summaryFields.length === 1 && analysisInfo.summaryFields[0]?.summaryFieldInfo?.hasOwnProperty('summaryBy')) {
        this.updateSummaryOutputDS(analysisLabel, analysisInfo.summaryFields, analysisId, featureList.length)
      } else {
        jsxElements.push(<SummaryResult
          key={analysisId}
          widgetId={this.props.widgetId}
          records={featureList}
          theme={this.props.theme}
          useDataSource={layerInfo.useDataSource}
          summaryFieldInfos={analysisInfo.summaryFields}
          sumOfAreaOrLengthValue={value}
          singleFieldColor={analysisInfo.isSingleColorMode ? analysisInfo.singleFieldColor : null}
          onSummaryFieldsResolved={(summaryAttributes: SummaryAttributes) => {
            this.updateSummaryOutputDS(analysisLabel, analysisInfo.summaryFields, analysisId, featureList.length, summaryAttributes)
          }}
        ></SummaryResult>)
      }
    } else {
      this.updateSummaryOutputDS(analysisLabel, analysisInfo.summaryFields, analysisId, featureList.length)
    }
    return ({
      items: jsxElements,
      count: featureList.length,
      layerInfo: layerInfo,
      records: featureList
    })
  }

  /**
   * Updates the output dataSource with the resolved summary values
   * @param analysisLabel - Configured analysis label
   * @param summaryFields - Configured SummaryFieldsInfo for the analysis
   * @param analysisId - Analysis id
   * @param intersectingFeaturesCount - Total number of features intersecting the AOI
   * @param resolvedAttributes - Resolved values of configured summary expressions
   */
  updateSummaryOutputDS = (analysisLabel: string, summaryFields: SummaryFieldsInfo[], analysisId: string, intersectingFeaturesCount: number, resolvedAttributes?: SummaryAttributes) => {
    const summaryAttributes: SummaryAttributes = resolvedAttributes ? { ...resolvedAttributes } : {}
    const outputDsId = getOutputDsId(this.props.widgetId, AnalysisTypeName.Summary, analysisId)
    summaryAttributes.esriCTCOUNT = intersectingFeaturesCount
    this.buildOutputDsResultsForSummary(analysisLabel, summaryFields, outputDsId, summaryAttributes)
  }

  /**
   * Get summary field display value
   * @param summaryValue sum of intersected Length/Area
   * @param summaryFieldInfo Sum Of Area/Length Params
   * @param distanceUnit  selected unit
   * @param isIntersectingArea if intersecting area is selected
   * @returns formatted value or area
   */
  getSummaryDisplayValue = (summaryValue: number, summaryFieldInfo: SumOfAreaLengthParam, distanceUnit: string, isIntersectingArea?: boolean): string => {
    const defaultNumberFormat: FormatNumberOptions = {
      useGrouping: summaryFieldInfo.showSeparator,
      notation: 'standard'
    }
    let formattedValue: string
    if (summaryFieldInfo.numberFormattingOption === NumberFormatting.Round) {
      defaultNumberFormat.maximumFractionDigits = summaryFieldInfo.significantDigits
      defaultNumberFormat.minimumFractionDigits = summaryFieldInfo.significantDigits
      formattedValue = this.props.intl.formatNumber(summaryValue, defaultNumberFormat)
    } else if (summaryFieldInfo.numberFormattingOption === NumberFormatting.Truncate) {
      defaultNumberFormat.minimumSignificantDigits = summaryFieldInfo.significantDigits
      if (!isNaN(summaryValue) && summaryValue !== null) {
        const truncatePlaces = summaryFieldInfo.significantDigits
        const truncateExp = new RegExp(truncatePlaces > 0 ? '^\\d*[.]?\\d{0,' + truncatePlaces + '}' : '^\\d*')
        formattedValue = truncateExp.exec(summaryValue.toString())[0]
      }
      formattedValue = this.props.intl.formatNumber(Number(formattedValue), defaultNumberFormat)
    } else {
      formattedValue = this.props.intl.formatNumber(summaryValue, defaultNumberFormat)
    }
    let unitAbbr = this.getSelectedUnitsAbbr(distanceUnit as __esri.LinearUnits)
    //show square unit for area
    if (isIntersectingArea) {
      unitAbbr = unitAbbr + '\u00b2'
    }
    return this.summaryIntersectValueAndUnitLabel(formattedValue, unitAbbr)
  }

  /**
   * Get label for sum of intersected area/length value and unit
   * @param formattedSummaryValue formatted sum of intersected area/length value
   * @param unit unit
   * @returns formatted sum of intersected area/length value unit label
   */
  summaryIntersectValueAndUnitLabel = (formattedSummaryValue: string, unit: string): string => {
    let summaryIntersectValueAndUnitLabel = ''
    summaryIntersectValueAndUnitLabel = this.props.intl.formatMessage({
      id: 'summaryIntersectValueAndUnit', defaultMessage: defaultMessages.summaryIntersectValueAndUnit
    }, { summaryIntersectValue: formattedSummaryValue, unitLabel: unit })
    return summaryIntersectValueAndUnitLabel
  }

  /**
   * Get the intersected area for polygon feature
   * @param featureRecords selected features records
   * @param geoms geometry of the features
   * @param distanceUnits config distance units
   * @returns formatted value or area
   */
  getArea = (featureRecords: DataRecord[], geoms: Geometry, distanceUnits: string): number => {
    let value: number = 0
    const units = ('square' + '-' + distanceUnits) as __esri.AreaUnits
    featureRecords.forEach(featureRecord => {
      const selectedFeatureRecord = featureRecord as any
      let intersectGeom
      if (geoms) {
        intersectGeom = geometryEngine.intersect(selectedFeatureRecord.feature.geometry, geoms)
      } else {
        intersectGeom = selectedFeatureRecord.feature.geometry
      }
      if (intersectGeom !== null) {
        const sr = intersectGeom.spatialReference
        if (sr.wkid === 4326 || sr.isWebMercator || (sr.isGeographic)) {
          value += geometryEngine.geodesicArea(intersectGeom, units)
        } else {
          value += geometryEngine.planarArea(intersectGeom, units)
        }
      }
    })
    return value
  }

  /**
   * Get the intersected length for polyline feature
   * @param featureRecords selected features records
   * @param geoms geometry of the features
   * @param distanceUnits config distance units
   * @returns formatted value or length
   */
  getLength = (featureRecords: DataRecord[], geoms: Geometry, distanceUnits: string): number => {
    let value: number = 0
    const units = distanceUnits as __esri.LinearUnits
    featureRecords.forEach(featureRecord => {
      const selectedFeatureRecord = featureRecord as any
      let intersectGeom
      if (geoms) {
        intersectGeom = geometryEngine.intersect(selectedFeatureRecord.feature.geometry, geoms)
      } else {
        intersectGeom = selectedFeatureRecord.feature.geometry
      }
      if (intersectGeom !== null) {
        const sr = intersectGeom.spatialReference
        if (sr.wkid === 4326 || sr.isWebMercator || (sr.isGeographic)) {
          value += geometryEngine.geodesicLength(intersectGeom, units)
        } else {
          value += geometryEngine.planarLength(intersectGeom, units)
        }
      }
    })
    return value
  }

  /**
   * Resize the layers list height depending whether the closest address is showing
   * @param isClosestAddressShowing whether the closest address is showing
   */
  resizeLayerListHeight = () => {
    if (this.divRef?.current) {
      const { searchByLocation, showAllFeatures } = getSearchWorkflow(this.state.searchSettings)
      const offsetHeight = this.divRef?.current?.offsetHeight
      //Height of the refresh/delete button to be added if title is in multiple rows
      const refreshDeleteButtonHeight = this.props.theme.typography.fontSizeRoot === '125%' ? 35 : 27
      //calculate the value of list height
      let divHeight = offsetHeight
      //In case of Search by location, we will always have delete and refresh button, so add refreshDeleteButtonHeight in the offset height
      //In case of Show all feature, based on if multiple rows are shown or single or no heading label calculate height
      if (searchByLocation) {
        divHeight = offsetHeight + refreshDeleteButtonHeight
      } else if (showAllFeatures) {
        if (this.props.theme.typography.fontSizeRoot === '125%') {
          //means no label
          if (offsetHeight <= 34) {
            divHeight = 35
          } else if (offsetHeight > 34) {
            //means multiple rows
            divHeight = offsetHeight + refreshDeleteButtonHeight
          }
        } else {
          //means no label
          if (offsetHeight <= 28) {
            divHeight = 28
          } else if (offsetHeight > 28) {
            //means multiple rows
            divHeight = offsetHeight + refreshDeleteButtonHeight
          }
        }
      }
      this.setState({
        listMaxHeight: 'calc(100% -' + ' ' + divHeight + 'px)'
      })
    }
  }

  /**
   * Create highlighting graphics for the selected feature
   * @param records feature records
   * @param isVisible whether highlight layer is visible
   * @param highlightResults whether layer results highlighted on map
   * @param highlightResultsColor highlight layer with configured color
   */
  createHighlightGraphicsForLayer = (records: DataRecord[], isVisible: boolean, highlightResults: boolean, highlightResultsColor: string) => {
    if (highlightResults) {
      const highlightLayer = new GraphicsLayer({ listMode: 'hide', visible: isVisible })
      this.highlightGraphicsLayers.push(highlightLayer)
      this.state.jimuMapView?.view.map.addMany([highlightLayer])
      //reorder the flash layer to be on top so that the flashed graphics is visible on map
      this.state.jimuMapView?.view.map.reorder(this.flashLayer, this.state.jimuMapView?.view.map.layers.length - 1)
      records.forEach((record) => {
        const featureRecord = record as any
        const feature = featureRecord.getFeature()
        const graphic = getHighLightSymbol(feature, utils.getColorValue(highlightResultsColor))
        if (highlightLayer && graphic) {
          highlightLayer.add(graphic)
        }
      })
    } else {
      //pushed null for the layers(proximity/summary) whose highlight features setting is off
      this.highlightGraphicsLayers.push(null)
    }
  }

  /**
   * Destroy/remove the highlight graphics layers
   */
  destroyHighlightGraphicsLayer = () => {
    this.highlightGraphicsLayers.forEach((layer) => {
      if (layer) {
        layer.removeAll()
        layer.destroy()
      }
    })
    this.highlightGraphicsLayers = []
  }

  /**
   * On layer toggle make the layer visible
   * @param index Index of each layer toggle
   * @param isExpanded check whether the layer section is expanded
   */
  onLayerToggle = (index: number, isExpanded: boolean) => {
    if (this.highlightGraphicsLayers?.length > 0 && this.highlightGraphicsLayers[index]) {
      const layer = this.highlightGraphicsLayers[index]
      if (layer) {
        if (isExpanded) {
          layer.visible = true
        } else {
          layer.visible = false
        }
      }
    }
  }

  /**
   * Queries only unique layers from the configured analysis starts display layer analysis
   */
  queryLayers = lodash.debounce(() => {
    this.setState({
      showNoResultsFoundMsg: false,
      displayLayerAccordion: []
    })
    this.destroyHighlightGraphicsLayer()
    this.resetFilters()
    this.clearMessageAction()
    const defArray: Array<Promise<any>> = []
    const queriedLayers: string[] = []
    const { showAllFeatures, searchByLocation, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)
    if ((showAllFeatures || ((searchByLocation || searchCurrentExtent) && this.state.aoiGeometries)) && this.state.jimuMapView &&
      this.state.analysisSettings?.layersInfo?.length > 0) {
      this.state.analysisSettings.layersInfo.forEach((layerInfo) => {
        //Loop through all analysis layers settings configuration
        //Any layer which does not falls in the layer arrays
        //are not present in the webmap/webscene
        //skip analysis for those layers
        if (this.availableLayersIds.includes(layerInfo.useDataSource.dataSourceId)) {
          const dsId: string = layerInfo?.useDataSource?.dataSourceId
          if (dsId && !queriedLayers.includes(dsId)) {
            queriedLayers.push(dsId)
            //Live mode: if analysis setting is changed then query only for newly added layers
            if (!this.featuresByDsId[dsId]) {
              defArray.push(this.getRecords(layerInfo.useDataSource))
            }
          }
        }
      })
    }
    Promise.all(defArray).then(() => {
      this.displayAnalysisLayerInfo()
    })
  }, 300)

  /**
   * Download the individual analysis csv
   * @param index each layer analysis index
   * @param dsId layer dataSource id
   * @param analysisType layer analysis type
   */
  downloadIndividualCsv = async (index: number, dsId: string, analysisType: string) => {
    let records = this.featuresByDsId[dsId]
    if (dsId) {
      if (analysisType === AnalysisTypeName.Closest) {
        records = this.closestFeaturesByIndexAndDsId[index + '_' + dsId]
      }
      const dsManager = DataSourceManager.getInstance()
      const dataSource = dsManager?.getDataSource(dsId)
      dsManager.createDataSource(Immutable({
        id: 'downloadCsv_' + new Date().getTime(),
        type: DataSourceTypes.FeatureLayer,
        isDataInDataSourceInstance: true,
        schema: dataSource.getSchema()
      })).then(ds => {
        ds.setSourceRecords(records)
        const dataSets = {
          records: records,
          dataSource: ds,
          name: dataSource.getLabel()
        }
        const actionsPromise = DataActionManager.getInstance().getSupportedActions(this.props.widgetId, [dataSets], DataLevel.Records)
        actionsPromise.then(async actions => {
          const action = actions.export
          if (action?.length > 0) {
            const exportToCsvAction = action.filter((action) => {
              return action.id === 'export-csv'
            })
            await DataActionManager.getInstance().executeDataAction(exportToCsvAction[0], [dataSets], DataLevel.Records, this.props.widgetId)
          }
        }).catch(err => {
          console.error(err)
        })
      })
    }
  }

  /**
   * loop through analysis setting layer infos and display layers accordion
   */
  displayAnalysisLayerInfo = () => {
    const items: JSX.Element[] = []
    if (this.state.displayLayerAccordion.length > 0) {
      this.setState({
        showNoResultsFoundMsg: false,
        displayLayerAccordion: []
      })
      this.destroyHighlightGraphicsLayer()
      this.clearMessageAction()
    }
    const defArray = []
    const configLayersInfo = this.state.analysisSettings?.layersInfo
    const { showAllFeatures, searchByLocation, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)
    if ((showAllFeatures || ((searchByLocation || searchCurrentExtent) && this.state.aoiGeometries)) && this.state.jimuMapView &&
      configLayersInfo?.length > 0) {
      let totalAnalysisResult: number = 0
      //find out the number of analysis results returned
      configLayersInfo.forEach((layerInfo) => {
        if (layerInfo.analysisInfo.analysisType === AnalysisTypeName.Closest) {
          if (this.featuresByDsId[layerInfo.useDataSource.dataSourceId]?.length > 0) {
            totalAnalysisResult += 1
          }
        } else {
          totalAnalysisResult += this.featuresByDsId[layerInfo.useDataSource.dataSourceId]?.length ?? 0
        }
      })
      const isReturnOneAnalysisResult = totalAnalysisResult === 1
      configLayersInfo.forEach((layerInfo, index) => {
        //if show all features or map area is on then don't show closest analysis type layers
        if (!((showAllFeatures || searchCurrentExtent) && layerInfo.analysisInfo.analysisType === AnalysisTypeName.Closest)) {
          //Loop through all analysis layers settings configuration
          //Any layer which does not falls in the layer arrays
          //are not present in the webmap/webscene
          //skip analysis for those layers
          if (this.availableLayersIds.includes(layerInfo.useDataSource.dataSourceId)) {
            const analysisId = layerInfo.analysisInfo.analysisId ?? index.toString()
            defArray.push(this.performAnalysis(layerInfo, analysisId, isReturnOneAnalysisResult))
          }
        }
      })
      Promise.all(defArray).then((results: any) => {
        results.forEach((result, index: number) => {
          //Build output data source for proximity and closest analysis
          //for summary output ds will be built once expressions are resolved
          if (result) {
            const ds = DataSourceManager.getInstance()?.getDataSource(result.layerInfo.useDataSource.dataSourceId)
            const schema = ds.getSchema()
            const analysisId: string = result.layerInfo.analysisInfo.analysisId ?? index.toString()
            const outputDsId = getOutputDsId(this.props.widgetId, result.layerInfo.analysisInfo.analysisType, analysisId)
            if (result.layerInfo.analysisInfo.analysisType === 'summary') {
              if (result.count === 0) {
                this.updateSummaryOutputDS(result.layerInfo.label, result.layerInfo.analysisInfo.summaryFields, analysisId, 0)
              }
            } else {
              this.buildOutputDsResults(result.layerInfo.label, outputDsId, result.records, schema.fields)
            }
          }
          if (result?.count > 0) {
            let canToggle: boolean = true
            // don't expand features list if summary is not added
            if (result.layerInfo.analysisInfo.analysisType === 'summary' && result.items.length === 0) {
              canToggle = false
            }
            const dsId = result.layerInfo.useDataSource.dataSourceId
            const canExportData: boolean = this.state.showExportButton && !result.records[0]._dataSource.getDataSourceJson().disableExport
            const expandLayer: boolean = result.layerInfo.analysisInfo.expandOnOpen
            this.closestFeaturesByIndexAndDsId[items.length + '_' + dsId] = result.records

            //Filter layers to show only the result
            //when only closest configured for any data source, filter to show only one closest feature else show the  result
            if (this.state.analysisSettings?.onlyShowLayersResult) {
              if (this.checkOnlyClosestConfiguredForDS(dsId)) {
                this.filterToOnlyShowResultFeatures(dsId, result.records)
              } else {
                this.filterToOnlyShowResultFeatures(dsId)
              }
            }

            //create highlight graphics
            //in case of show all features and show features in Current Map Area
            //we will not fetch the geometries and hence no need to highlight them
            //only highlight the graphics in case when search area is defined for distance
            if (searchByLocation) {
              let highlightResults = true
              let highlightResultsColor = defaultHighlightResultsColor
              highlightResults = result.layerInfo.analysisInfo.highlightResultsOnMap
              highlightResultsColor = result.layerInfo.analysisInfo.highlightColorOnMap
              this.createHighlightGraphicsForLayer(result.records, expandLayer, highlightResults, highlightResultsColor)
            }
            items.push(<LayerAccordion
              theme={this.props.theme}
              key={index}
              intl={this.props.intl}
              label={result.layerInfo.label}
              analysisIcon={this.state.analysisSettings?.displayAnalysisIcon ? this.getAnalysisTypeIcon(result.layerInfo.analysisInfo.analysisType) : null}
              featureCount={this.state.analysisSettings?.displayFeatureCount ? result?.count : null}
              isExpanded={expandLayer}
              isListView={true}
              index={items.length}
              dsId={dsId}
              analysisType={result.layerInfo.analysisInfo.analysisType}
              showExportButton={canExportData}
              onDownload={this.downloadIndividualCsv}
              onToggle={this.onLayerToggle}
              canShowMoreFeatures={result.layerInfo.analysisInfo.analysisType === AnalysisTypeName.Proximity}
              canToggle={canToggle}>
              {result.items}
            </LayerAccordion>)
          }
        })
        this.setState({
          displayLayerAccordion: items,
          showNoResultsFoundMsg: items.length === 0,
          loadingAllFeaturesFromDs: false
        })
      })
    }
  }

  /**
   * Build output data source results for Proximity and Closest analysis
   * @param analysisLabel - Configured analysis label
   * @param outputDsId output dataSource id
   * @param featureRecords resultant feature records
   * @param featureFields configured dataSource fields
   */
  buildOutputDsResults = async (analysisLabel: string, outputDsId: string, featureRecords: DataRecord[], featureFields: IMDataSourceSchema) => {
    let outputDS = this.getOutputDataSource(outputDsId)
    if (!outputDS) {
      outputDS = await DataSourceManager.getInstance().createDataSource(outputDsId) as FeatureLayerDataSource
    }
    if (!outputDS) {
      return
    }
    const geometryType = dataSourceUtils.changeRestAPIGeometryTypeToJSAPIGeometryType(outputDS.getGeometryType() ?? 'esriGeometryPoint')
    const sourceFeatures: Graphic[] = []
    featureRecords?.forEach((record: any, index) => {
      //create source feature values by pushing the graphic attributes
      const featureValue: any = {}
      const tempFeature = record.getFeature()
      if (tempFeature.attributes) {
        for (const key in tempFeature.attributes) {
          const attributeValue = tempFeature.attributes[key]
          //add values for new feature
          if (attributeValue !== undefined && attributeValue !== null) {
            featureValue[key] = attributeValue
          }
        }
      }
      const featureDsGeometryType = record.dataSource.getGeometryType()
      const dummyGeometryType = dataSourceUtils.changeRestAPIGeometryTypeToJSAPIGeometryType(featureDsGeometryType ?? 'esriGeometryPoint')
      //define dummy geometry as for current map area case we don't get any geometry
      const dummyGeometry = {
        type: (dummyGeometryType ?? 'point') as 'point' | 'multipoint' | 'polyline' | 'polygon',
        longitude: this.state.jimuMapView?.view?.extent.center.longitude,
        latitude: this.state.jimuMapView?.view?.extent.center.latitude,
        spatialReference: { wkid: this.mapView.spatialReference.wkid }
      }

      const newGraphic = new Graphic({
        attributes: featureValue,
        geometry: tempFeature.geometry ?? dummyGeometry
      })
      sourceFeatures.push(newGraphic)
    })

    const fieldsInPopupTemplate: any[] = []
    const analysisLayerFields: any[] = []
    //create field infos for layer and popupTemplate
    for (const key in featureFields) {
      let fieldType = ''
      if (featureFields[key].type === JimuFieldType.Number) {
        fieldType = 'double'
      } else if (featureFields[key].type === JimuFieldType.Date) {
        fieldType = 'date'
      } else {
        fieldType = 'string'
      }
      const fieldInfo = {
        alias: featureFields[key].alias,
        name: featureFields[key].name,
        type: fieldType
      }
      const popupFieldItem = {
        fieldName: featureFields[key].name,
        label: featureFields[key].alias
      }
      //create field info for layer
      analysisLayerFields.push(fieldInfo)
      //create fields in popup template
      fieldsInPopupTemplate.push(popupFieldItem)
    }
    //create custom feature layer with all the analysis layer info
    const layer = new FeatureLayer({
      id: outputDsId + '_layer',
      title: outputDsId,
      fields: analysisLayerFields,
      geometryType: (geometryType ?? 'point') as 'point' | 'multipoint' | 'polyline' | 'polygon',
      source: sourceFeatures,
      objectIdField: 'OBJECTID',
      popupTemplate: { //feature info widget popup title
        title: analysisLabel ?? outputDS.getLabel() ?? outputDsId,
        content: [{
          type: 'fields',
          fieldInfos: fieldsInPopupTemplate
        }]
      },
      visible: false,
      listMode: 'hide',
      customParameters: {
        moveFeaturesToCenterWhenPrinting: true
      }
    })

    const featureLayerDs = this.getOutputDataSource(outputDsId) as FeatureLayerDataSource
    if (layer && featureLayerDs) {
      featureLayerDs.layer = layer
    }
    //update the data source status
    this.getOutputDataSource(outputDsId)?.setStatus(DataSourceStatus.Unloaded)
    this.getOutputDataSource(outputDsId)?.setCountStatus(DataSourceStatus.Unloaded)
    this.getOutputDataSource(outputDsId)?.addSourceVersion()
  }

  /**
   * Build output dataSource result for summary
   * @param analysisLabel - Configured analysis label
   * @param summaryFields summary result fields info
   * @param outputDsId Output data source id
   * @param attributesValues resolved summary fields values
   */
  buildOutputDsResultsForSummary = async (analysisLabel: string, summaryFields: SummaryFieldsInfo[], outputDsId: string, attributesValues: SummaryAttributes) => {
    let outputDS = this.getOutputDataSource(outputDsId)
    if (!outputDS) {
      outputDS = await DataSourceManager.getInstance().createDataSource(outputDsId) as FeatureLayerDataSource
    }
    if (!outputDS) {
      return
    }
    //We will always have objectId and count in summary analysis
    //if summary fields are not configured user can still see the count
    const summaryFieldsArr: __esri.FieldProperties[] = [
      {
        alias: 'OBJECTID',
        type: 'double',
        name: 'OBJECTID'
      },
      {
        alias: this.nls('count'),
        type: 'double',
        name: 'esriCTCOUNT'
      }
    ]
    const summaryFieldsValues: any = {}
    // Add objectid and count attributeValues
    summaryFieldsValues.OBJECTID = 0
    if (attributesValues.hasOwnProperty('esriCTCOUNT')) {
      summaryFieldsValues.esriCTCOUNT = attributesValues.esriCTCOUNT
    }
    //push all the configured summary fields
    summaryFields.forEach((fieldInfos) => {
      const fieldName = fieldInfos.fieldLabel.replace(/ /g, '')
      summaryFieldsArr.push({
        alias: fieldInfos.fieldLabel,
        type: 'string',
        name: fieldName
      })
      //if attributesValues are available set it
      if (attributesValues.hasOwnProperty(fieldName)) {
        summaryFieldsValues[fieldName] = attributesValues[fieldName]
      }
    })

    //define dummy point geometry as for summary analysis stats value we don't have any geometry
    const dummyPointGeometry = {
      type: 'point',
      longitude: this.state.jimuMapView?.view?.extent.center.longitude,
      latitude: this.state.jimuMapView?.view?.extent.center.latitude,
      spatialReference: { wkid: this.mapView.spatialReference.wkid }
    }

    const summaryFieldsGraphic = new Graphic({
      attributes: summaryFieldsValues,
      geometry: dummyPointGeometry
    })

    const fieldsInPopupTemplate: any[] = []
    summaryFieldsArr.forEach((fields) => {
      if (fields.name) {
        fieldsInPopupTemplate.push({
          fieldName: fields.name,
          label: fields.alias
        })
      }
    })

    //create custom feature layer with all the statistics info
    const layer = new FeatureLayer({
      id: outputDsId + '_layer',
      title: outputDsId,
      fields: summaryFieldsArr,
      geometryType: 'point',
      source: [summaryFieldsGraphic],
      objectIdField: 'OBJECTID',
      popupTemplate: { //feature info widget popup title
        title: analysisLabel ?? outputDS.getLabel() ?? outputDsId,
        content: [{
          type: 'fields',
          fieldInfos: fieldsInPopupTemplate
        }]
      },
      visible: false,
      listMode: 'hide',
      customParameters: {
        moveFeaturesToCenterWhenPrinting: true
      }
    })
    const featureLayerDs = this.getOutputDataSource(outputDsId) as FeatureLayerDataSource
    featureLayerDs.layer = layer
    //update the data source status
    this.getOutputDataSource(outputDsId)?.setStatus(DataSourceStatus.Unloaded)
    this.getOutputDataSource(outputDsId)?.setCountStatus(DataSourceStatus.Unloaded)
    this.getOutputDataSource(outputDsId)?.addSourceVersion()
  }

  /**
   * Get output data source from data source manager instance
   * @param outputDs output data source id
   * @returns output data source
   */
  getOutputDataSource = (outputDsId: string) => {
    return DataSourceManager.getInstance().getDataSource(outputDsId)
  }

  /**
   * Set current widget width
   * @param widgetWidth widget width
   */
  onResize = (widgetWidth: number) => {
    //if widget size is below 306 then show value in next row
    //else show label and value in one row
    this.setState({
      widgetWidth: widgetWidth
    })
    this.resizeLayerListHeight()
  }

  /**
   * Update state to know closest Address is Showing or not
   * @param isClosestAddressShowing if closest address is showing
   */
  updateClosestAddressState = (isClosestAddressShowing: boolean) => {
    this.setState({
      isClosestAddressShowing: isClosestAddressShowing
    }, () => {
      this.resizeLayerListHeight()
    })
  }

  /**
   * When onlyShowLayerResults configuration is changed in live mode
   * Update the filters on each layers according to the curent state of onlyShowLayerResults
   */
  onOnlyShowLayerResultsChanged = () => {
    //if only show results enabled apply filters to the layers
    //else clear the filters
    if (this.state.analysisSettings?.onlyShowLayersResult) {
      this.featuresByDsId && Object.keys(this.featuresByDsId).forEach((dsId) => {
        let records
        //when only closest configured for any data source, then only one record should be shown
        if (this.checkOnlyClosestConfiguredForDS(dsId) && this.closestFeaturesByIndexAndDsId) {
          //loop through the closestFeaturesByIndex and get the only closest feature record
          // eslint-disable-next-line array-callback-return
          Object.keys(this.closestFeaturesByIndexAndDsId).some((indexAndDsId) => {
            if (indexAndDsId.split(/_(.*)/s)[1] === dsId) {
              records = this.closestFeaturesByIndexAndDsId[indexAndDsId]
              return true
            }
          })
        }
        this.filterToOnlyShowResultFeatures(dsId, records)
      })
    } else {
      this.resetFilters(true)
    }
  }

  /**
   * Filters the Data Source to show only the resultant features
   * @param ds - DataSource
   * @param records - Features to be filtered, if passed only those features will be shown else features from the variable featuresByDsId will only be shown
   */
  filterToOnlyShowResultFeatures = (dsId, records?) => {
    if (this.state.analysisSettings?.onlyShowLayersResult && dsId && this.featuresByDsId[dsId]) {
      const ds = getSelectedLayerInstance(dsId) as any
      if (ds) {
        const recordsList = records || this.featuresByDsId[dsId]
        const objIdField = ds?.layerDefinition.objectIdField
        const oIds: any[] = []
        recordsList.forEach((record) => { oIds.push(record?.feature?.attributes[objIdField]) })
        let queryParams = {} as QueryParams
        if (oIds.length > 0) {
          queryParams = { where: '(((' + objIdField + ' IN (' + oIds.join(',') + '))))' } as QueryParams
        } else if (oIds.length === 0) {
          queryParams = { where: '1=2' } as QueryParams
        }
        (ds as QueriableDataSource).updateQueryParams?.(queryParams, this.props.id)
        //store the dsId in filtersAppliedOnDsId array, so that we can use the array to reset them
        if (!this.filtersAppliedOnDsId.includes(dsId)) {
          this.filtersAppliedOnDsId.push(dsId)
        }
      }
    }
  }

  /**
   * Removes all filters applied by the widget
   * @param forceReset if need to force reset
   */
  resetFilters = (forceReset?: boolean) => {
    const emptyQueryParams = { where: '1=1', sqlExpression: null } as QueryParams
    if ((this.state.analysisSettings?.onlyShowLayersResult || forceReset) && this.state.jimuMapView) {
      //reset the filters applied by near-me widget
      this.filtersAppliedOnDsId.forEach((dsId) => {
        const ds = getSelectedLayerInstance(dsId) as any
        if (ds) {
          (ds as QueriableDataSource).updateQueryParams?.(emptyQueryParams, this.props.id)
        }
      })
      //empty the array, so next time we can reset filters only for those ds which are applied by near-me
      this.filtersAppliedOnDsId = []
    }
  }

  /**
   * Checks if only closest is configured for the dsId
   * @param dsId string dataSourceId
   * @returns true if only closest configured for the dsId
   */
  checkOnlyClosestConfiguredForDS = (dsId: string): boolean => {
    const analysisForDsId: string[] = []
    //get all the analysis types configured for the dsId
    this.state.analysisSettings?.layersInfo.forEach((layerInfo) => {
      if (dsId === layerInfo.useDataSource.dataSourceId) {
        analysisForDsId.push(layerInfo.analysisInfo.analysisType)
      }
    })
    //if proximity or summary is include return false else return true
    if (analysisForDsId.includes(AnalysisTypeName.Proximity) || analysisForDsId.includes(AnalysisTypeName.Summary)) {
      return false
    }
    return true
  }

  /**
 * emit event on search by rest button is clicked
 */
  onResetButtonClick = () => {
    this.aoiToolRef.current?.refreshButtonClicked()
  }

  /**
   * Get the Prompt display message in alert
   * @param layerName selected layer name
   * @returns prompt message string
   */
  getPromptMessageString = (layerName: string): string => {
    let getPromptTitleMessage = ''
    getPromptTitleMessage = this.props.intl.formatMessage({
      id: 'promptTitleMessageFromDataAction', defaultMessage: defaultMessages.promptTitleMessageFromDataAction
    }, { layerName: layerName })
    return getPromptTitleMessage
  }

  render () {
    const { showAllFeatures, searchByLocation, searchCurrentExtent } = getSearchWorkflow(this.state.searchSettings)

    if (!this.props.useMapWidgetIds?.[0]) {
      return (
        <WidgetPlaceholder
          icon={widgetIcon} widgetId={this.props.id}
          message={this.props.intl.formatMessage({ id: '_widgetLabel', defaultMessage: this.nls('_widgetLabel') })}
        />
      )
    }
    //showing loading indicator
    const showLoadingIndicator = !this.state?.jimuMapView || this.state.loadingAllFeaturesFromDs ||
      (this.state.displayLayerAccordion.length === 0 && !this.state.showNoResultsFoundMsg && (showAllFeatures || ((searchByLocation || searchCurrentExtent) && this.state.aoiGeometries)) && this.state.analysisSettings?.layersInfo.length > 0 && this.state.jimuMapView)

    return (
      <div css={getStyle(this.props.theme, this.state.listMaxHeight, this.state.generalSettings.noResultMsgStyleSettings, this.state.generalSettings.promptTextMsgStyleSettings, this.state.searchSettings?.headingLabelStyle)} className={'jimu-widget'}>
        <JimuMapViewComponent useMapWidgetId={this.props.useMapWidgetIds?.[0]} onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>
        <div className='widget-near-me'>
          <div className='main-row w-100 h-100'>
            <div ref={this.divRef}>
              {(searchByLocation || searchCurrentExtent) && this.state.jimuMapView && this.state.isLayerAvailable && this.state.isAnalysisLayerConfigured &&
                <AoiTool
                  ref={this.aoiToolRef}
                  theme={this.props.theme}
                  intl={this.props.intl}
                  headingLabel={this.state.searchSettings?.headingLabel}
                  showInputAddress={this.state.searchSettings?.showInputAddress}
                  config={this.state.searchSettings}
                  highlightColor={utils.getColorValue(this.state.generalSettings.highlightColor)}
                  jimuMapView={this.state.jimuMapView}
                  aoiComplete={this.onAoiComplete}
                  clear={this.onClear}
                  bufferLayer={this.bufferLayer}
                  drawingLayer={this.drawingLayer}
                  updateClosestAddressState={this.updateClosestAddressState}
                  msgActionGeometry={this.state.msgActionGeometry}
                  widgetWidth={this.state.widgetWidth}
                />}

              {/*Heading Label for show all features */}
              {showAllFeatures && this.state.jimuMapView && this.state.isLayerAvailable && this.state.isAnalysisLayerConfigured &&
                <Label className={'headingLabelStyle px-2 pt-2'}>{this.state.searchSettings?.headingLabel}</Label>
              }
              {/**
               * Show refresh button in following cases
               * 1. When layer results are shown OR
               * 2. When No result found msg shown (this condition to be inline with no found msg)
               *                 AND
               * 3. ShowAll features or SearchBy location is selected
              */}
              {(this.state.displayLayerAccordion?.length > 0 ||
                (this.state.displayLayerAccordion.length === 0 && this.state.showNoResultsFoundMsg && (showAllFeatures || (searchByLocation && this.state.aoiGeometries)) &&
                  this.state.analysisSettings?.layersInfo.length > 0 && this.state.isAnalysisLayerConfigured)) && this.state.isLayerAvailable &&
                (searchByLocation || showAllFeatures) && this.state.jimuMapView &&
                <React.Fragment>
                  <div className={'float-right'}>
                    <Button type='tertiary' aria-label={this.nls('refreshTooltip')} icon title={this.nls('refreshTooltip')} onClick={this.onRefreshResult}><RefreshOutlined /></Button>
                  </div>
                  {searchByLocation &&
                    <div className={'float-right'}>
                      <Button type='tertiary' aria-label={this.nls('clear')} icon title={this.nls('clear')} onClick={this.onResetButtonClick}><TrashOutlined /></Button>
                    </div>
                  }
                </React.Fragment>
              }
            </div>
            <div className={'layerContainer'}>
              {/* Loading indicator */}
              {showLoadingIndicator && <React.Fragment >
                <Loading type={LoadingType.Donut} />
                {(this.state.loadingAllFeaturesFromDs || this.state.analysisSettings?.layersInfo.length > 0) &&
                  <p className='loading-text pt-2'>{this.nls('loadingText')}</p>}
              </React.Fragment>
              }

              {/* Layers accordions */}
              {this.state.displayLayerAccordion.length > 0 && this.state.jimuMapView && this.state.isLayerAvailable &&
                <React.Fragment>
                  {this.state.displayLayerAccordion}
                </React.Fragment>}

              {/* Display prompt message*/}
              {!showLoadingIndicator && this.state.displayLayerAccordion.length === 0 && !this.state.showNoResultsFoundMsg && searchByLocation &&
                this.state.analysisSettings?.layersInfo.length > 0 && this.state.jimuMapView && this.state.isAnalysisLayerConfigured && this.state.isLayerAvailable &&
                <div className='applyPromptTextStyle'>
                  {this.state.generalSettings.promptTextMessage}
                </div>}

              {/* No result found message*/}
              {this.state.displayLayerAccordion.length === 0 && this.state.showNoResultsFoundMsg && (showAllFeatures || ((searchByLocation || searchCurrentExtent) && this.state.aoiGeometries)) &&
                this.state.analysisSettings?.layersInfo.length > 0 && this.state.jimuMapView && this.state.isAnalysisLayerConfigured && this.state.isLayerAvailable &&
                <div className='applyTextStyle'>
                  {this.state.generalSettings.noResultsFoundText}
                </div>}

              {/* No analysis layer is configured*/}
              {!this.state.isAnalysisLayerConfigured && this.state.isLayerAvailable &&
                <Alert tabIndex={0} withIcon={true} size='small' type='warning' className='w-100 shadow mb-1 m-0'>
                  <div className='flex-grow-1 text-break settings-text-level'>
                    {this.nls('noAnalysisLayerMsg')}
                  </div>
                </Alert>}

              {/* Map/Scene has no layers*/}
              {!this.state.isLayerAvailable &&
                <Alert tabIndex={0} withIcon={true} size='small' type='warning' className='w-100 shadow mb-1 m-0'>
                  <div className='flex-grow-1 text-break settings-text-level'>
                    {this.nls('warningMsgIfNoLayersOnMap')}
                  </div>
                </Alert>}
            </div>
          </div>
        </div>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />

        {/**Confirm Dialog whether to show all features analysis */
        this.state.promptForDataAction && !urlUtils.getAppIdPageIdFromUrl().pageId &&
          <ConfirmDialog
            level = 'info'
            title={this.getPromptMessageString(this.props.selectedDataSource?.getLabel())}
            hasNotShowAgainOption={false}
            content={this.nls('promptBottomMessageFromDataAction')}
            confirmLabel={this.nls('okButtonLabel')}
            cancelLabel={this.nls('commonModalCancel')}
            onConfirm={this.analyzeAllFeatures.bind(this)}
            onClose={this.onCancelButtonClicked.bind(this)}
          />
        }
      </div>
    )
  }
}
