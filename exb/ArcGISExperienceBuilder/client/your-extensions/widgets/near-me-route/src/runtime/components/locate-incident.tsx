/** @jsx jsx */
import { React, jsx, type IntlShape, type IMThemeVariables } from 'jimu-core'
import { Button, defaultMessages as jimuUIDefaultMessages } from 'jimu-ui'
import { getLocateIncidentStyle } from '../lib/style'
import { PinEsriOutlined } from 'jimu-icons/outlined/gis/pin-esri'
import { PolylineOutlined } from 'jimu-icons/outlined/gis/polyline'
import { PolygonOutlined } from 'jimu-icons/outlined/gis/polygon'
import { type SearchSettings } from '../../config'
import defaultMessages from '../translations/default'
import type Graphic from 'esri/Graphic'
import { type JimuMapView } from 'jimu-arcgis'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import { MapOutlined } from 'jimu-icons/outlined/gis/map'
import SketchViewModel from 'esri/widgets/Sketch/SketchViewModel'
import { getSketchSymbol } from '../../common/highlight-symbol-utils'
import reactiveUtils from 'esri/core/reactiveUtils'
import { getSearchWorkflow } from '../../common/utils'

interface Props {
  theme: IMThemeVariables
  intl: IntlShape
  config: SearchSettings
  jimuMapView: JimuMapView
  highlightColor: string
  sketchComplete: (sketchedGraphic: Graphic) => void
  refreshClicked: () => void
  searchByMapAreaClicked: () => void
  drawToolSelectionChange: () => void
  showInfoIcon: (showInfoIcon: boolean) => void
}

interface State {
  isPolygonActive: boolean
  isPointActive: boolean
  isPolyLineActive: boolean
  searchSettings: SearchSettings
  currentSketchVM: SketchViewModel
}

export default class LocateIncident extends React.PureComponent<Props, State> {
  constructor (props) {
    super(props)

    this.state = {
      isPolygonActive: false,
      isPointActive: false,
      isPolyLineActive: false,
      searchSettings: this.props.config,
      currentSketchVM: null
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
    if (this.props.jimuMapView?.view) {
      //create the skecth view model instance
      this.createSketchVmInstance()
      const { searchCurrentExtent } = getSearchWorkflow(this.props.config)
      if (searchCurrentExtent) {
        this.onSearchClicked()
      }

      reactiveUtils.when(() => this.props.jimuMapView?.view?.stationary, () => {
        const { searchCurrentExtent } = getSearchWorkflow(this.props.config)
        if (searchCurrentExtent) {
          this.props.showInfoIcon(true)
        }
      })
    }
  }

  /**
   * Create a new instance of sketchViewModel include point, polyline and polygon symbol
   */
  createSketchVmInstance = () => {
    const sketchVM = new SketchViewModel({
      view: this.props.jimuMapView?.view ? this.props.jimuMapView.view : null,
      layer: new GraphicsLayer(),
      pointSymbol: getSketchSymbol('point', this.props.highlightColor),
      polylineSymbol: getSketchSymbol('polyline', this.props.highlightColor),
      polygonSymbol: getSketchSymbol('polygon', this.props.highlightColor)
    })

    sketchVM.on('create', this.onCreateComplete)

    this.setState({
      currentSketchVM: sketchVM
    })
  }

  /**
   * Check the current config property or runtime property changed in live view
   * @param prevProps previous property
   */
  componentDidUpdate = (prevProps) => {
    //check if mapview changed at runtime then destroy the existing sketch view model instance
    if (prevProps.jimuMapView.id !== this.props.jimuMapView.id) {
      if (this.state.currentSketchVM && !this.state.currentSketchVM.destroyed) {
        this.state.currentSketchVM.destroy()
        this.createSketchVmInstance()
      }
    }

    //check if searchByActiveMapArea config is changed
    const { searchCurrentExtent } = getSearchWorkflow(this.props.config)
    if (this.props.config?.searchByActiveMapArea !== prevProps.config?.searchByActiveMapArea ||
      this.props.config?.includeFeaturesOutsideMapArea !== prevProps.config?.includeFeaturesOutsideMapArea) {
      if (searchCurrentExtent) {
        this.onSearchClicked()
      }
    }

    //updates the highlight color in live mode when the color is changes and tool is active
    if (this.props.highlightColor !== prevProps.highlightColor && this.state.currentSketchVM) {
      if (this.state.isPolygonActive) {
        this.state.currentSketchVM.set('polygonSymbol', getSketchSymbol('polygon', this.props.highlightColor))
      } else if (this.state.isPolyLineActive) {
        this.state.currentSketchVM.set('polylineSymbol', getSketchSymbol('polyline', this.props.highlightColor))
      } else if (this.state.isPointActive) {
        this.state.currentSketchVM.set('pointSymbol', getSketchSymbol('point', this.props.highlightColor))
      }
    }
  }

  /**
   * On widget delete cancel the sketch view model
   */
  componentWillUnmount = () => {
    if (this.state.currentSketchVM) {
      this.state.currentSketchVM?.cancel()
    }
  }

  /**
   * emit event on search by map area icon is clicked
   */
  onSearchClicked = () => {
    this.props.showInfoIcon(false)
    this.props.searchByMapAreaClicked()
    this.clearAll()
  }

  /**
   * emit event on search by rest button is clicked
   */
  onResetButtonClick = () => {
    this.props.refreshClicked()
  }

  /**
   * clear all graphics layer and states
   */
  clearAll = () => {
    if (this.state.currentSketchVM) {
      this.state.currentSketchVM.cancel()
    }
    this.props.jimuMapView.clearSelectedFeatures()
    this.setState({
      isPolygonActive: false,
      isPointActive: false,
      isPolyLineActive: false
    })
  }

  /**
   * handles draw tool selection change event
   * @param toolBtn selected tool
   */
  onDrawToolBtnChanges = (toolBtn: 'polygon' | 'point' | 'polyline') => {
    this.props.drawToolSelectionChange()
    this.clearAll()
    switch (toolBtn) {
      case 'polygon':
        if (this.state.isPolygonActive) {
          this.state.currentSketchVM.cancel()
        } else {
          this.state.currentSketchVM.set('polygonSymbol', getSketchSymbol('polygon', this.props.highlightColor))
          this.state.currentSketchVM.create('polygon')
          this.setState({
            isPolygonActive: true,
            isPointActive: false,
            isPolyLineActive: false
          })
        }
        break
      case 'point':
        if (this.state.isPointActive) {
          this.state.currentSketchVM.cancel()
        } else {
          this.state.currentSketchVM.set('pointSymbol', getSketchSymbol('point', this.props.highlightColor))
          this.state.currentSketchVM.create('point')
          this.state.currentSketchVM.pointSymbol.size = 14
          this.setState({
            isPolygonActive: false,
            isPointActive: true,
            isPolyLineActive: false
          })
        }
        break
      case 'polyline':
        if (this.state.isPolyLineActive) {
          this.state.currentSketchVM.cancel()
        } else {
          this.state.currentSketchVM.set('polylineSymbol', getSketchSymbol('polyline', this.props.highlightColor))
          this.state.currentSketchVM.create('polyline')
          this.setState({
            isPolygonActive: false,
            isPointActive: false,
            isPolyLineActive: true
          })
        }
        break
      default:
        this.state.currentSketchVM.cancel()
    }
  }

  /**
   * handle sketch view complete event
   * @param event sketch view complete event
   */
  onCreateComplete = (event) => {
    if (event.state === 'complete') {
      //emit event sketch complete
      this.props.sketchComplete(event)
      this.setState({
        isPointActive: false,
        isPolyLineActive: false,
        isPolygonActive: false
      })
    } else if (event.state === 'cancel') {
      this.setState({
        isPointActive: false,
        isPolyLineActive: false,
        isPolygonActive: false
      })
    }
  }

  render () {
    const { searchCurrentExtent } = getSearchWorkflow(this.props.config)
    const { sketchTools } = this.props.config
    const showSketchTools = sketchTools.showPoint || sketchTools.showPolyline || sketchTools.showPolygon
    return (
      <div css={getLocateIncidentStyle(this.props.theme)} className="jimu-widget">
          {!searchCurrentExtent && showSketchTools &&
            <div className='w-100 d-flex locate-incident-section'>
              <div className='column-section pr-1'>
              {(sketchTools?.showPoint) &&
                <Button type='tertiary' className='action-button' icon aria-label={this.nls('point')} title={this.nls('point')} active={this.state.isPointActive}
                  onClick={() => { this.onDrawToolBtnChanges('point') }}>
                  <PinEsriOutlined size={'m'} />
                </Button>}
              {(sketchTools?.showPolyline) &&
                <Button type='tertiary' className='action-button' icon aria-label={this.nls('polyline')} title={this.nls('polyline')} active={this.state.isPolyLineActive}
                  onClick={() => { this.onDrawToolBtnChanges('polyline') }}>
                  <PolylineOutlined size={'m'} />
                </Button>}
              {(sketchTools?.showPolygon) &&
                <Button type='tertiary' className='action-button' icon aria-label={this.nls('polygon')} title={this.nls('polygon')} active={this.state.isPolygonActive}
                  onClick={() => { this.onDrawToolBtnChanges('polygon') }}>
                  <PolygonOutlined size={'m'} />
                </Button>}
            </div>
            </div>
          }

          {searchCurrentExtent &&
            <div className={'column-section shadow-sm w-100'} onClick={this.onSearchClicked}>
              <Button className='w-100' onClick={this.onSearchClicked} size="default" aria-label={this.nls('searchByActiveMapArea')} title={this.nls('searchByActiveMapArea')}>
                <MapOutlined size={'m'} />
                <label className={'mb-0 align-middle'}>{this.nls('updateResultsLabel')}</label>
              </Button>
            </div>
          }
      </div>
    )
  }
}
