/** @jsx jsx */
import { React, jsx, type IntlShape, type IMThemeVariables, getAppStore } from 'jimu-core'
import { Label, Tooltip } from 'jimu-ui'
import { getAoiToolStyle } from '../lib/style'
import Graphic from 'esri/Graphic'
import { geometryUtils, type JimuMapView } from 'jimu-arcgis'
import { type SearchSettings } from '../../config'
import LocateIncident from './locate-incident'
import BufferTool from './buffer-tool'
import type Geometry from 'esri/geometry/Geometry'
import SpatialReference from 'esri/geometry/SpatialReference'
import locator from 'esri/rest/locator'
import Polygon from 'esri/geometry/Polygon'
import defaultMessages from '../translations/default'
import { type Extent } from 'esri/geometry'
import { getBufferSymbol, getSketchSymbol } from '../../common/highlight-symbol-utils'
import { defaultBufferDistance } from '../../setting/constants'
import { getPortalUnit, getSearchWorkflow } from '../../common/utils'
import { InfoOutlined } from 'jimu-icons/outlined/suggested/info'

const portalSelf = getAppStore().getState().portalSelf

interface Props {
  theme: IMThemeVariables
  intl: IntlShape
  headingLabel: string
  config: SearchSettings
  jimuMapView: JimuMapView
  highlightColor: string
  msgActionGeometry: Geometry
  widgetWidth?: number
  aoiComplete: (aoiGeometries: AoiGeometries) => void
  clear: () => void
  updateClosestAddressState: (isClosestAddressShowing: boolean) => void
  bufferLayer: __esri.GraphicsLayer
  drawingLayer: __esri.GraphicsLayer
  showInputAddress: boolean
}

interface State {
  defaultDistanceUnits: string
  defaultBufferDistance: number
  bufferGeometry: Geometry
  incidentGeometry: Geometry
  incidentGeometry4326: Geometry
  geodesicBuffer: Geometry
  searchSettings: SearchSettings
  refreshButtonClicked: boolean
  closestAddress: string
  searchByActiveMapArea: boolean
  showDistSettings: boolean
  showInfoIcon: boolean
}

export interface AoiGeometries {
  incidentGeometry: Geometry
  incidentGeometry4326: Geometry
  bufferGeometry: Geometry
  geodesicBuffer: Geometry
  distanceUnit: string
  bufferDistance: number
}

export default class AoiTool extends React.PureComponent<Props, State> {
  public graphic: __esri.Graphic
  public currentBufferDistance: number
  public currentDistanceUnit: string

  constructor (props) {
    super(props)
    //distance Unit is blank then use portal unit as default distance unit
    const defaultDistanceUnit = (this.props.config && this.props.config.distanceUnits !== '') ? this.props.config?.distanceUnits : getPortalUnit()
    this.currentBufferDistance = this.props.config?.bufferDistance ?? defaultBufferDistance
    this.currentDistanceUnit = defaultDistanceUnit
    this.state = {
      defaultDistanceUnits: defaultDistanceUnit,
      defaultBufferDistance: this.props.config?.bufferDistance ?? defaultBufferDistance,
      bufferGeometry: null,
      incidentGeometry: null,
      incidentGeometry4326: null,
      geodesicBuffer: null,
      searchSettings: this.props.config,
      refreshButtonClicked: false,
      closestAddress: null,
      searchByActiveMapArea: this.props.config?.searchByActiveMapArea,
      showDistSettings: this.props.config?.showDistanceSettings,
      showInfoIcon: false
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
    if (this.props.jimuMapView?.view) {
      //when view is loaded and searchByActiveMapArea is enabled then clear all the graphics from map
      this.props.jimuMapView.view.when(() => {
        if (this.state.searchByActiveMapArea) {
          this.clearAll()
        }
      })
    }
  }

  /**
   * Check the current config property or runtime property changed in live view
   * @param prevProps previous property
   */
  componentDidUpdate = (prevProps) => {
    //check whether map view is changed
    if (prevProps.jimuMapView?.id !== this.props.jimuMapView?.id) {
      this.clearAll()
    }

    //check if searchByActiveMapArea is changed
    if (this.props.config?.searchByActiveMapArea !== prevProps.config?.searchByActiveMapArea) {
      this.clearAll()
      setTimeout(() => {
        this.setState({
          searchByActiveMapArea: this.props.config?.searchByActiveMapArea
        })
      }, 50)
    }

    //check if configured distance units is changed
    if (prevProps.config?.distanceUnits !== this.props.config?.distanceUnits) {
      this.setState({
        defaultDistanceUnits: this.props.config?.distanceUnits ? this.props.config?.distanceUnits : getPortalUnit()
      })
    }

    //check if configured buffer distance is changed
    if (prevProps.config?.bufferDistance !== this.props.config?.bufferDistance) {
      this.setState({
        defaultBufferDistance: this.props.config?.bufferDistance
      })
    }

    //check if distance changed
    if (prevProps.config?.showDistanceSettings !== this.props.config?.showDistanceSettings) {
      this.setState({
        showDistSettings: this.props.config?.showDistanceSettings
      }, () => {
        //Clear existing AOi
        this.clearAll()
      })
    }

    //check if configured highlight color is changed and create the sketch symbol depending on the highlight color
    if (prevProps.highlightColor !== this.props?.highlightColor) {
      if (this.graphic?.geometry?.type) {
        const sketchSymbol = getSketchSymbol(this.graphic.geometry.type, this.props.highlightColor)
        if (sketchSymbol) {
          this.graphic.set('symbol', sketchSymbol)
        }
      }

      if (this.props.bufferLayer?.graphics?.length > 0) {
        const bufferSymbol = getBufferSymbol(this.props.highlightColor)
        if (bufferSymbol) {
          this.props.bufferLayer.graphics.forEach((graphic) => {
            graphic.set('symbol', bufferSymbol)
          })
        }
      }
    }

    //check msg action geometry and use msg action geometry as incident geometry
    if (prevProps.msgActionGeometry !== this.props.msgActionGeometry) {
      this.onDrawIncidentComplete(this.props.msgActionGeometry)
    }
  }

  /**
   * On widget delete clear all the graphics from the map
   */
  componentWillUnmount = () => {
    this.clearAll()
  }

  /**
   * handle event emitted by locate incident on sketch complete
   * @param event sketch view model complete event
   */
  onSketchComplete = (event) => {
    this.onDrawIncidentComplete(event.graphic.geometry)
  }

  /**
   * Draw the incident geometry and add the graphics on the map
   * @param geometry Incident geometry
   */
  onDrawIncidentComplete = (geometry) => {
    if (!geometry) {
      return
    }
    this.clearAll()
    this.showClosestAddress(geometry)
    const mapSR = this.props.jimuMapView.view.spatialReference
    if (mapSR && (mapSR.isWGS84 || mapSR.isWebMercator)) {
      geometryUtils.projectToSpatialReference([geometry],
        new SpatialReference({ wkid: 4326 })).then((projectedGeometries) => {
        if (projectedGeometries?.length > 0) {
          this.graphic = new Graphic({
            geometry: geometry,
            symbol: getSketchSymbol(geometry.type, this.props.highlightColor)
          })
          this.props.drawingLayer.add(this.graphic)
          this.setState({
            incidentGeometry: geometry,
            incidentGeometry4326: projectedGeometries[0],
            bufferGeometry: null,
            geodesicBuffer: null
          })
        }
      }, (err) => {
        console.log(err)
      })
    } else {
      this.graphic = new Graphic({
        geometry: geometry,
        symbol: getSketchSymbol(geometry.type, this.props.highlightColor)
      })
      this.props.drawingLayer.add(this.graphic)
      this.setState({
        incidentGeometry: geometry,
        incidentGeometry4326: null,
        bufferGeometry: null,
        geodesicBuffer: null
      })
    }
  }

  /**
   * handle event emitted by locate incident on map area icon is clicked
   */
  onSearchByMapAreaClicked = () => {
    this.getMapExtentGeometry()
  }

  /**
   * get map extent and center geometry
   * Update states: incidentGeometry, bufferGeometry, incidentGeometry4326
   * Get map center to find closest address
   */
  getMapExtentGeometry = () => {
    this.clearAll()
    if (this.props?.jimuMapView) {
      const mapExtent: Extent = this.props.jimuMapView.view.extent
      const ringLayoutPerim = [[mapExtent.xmin, mapExtent.ymin], [mapExtent.xmin, mapExtent.ymax], [mapExtent.xmax, mapExtent.ymax], [mapExtent.xmax, mapExtent.ymin], [mapExtent.xmin, mapExtent.ymin]]

      const geomLayout = new Polygon({
        spatialReference: this.props.jimuMapView.view.spatialReference
      })
      geomLayout.addRing(ringLayoutPerim)
      this.graphic = new Graphic({
        geometry: geomLayout
      })
      setTimeout(() => {
        this.setState({
          incidentGeometry: this.props.jimuMapView.view.center,
          bufferGeometry: this.props.jimuMapView?.view.extent,
          incidentGeometry4326: null,
          geodesicBuffer: null
        })
        this.props.aoiComplete({
          incidentGeometry: this.props.jimuMapView.view.center,
          bufferGeometry: this.props.jimuMapView?.view.extent,
          incidentGeometry4326: null,
          geodesicBuffer: null,
          distanceUnit: this.currentDistanceUnit,
          bufferDistance: this.currentBufferDistance
        })
      }, 50)
      this.updateLayerListMaxHeight()
    }
  }

  /**
   * handle event emitted by locate incident on refresh button is clicked
   */
  refreshButtonClicked = () => {
    this.currentBufferDistance = this.state.defaultBufferDistance
    this.currentDistanceUnit = this.state.defaultDistanceUnits
    //set to default distance and unit
    this.clearAll()
    this.setState({
      refreshButtonClicked: true
    }, () => {
      setTimeout(() => {
        this.setState({
          refreshButtonClicked: false
        })
      }, 50)
    })
  }

  /**
   * clear graphics layer and update states to null
   */
  clearAll = () => {
    this.props.bufferLayer?.removeAll()
    this.props.drawingLayer?.removeAll()
    this.graphic = null
    this.setState({
      bufferGeometry: null,
      incidentGeometry: null,
      incidentGeometry4326: null,
      geodesicBuffer: null,
      closestAddress: null
    }, () => {
      this.updateLayerListMaxHeight()
      this.props.clear()
    })
  }

  /**
   * draw the buffer graphics and pass the respective parameters to aoiComplete
   * @param bufferGeometry buffer geometry
   */
  onBufferComplete = (bufferGeometry: Geometry) => {
    if (bufferGeometry) {
      geometryUtils.projectToSpatialReference([bufferGeometry],
        this.props.jimuMapView.view.spatialReference).then((bufferGeometryInMapSr) => {
        if (bufferGeometryInMapSr?.length > 0) {
          const bufferGraphic = new Graphic({
            geometry: bufferGeometryInMapSr[0],
            symbol: getBufferSymbol(this.props.highlightColor)
          })
          if (bufferGraphic) {
            this.props.bufferLayer.removeAll()
            this.props.bufferLayer?.add(bufferGraphic)
            //zoom to the incident/buffer geometry
            this.props.jimuMapView?.view.goTo({
              center: bufferGraphic.geometry.type === 'point' ? bufferGraphic.geometry : bufferGraphic.geometry.extent.expand(1.5)
            })
          }
          this.setState({
            bufferGeometry: bufferGeometryInMapSr[0]
          }, () => {
            this.props.aoiComplete({
              incidentGeometry: this.state.incidentGeometry,
              bufferGeometry: bufferGeometryInMapSr[0],
              incidentGeometry4326: this.state.incidentGeometry4326,
              geodesicBuffer: bufferGeometry,
              distanceUnit: this.currentDistanceUnit,
              bufferDistance: this.currentBufferDistance
            })
          })
        }
      })
    } else {
      this.props.aoiComplete({
        incidentGeometry: this.state.incidentGeometry,
        incidentGeometry4326: this.state.incidentGeometry4326,
        bufferGeometry: null,
        geodesicBuffer: null,
        distanceUnit: this.currentDistanceUnit,
        bufferDistance: this.currentBufferDistance
      })
    }
  }

  /**
   * handle event emitted by buffer tool on distance changes
   * @param distance updated distance
   */
  onBufferDistanceChange = (distance: number) => {
    this.currentBufferDistance = distance
    this.props.bufferLayer?.removeAll()
  }

  /**
   * handle event emitted by buffer tool on unit changes
   * @param unit updated unit
   */
  onBufferUnitChange = (unit: string) => {
    this.currentDistanceUnit = unit
    this.props.bufferLayer?.removeAll()
  }

  /**
   * get org/default geocoder Service URL
   * @returns geocoder Service URL
   */
  getGeocodeServiceURL = (): string => {
    //by default use esri world geocoding service
    let geocodeServiceURL: string = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'
    //Use org's first geocode service
    if (portalSelf?.helperServices?.geocode?.length > 0 && portalSelf?.helperServices?.geocode?.[0]?.url) { // Use org's first geocode service if available
      geocodeServiceURL = portalSelf.helperServices.geocode[0].url
    }
    return geocodeServiceURL
  }

  /**
   * get closest address for incident geometry
   * @param point incident geometry
   * @returns promise reverse geocoding address for incident location
   */
  getClosestAddress = (point: __esri.Point) => {
    const geocodeURL: string = this.getGeocodeServiceURL()
    return locator.locationToAddress(geocodeURL, {
      location: point
    }, {
      query: {}
    }).then(response => {
      return Promise.resolve(response.address)
    }, err => {
      return Promise.resolve(this.nls('noClosestAddressMsg'))
    })
  }

  /**
   * show closet address of incident location
   * @param geometry incident geometry
   */
  showClosestAddress = (geometry) => {
    if (geometry?.type === 'point') {
      this.getClosestAddress(geometry).then((address: string) => {
        this.setState({ closestAddress: address }, () => {
          this.updateLayerListMaxHeight()
        })
      })
    } else {
      this.setState({ closestAddress: null }, () => {
        this.updateLayerListMaxHeight()
      })
    }
  }

  /**
   * Update the analysis layers list height when there is closest address
   */
  updateLayerListMaxHeight = () => {
    setTimeout(() => {
      this.props.updateClosestAddressState(this.state.closestAddress !== null)
    }, 50)
  }

  /**
    * Update showInfoIcon state to know info icon is showing or not
    * @param showInfoIcon if info icon is showing
    */
  handleShowInfoIcon = (showInfoIcon: boolean) => {
    this.setState({
      showInfoIcon: showInfoIcon
    })
  }

  render () {
    const { searchCurrentExtent, searchByLocation } = getSearchWorkflow(this.props.config)
    const { sketchTools } = this.props.config
    const showSketchTools = sketchTools.showPoint || sketchTools.showPolyline || sketchTools.showPolygon
    const bufferToolStyles = this.props.widgetWidth < 306 || (!this.state.searchByActiveMapArea && !this.state.showDistSettings) ||
      (!this.props.headingLabel && this.state.showDistSettings && !showSketchTools)
      ? 'pb-1 buffer-distance w-100'
      : 'pb-1 buffer-distance'
    const locateIncidentStyles = this.props.widgetWidth < 306 || this.state.searchByActiveMapArea ? 'locate-incident pb-1 w-100' : 'locate-incident pb-1'
    return (

      <div className='pt-2 px-2' css={getAoiToolStyle(this.props?.theme, showSketchTools)}>
        <div className={searchCurrentExtent && this.props.headingLabel ? 'mb-2' : 'hidden'}>
          <Label className={'headingLabelStyle mb-0'}>
            <span className={searchCurrentExtent ? 'align-middle' : ''}>{this.props.headingLabel}</span>
            {/* Hide the info icon for now, if in future required we will use it */}
            {false && searchCurrentExtent && this.state.showInfoIcon &&
              <Tooltip role={'tooltip'} tabIndex={0} aria-label={this.nls('mapExtentChangeInfoMsg')}
                title={this.nls('mapExtentChangeInfoMsg')} showArrow placement='top'>
                <span className='ml-4 d-inline pointer'>
                  <InfoOutlined />
                </span>
              </Tooltip>
            }
          </Label>
        </div>
        <div className={searchByLocation && this.props.headingLabel ? 'mb-0' : 'hidden'}>
          <Label className={'headingLabelStyle mb-0'}>
            <span className={searchCurrentExtent ? 'align-middle' : ''}>{this.props.headingLabel}</span>
          </Label>
        </div>
        <div className='main-row w-100'>
          <div className={locateIncidentStyles}>
            <LocateIncident
              theme={this.props.theme}
              intl={this.props.intl}
              config={this.props.config}
              jimuMapView={this.props.jimuMapView}
              sketchComplete={this.onSketchComplete}
              refreshClicked={this.refreshButtonClicked}
              searchByMapAreaClicked={this.onSearchByMapAreaClicked}
              drawToolSelectionChange={this.clearAll}
              highlightColor={this.props.highlightColor}
              showInfoIcon = {this.handleShowInfoIcon}
            />
          </div>
          <div className={this.state.searchByActiveMapArea ? 'hidden pb-1 buffer-distance' : bufferToolStyles}>
            {!this.state.searchByActiveMapArea &&
              <BufferTool
                theme={this.props.theme}
                intl={this.props.intl}
                config={this.props.config}
                geometry={this.state.incidentGeometry4326 || this.state.incidentGeometry}
                distanceUnit={this.state.defaultDistanceUnits}
                bufferDistance={this.state.defaultBufferDistance}
                bufferHeaderLabel={this.nls('bufferDistance')}
                bufferComplete={this.onBufferComplete}
                distanceChanged={this.onBufferDistanceChange}
                unitChanged={this.onBufferUnitChange}
                refreshButtonClicked={this.state.refreshButtonClicked} />}
          </div>
        </div>
        {this.state.closestAddress && this.props.showInputAddress &&
          <div tabIndex={0} aria-label={this.nls('closestAddress') + ' ' + this.state.closestAddress} className='closest-address w-100 pt-1'>
            <Label className='closestAddressheadingLabel mb-0'>{this.nls('closestAddress')}</Label>
            <br />
            <Label className='mb-0 pt-1'>{this.state.closestAddress}</Label>
          </div>
        }
      </div>
    )
  }
}
