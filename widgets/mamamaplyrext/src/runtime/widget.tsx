/** @jsx jsx */
import { React, jsx, type AllWidgetProps, DataSourceComponent, DataSourceManager, DataActionManager, ReactRedux, type IMState, type Immutable, type DataSourcesJson, dataSourceUtils, type WidgetsJson, DataLevel } from 'jimu-core'
import {
  type MapDataSource,
  DataSourceTypes,
  loadArcGISJSAPIModules,
  JimuMapViewComponent,
  type JimuMapView,
  MapViewManager
} from 'jimu-arcgis'
import { WidgetPlaceholder, DataActionList } from 'jimu-ui'
import { type IMConfig } from '../config'
import { getStyle } from './lib/style'
import type Action from './actions/action'
import Goto from './actions/goto'
import Label from './actions/label'
import Opacity from './actions/opacity'
import Information from './actions/information'
import defaultMessages from './translations/default'
import layerListIcon from '../../icon.svg'
import { versionManager } from '../version-manager'
import LayerFx from './actions/layerfx'

export enum LoadStatus {
  Pending = 'Pending',
  Fulfilled = 'Fulfilled',
  Rejected = 'Rejected',
}

export interface WidgetProps extends AllWidgetProps<IMConfig> {
  dataSourcesConfig: Immutable.ImmutableObject<DataSourcesJson>
  appWidgets: Immutable.ImmutableObject<WidgetsJson>
}

export interface WidgetState {
  mapViewWidgetId: string
  jimuMapViewId: string
  mapDataSourceId: string
  loadStatus: LoadStatus
  visibleLayers: any
  currentExpandedLayer: any
}

export class Widget extends React.PureComponent<
WidgetProps,
WidgetState
> {
  public viewFromMapWidget: __esri.MapView | __esri.SceneView
  private dataSource: MapDataSource
  private mapView: __esri.MapView
  private sceneView: __esri.SceneView
  private MapView: typeof __esri.MapView
  private SceneView: typeof __esri.SceneView
  public layerList: __esri.LayerList
  private LayerList: typeof __esri.LayerList
  private layerListActions: Action[]
  private renderPromise: Promise<void>
  private currentUseMapWidgetId: string
  private currentUseDataSourceId: string
  private jimuMapView: JimuMapView
  private readonly mountedOptionListenerSet: Set<any>

  private readonly observer = new MutationObserver((mutations) => {
    const hasMenus = mutations.some(mutation => {
      return (mutation.target as any)?.className === 'esri-layer-list__item-actions-menu-item'
    })

    // This is for checking whether some sub-layers are added
    const hasListItems = mutations.some(mutation => {
      return (mutation.target as any)?.className === 'esri-layer-list__item'
    })

    // Only try to mount the data action list when it's enabled
    if ((this.props.enableDataAction ?? true) && hasMenus) {
      const menus = (this.layerList.container as HTMLElement)?.querySelectorAll('.esri-layer-list__item-actions-menu-item')
      for (const menu of menus) {
        if (this.mountedOptionListenerSet.has(menu)) {
          continue
        }
        if (menu?.lastElementChild.className === 'esri-icon-handle-horizontal') {
          this.mountedOptionListenerSet.add(menu)
          // Add another listener for the options click
          menu.addEventListener('click', () => {
            for (const visibleItem of this.getAllVisibleItems()) {
              const ariaControlsValue: string = menu.attributes['aria-controls'].value
              if (ariaControlsValue.includes(visibleItem.uid)) {
                const mapDS = this.getMapDataSource() as MapDataSource

                this.addSpinToWidget(visibleItem)

                // The mapDS could be null if the map is empty or the layer is added during runtime
                if (mapDS) {
                  mapDS.createDataSourceByLayer(visibleItem.layer).catch(err => {
                    console.error('create data source by layer error:', err)
                  }).finally(() => {
                    // Only update when the layer DS is ready
                    this.setState({ currentExpandedLayer: visibleItem.layer })
                    this.mountDataActionList()
                    this.hideLayersByDOM()
                  })
                } else {
                  this.setState({ currentExpandedLayer: visibleItem.layer })
                  // Mount the data-action-list first, call in the hook is jumped once clicked on the same layer
                  this.mountDataActionList()
                  this.hideLayersByDOM()
                  return
                }
              }
            }
          })
        }
      }
    }

    if (hasListItems) {
      this.hideLayersByDOM()
    }
  })

  static versionManager = versionManager

  public refs: {
    mapContainer: HTMLInputElement
    layerListContainer: HTMLInputElement
    actionListContainer: HTMLDivElement
    loadingSpinContainer: HTMLDivElement
  }

  constructor (props) {
    super(props)
    this.state = {
      mapViewWidgetId: null,
      mapDataSourceId: null,
      jimuMapViewId: null,
      loadStatus: LoadStatus.Pending,
      visibleLayers: [],
      currentExpandedLayer: null
    }
    this.renderPromise = Promise.resolve()
    this.registerLayerListActions()
    this.mountedOptionListenerSet = new Set()
  }

  private addSpinToWidget (visibleItem) {
    const dom = document.querySelector(`div[id*="${visibleItem.uid}_actions"]`)
    const classesToReplace = ['data-action-list-wrapper', 'data-action-list-loading', 'invalid-ds-message']

    if (dom.lastElementChild && (dom.lastElementChild?.lastElementChild?.attributes.getNamedItem('title')?.value === '' ||
        classesToReplace.includes(dom.lastElementChild.className))) {
      dom.lastChild.replaceWith(this.refs?.loadingSpinContainer)
    } else {
      // The last child is native action, append the loading-spin
      dom.append(this.refs?.loadingSpinContainer)
    }
  }

  private translate (stringId: string) {
    return this.props.intl.formatMessage({
      id: stringId,
      defaultMessage: defaultMessages[stringId]
    })
  }

  componentDidMount () {}

  componentDidUpdate (prevProps, prevState) {
    if (this.needToPreventRefresh(prevProps)) {
      return
    }

    if ((prevState.visibleLayers !== this.state.visibleLayers) ||
      (prevState.currentExpandedLayer !== this.state.currentExpandedLayer)) {
      // If re-render is caused by the layers change / expanded layer change, DO NOT create the layer-list again
      this.mountDataActionList()
      this.hideLayersByDOM()
      return
    }

    this.updateRenderer()
  }

  updateRenderer () {
    if (this.props.config.useMapWidget) {
      if (this.state.mapViewWidgetId === this.currentUseMapWidgetId) {
        this.syncRenderer(this.renderPromise)
      }
    } else {
      if (this.state.mapDataSourceId === this.currentUseDataSourceId) {
        this.syncRenderer(this.renderPromise)
      }
    }
  }

  needToPreventRefresh (prevProps) {
    if (this.props.appWidgets !== prevProps.appWidgets) {
      const newTableKeys = Object.keys(this.props.appWidgets || {}).filter(key => this.props.appWidgets[key].uri === 'widgets/common/table/')
      const oldTableKeys = Object.keys(prevProps.appWidgets || {}).filter(key => prevProps.appWidgets[key].uri === 'widgets/common/table/')
      // The number of table widgets is the same
      if (newTableKeys.length === oldTableKeys.length &&
          this.props.appWidgets[this.props.id] === prevProps.appWidgets[this.props.id]) {
        // Table doesn't change AND widget doesn't change
        return true
      }
    }
    return false
  }

  async createView () {
    if (this.props.config.useMapWidget) {
      return await Promise.resolve(this.viewFromMapWidget)
    } else {
      return await this.createViewByDatatSource()
    }
  }

  async createViewByDatatSource () {
    return await this.loadViewModules(this.dataSource).then(async () => {
      if (this.dataSource.type === DataSourceTypes.WebMap) {
        return await new Promise((resolve, reject) => { this.createWebMapView(this.MapView, resolve, reject) }
        )
      } else if (this.dataSource.type === DataSourceTypes.WebScene) {
        return new Promise((resolve, reject) => { this.createSceneView(this.SceneView, resolve, reject) }
        )
      } else {
        return Promise.reject()
      }
    })
  }

  createWebMapView (MapView, resolve, reject) {
    if (this.mapView) {
      this.mapView.map = this.dataSource.map
    } else {
      const mapViewOption: __esri.MapViewProperties = {
        map: this.dataSource.map,
        container: this.refs.mapContainer
      }
      this.mapView = new MapView(mapViewOption)
    }
    this.mapView.when(
      () => {
        resolve(this.mapView)
      },
      (error) => reject(error)
    )
  }

  createSceneView (SceneView, resolve, reject) {
    if (this.sceneView) {
      this.sceneView.map = this.dataSource.map
    } else {
      const mapViewOption: __esri.SceneViewProperties = {
        map: this.dataSource.map,
        container: this.refs.mapContainer
      }
      this.sceneView = new this.SceneView(mapViewOption)
    }

    this.sceneView.when(
      () => {
        resolve(this.sceneView)
      },
      (error) => reject(error)
    )
  }

  destroyView () {
    this.mapView && !this.mapView.destroyed && this.mapView.destroy()
    this.sceneView && !this.sceneView.destroyed && this.sceneView.destroy()
  }

  async loadViewModules (
    dataSource: MapDataSource
  ): Promise<typeof __esri.MapView | typeof __esri.SceneView> {
    if (dataSource.type === DataSourceTypes.WebMap) {
      if (this.MapView) {
        return await Promise.resolve(this.MapView)
      }
      return await loadArcGISJSAPIModules(['esri/views/MapView']).then(
        (modules) => {
          [this.MapView] = modules
          return this.MapView
        }
      )
    } else if (dataSource.type === DataSourceTypes.WebScene) {
      if (this.SceneView) {
        return Promise.resolve(this.SceneView)
      }
      return loadArcGISJSAPIModules(['esri/views/SceneView']).then(
        (modules) => {
          [this.SceneView] = modules
          return this.SceneView
        }
      )
    } else {
      return Promise.reject()
    }
  }

  destroyLayerList () {
    this.layerList && !this.layerList.destroyed && this.layerList.destroy()
  }

  async componentWillUnmount () {
    this.observer.disconnect()
  }

  createLayerList (view) {
    let layerListModulePromise
    if (this.LayerList) {
      layerListModulePromise = Promise.resolve()
    } else {
      layerListModulePromise = loadArcGISJSAPIModules([
        'esri/widgets/LayerList'
      ]).then((modules) => {
        [this.LayerList] = modules
      })
    }
    return layerListModulePromise.then(() => {
      const container = document && document.createElement('div')
      container.className = 'jimu-widget'
      this.refs.layerListContainer.appendChild(container)

      this.destroyLayerList()

      // Data action enabled, clean up listener set
      if (this.props.enableDataAction ?? true) {
        this.mountedOptionListenerSet.clear()
      }

      // The DOM needs to be observed all the time, because sub-layers may not be ready
      this.observer.observe(this.refs.layerListContainer, { childList: true, subtree: true })

      const newList = new this.LayerList({
        view: view,
        listItemCreatedFunction: this.defineLayerListActions,
        container: container
      })
      this.layerList = newList

      this.layerList.when(() => {
        // No better way yet, since don't know when all children items are ready
        setTimeout(() => {
          this.setState({ visibleLayers: this.getAllVisibleItems().map(item => item.layer) })
        }, 300)
      })

      this.configLayerList()

      this.layerList.on('trigger-action', (event) => {
        // console.log('trigger-action', event)
        this.onLayerListActionsTriggered(event)
      })
    })
  }

  registerLayerListActions () {
    this.layerListActions = [
      new LayerFx(
        this,
        this.translate('layerfx')
      ),
      new Goto(
        this,
        this.translate('goto')
      ),
      new Label(
        this,
        this.translate('showLabels'),
        this.translate('hideLabels')
      ),
      new Opacity(
        this,
        this.translate('increaseTransparency'),
        false
      ),
      new Opacity(
        this,
        this.translate('decreaseTransparency'),
        true
      ),
      new Information(
        this,
        this.translate('information')
      )
    ]
  }

  getMapDataSource = () => {
    let mapDS = null
    if (this.props.config.useMapWidget) {
      mapDS = DataSourceManager.getInstance().getDataSource(this.jimuMapView?.dataSourceId) as MapDataSource
    } else {
      mapDS = this.dataSource
    }
    return mapDS
  }

  createDataActionList = (layer) => {
    // The map data source might come from a data-source object or from a map widget data-source id

    // Get the newest jimuMapView instance
    this.jimuMapView = MapViewManager.getInstance().getJimuMapViewById(this.state.jimuMapViewId)

    const mapDS = this.getMapDataSource() as MapDataSource
    const featureDS = mapDS?.getDataSourceByLayer(layer)

    const jimuLayerId = dataSourceUtils.getJimuLayerIdByJSAPILayer(layer)

    if (!featureDS) {
      // No valid data-source, create an empty message
      return <div ref={jimuLayerId} key={jimuLayerId} className='invalid-ds-message'>
        {this.translate('noActions')}
      </div>
    }

    const dataSet = { dataSource: featureDS, records: [], name: featureDS?.getLabel() }

    return (
      <div ref={jimuLayerId} key={jimuLayerId} className="data-action-list-wrapper">
        <DataActionList widgetId={this.props.id} dataSets={[dataSet]} hideGroupTitle></DataActionList>
      </div>
    )
  }

  getSupportedDataActions = async (layer) => {
    const mapDS = this.getMapDataSource() as MapDataSource
    const featureDS = mapDS?.getDataSourceByLayer(layer)

    if (!featureDS) {
      return false
    }

    const dataSet = { dataSource: featureDS, records: [], name: featureDS?.getLabel() }
    const actionsPromise = DataActionManager.getInstance().getSupportedActions(this.props.id, [dataSet], DataLevel.DataSource)

    const actions = await actionsPromise || {}
    return actions
  }

  shouldPushEmptyActions = async (item, actionGroups) => {
    // Don't push empty nodes if data action is disabled
    if (!(this.props.enableDataAction ?? true)) {
      return false
    }
    return true
  }

  defineLayerListActions = async (event) => {
    const item = event.item
    const actionGroups = {}
    item.actionsSections = []

    if (this.props.config?.useMapWidget && this.props.config?.enableLegend && item.layer.legendEnabled) {
      item.panel = {
        content: 'legend',
        open: item.layer.visible && this.props.config?.showAllLegend
      }
    }

    this.layerListActions.forEach((actionObj) => {
      if (actionObj.isValid(item)) {
        let actionGroup = actionGroups[actionObj.group]
        if (!actionGroup) {
          actionGroup = []
          actionGroups[actionObj.group] = actionGroup
        }

        actionGroup.push({
          id: actionObj.id,
          title: actionObj.title,
          className: actionObj.className
        })
      }
    })

    if (await this.shouldPushEmptyActions(item, actionGroups)) {
      const EMPTY_ACTION_INDEX = 10
      actionGroups[EMPTY_ACTION_INDEX] = [
        { id: '', title: '', className: '' },
        { id: '', title: '', className: '' }]
    }

    Object.entries(actionGroups)
      .sort((v1, v2) => Number(v1[0]) - Number(v2[0]))
      .forEach(([key, value]) => {
        item.actionsSections.push(value)
      })
  }

  configLayerList () {
    if (!this.props.config.setVisibility || !this.props.config.useMapWidget) {
      // @ts-expect-error
      this.layerList._toggleVisibility = function () {}
    }
  }

  onLayerListActionsTriggered = (event) => {
    const action = event.action
    const item = event.item
    const actionObj = this.layerListActions.find(
      (actionObj) => actionObj.id === action.id
    )
    actionObj.execute(item)
  }

  async renderLayerList () {
    await this.createView()
      .then((view) => {
        return this.createLayerList(view)
      })
      .then(() => {
        this.setState({
          loadStatus: LoadStatus.Fulfilled
        })
      })
      .catch((error) => { console.error(error) })
  }

  syncRenderer (preRenderPromise) {
    this.jimuMapView = MapViewManager.getInstance().getJimuMapViewById(this.state.jimuMapViewId)

    this.renderPromise = new Promise((resolve, reject) => {
      preRenderPromise.then(() => {
        this.refs.layerListContainer.style.display = 'none'
        this.renderLayerList()
          .then(() => {
            resolve(null)
          })
          .catch(() => { reject() })
      })
    })
  }

  hideLayersByDOM () {
    const customizeLayerOptions = this.props?.config?.customizeLayerOptions?.[this.state.jimuMapViewId]
    if (!this.state.mapViewWidgetId || !customizeLayerOptions?.isEnabled) {
      this.refs.layerListContainer.style.display = 'block'
      return
    }

    this.getAllVisibleItems().forEach(async (visibleItem) => {
      // If not using map widget, don't touch layer instances, just return
      const currentJimuLayerId = dataSourceUtils.getJimuLayerIdByJSAPILayer(visibleItem.layer)
      const hiddenLayerSet = new Set(customizeLayerOptions?.hiddenJimuLayerViewIds)

      for (const hiddenJimuLayerId of hiddenLayerSet) {
        if (hiddenJimuLayerId.endsWith(currentJimuLayerId)) {
          const dom: HTMLElement = this.refs.layerListContainer.querySelector(`li[aria-labelledby*="${visibleItem.uid}"]`)
          if (dom) {
            dom.style.display = 'none'
          }
        }
      }
    })

    let visibleLiCount = 0
    const ulDom: HTMLElement = this.refs.layerListContainer.querySelector('ul[data-group="root"]')

    ulDom.childNodes.forEach((liDom: HTMLElement) => {
      if (liDom.style.display === 'none') {
        visibleLiCount++
      }
    })

    if (visibleLiCount === ulDom.childNodes.length) {
      const div = document.createElement('div')
      div.textContent = this.translate('emptyListTip')
      ulDom.appendChild(div)
    }

    this.refs.layerListContainer.style.display = 'block'
  }

  mountDataActionList () {
    if (!(this.props.enableDataAction ?? true)) {
      return
    }
    if (!this.state.currentExpandedLayer) {
      return
    }

    this.getAllVisibleItems().forEach(async (visibleItem) => {
      const activeJimuLayerId = dataSourceUtils.getJimuLayerIdByJSAPILayer(this.state.currentExpandedLayer)
      const currentJimuLayerId = dataSourceUtils.getJimuLayerIdByJSAPILayer(visibleItem.layer)
      if (activeJimuLayerId !== currentJimuLayerId) {
        return
      }
      const dom = document.querySelector(`div[id*="${visibleItem.uid}_actions"]`)

      this.addSpinToWidget(visibleItem)

      const dataActionsLength = Object.keys(await this.getSupportedDataActions(visibleItem.layer)).length
      // Minus 1 because we always push a fake group
      const nativeActionsLength = visibleItem.actionsSections.length - 1

      // Finish loading, replace / remove the loading spin
      const isLastChildFakeNode = this.refs?.[activeJimuLayerId] && dom?.lastElementChild?.lastElementChild?.attributes.getNamedItem('title')?.value === ''
      const isLastChildLoadingSpin = this.refs?.[activeJimuLayerId] && dom?.lastElementChild?.className === 'data-action-list-loading'
      // When there's a fake node group OR loading-spin
      if (isLastChildFakeNode || isLastChildLoadingSpin) {
        if (nativeActionsLength > 0 && dataActionsLength === 0) {
          // Remove the appended node when no data-action list, but native actions
          dom.lastChild?.remove()
        } else {
          dom.lastChild?.replaceWith(this.refs?.[activeJimuLayerId])
        }
      }
    })
  }

  getAllVisibleItems = () => {
    const allItems = []
    const helper = (item) => {
      allItems.push(item)
      item.children.forEach(child => { helper(child) })
    }

    for (const item of (this.layerList as any)?.visibleItems.items || []) {
      helper(item)
    }
    return allItems
  }

  onActiveViewChange = (jimuMapView: JimuMapView) => {
    const useMapWidget =
      this.props.useMapWidgetIds && this.props.useMapWidgetIds[0]
    if ((jimuMapView && jimuMapView.view) || !useMapWidget) {
      this.viewFromMapWidget = jimuMapView && jimuMapView.view
      this.setState({
        mapViewWidgetId: useMapWidget,
        jimuMapViewId: jimuMapView.id,
        loadStatus: LoadStatus.Pending
      })
    } else {
      this.destroyLayerList()
    }
  }

  onDataSourceCreated = (dataSource: MapDataSource): void => {
    this.dataSource = dataSource
    this.setState({
      mapDataSourceId: dataSource.id,
      loadStatus: LoadStatus.Pending
    })
  }

  // eslint-disable-next-line
  onCreateDataSourceFailed = (error): void => {};

  render () {
    const useMapWidget =
      this.props.useMapWidgetIds && this.props.useMapWidgetIds[0]
    const useDataSource =
      this.props.useDataSources && this.props.useDataSources[0]

    this.currentUseMapWidgetId = useMapWidget
    this.currentUseDataSourceId = useDataSource && useDataSource.dataSourceId

    let dataSourceContent = null
    if (this.props.config.useMapWidget) {
      dataSourceContent = (
        <JimuMapViewComponent
          useMapWidgetId={this.props.useMapWidgetIds?.[0]}
          onActiveViewChange={this.onActiveViewChange}
        />
      )
    } else if (useDataSource) {
      dataSourceContent = (
        <DataSourceComponent
          useDataSource={useDataSource}
          onDataSourceCreated={this.onDataSourceCreated}
          onCreateDataSourceFailed={this.onCreateDataSourceFailed}
        />
      )
    }

    let content = null
    if (this.props.config.useMapWidget ? !useMapWidget : !useDataSource) {
      this.destroyLayerList()
      content = (
        <div className="widget-layerlist">
          <WidgetPlaceholder
            icon={layerListIcon}
            message={this.translate('_widgetLabel')}
            widgetId={this.props.id}
          />
        </div>
      )
    } else {
      let loadingContent = null
      if (this.state.loadStatus === LoadStatus.Pending) {
        loadingContent = <div className="jimu-secondary-loading" />
      }

      content = (
        <div className={`widget-layerlist widget-layerlist_${this.props.id}`}>
          {loadingContent}
          <div ref="layerListContainer" style={{ display: 'none' }} />
          <div style={{ position: 'absolute', opacity: 0 }} ref="mapContainer">
            mapContainer
          </div>
          <div style={{ position: 'absolute', display: 'none' }}>
            {dataSourceContent}
          </div>
        </div>
      )
    }

    return (
      <div
        css={getStyle(this.props.theme, this.props.config)}
        className="jimu-widget"
      >
        {content}
        <div key={Math.random()} style={{ height: '0px', overflow: 'hidden' }}>
          {this.state.currentExpandedLayer && this.createDataActionList(this.state.currentExpandedLayer)}
          <div ref='loadingSpinContainer' className='data-action-list-loading' >
            <div className='dot-loading'></div>
          </div>
        </div>
      </div>
    )
  }
}

export default ReactRedux.connect((state: IMState) => {
  const s = state.appStateInBuilder?.appConfig || state.appConfig
  return {
    dataSourcesConfig: s?.dataSources,
    appWidgets: s?.widgets
  }
})(Widget)
