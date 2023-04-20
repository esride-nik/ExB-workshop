/**
  Licensing

  Copyright 2021 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import { IMConfig } from '../config'
// import * as Frame from '../../lib/ECH_PrintMore/Frame.js'

import Print from 'esri/widgets/Print'
import PrintVM from 'esri/widgets/Print/PrintViewModel'
import Extent from 'esri/geometry/Extent'
import MapView from 'esri/views/MapView'

interface IState {
  printWidgetVM: PrintVM //Not needed for now
  templatesInfoLayout: string //Not needed for now
}

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig>, IState> {
  apiWidgetContainer: React.RefObject<HTMLDivElement>
  printWidget: Print
  // frame: Frame
  mapView: __esri.MapView | __esri.SceneView

  constructor (props) {
    super(props)
    this.state = { printWidgetVM: null, templatesInfoLayout: null }
    this.apiWidgetContainer = React.createRef()
  }

  componentDidMount () {
    console.log('componentDidMount')
    console.log('createAPIWidget')
    this.createAPIWidget()
  }

  componentWillUnmount () {
    console.log('componentWillUnmount')
    if (this.printWidget) {
      this.printWidget.destroy()
      this.printWidget = null
    }
    if (this.state.printWidgetVM) {
      this.state.printWidgetVM.destroy()
      this.setState({
        printWidgetVM: null
      })
    }
  }

  componentDidUpdate () {
    console.log('componentDidUpdate')
    const state = this.props.state

    if (state === 'CLOSED') {
      console.log('Clear Frame')
      // this.frame.clear()
    } else if (state === 'OPENED' && this.printWidget) {
      const layoutName = this.printWidget.templateOptions.layout

      if (layoutName.toLowerCase() === 'map_only') {
        this.drawFrameForMapOnly()
      } else {
        this.drawFrameForLayout(layoutName)
      }
    }
  }

  onActiveViewChange = (jimuMapView: JimuMapView) => {
    if (!(jimuMapView && jimuMapView.view)) {
      return
    }
    this.mapView = jimuMapView.view
    // this.frame = new Frame({
    //   map: jimuMapView.view
    // })
  }

  createAPIWidget () {
    if (!this.mapView) {
      return
    }

    if (!this.printWidget && this.apiWidgetContainer.current) {
      this.printWidget = new Print({
        view: this.mapView as MapView,
        container: this.apiWidgetContainer.current,
        printServiceUrl: this.props.config.serviceURL
      })

      //Set default values in Form
      this.printWidget.templateOptions.set('title', this.props.config.title.default)
      this.printWidget.templateOptions.set('author', this.props.config.author.default)
      this.printWidget.templateOptions.set('copyright', this.props.config.copyright.default)
      this.printWidget.templateOptions.set('format', this.props.config.format.default)
      this.printWidget.templateOptions.set('layout', this.props.config.layout.default)
      this.printWidget.templateOptions.set('fileName', this.props.config.title.default)

      //Watch Extent Change
      this.mapView.watch('extent', (newValue, oldValue, propertyName, target) => {
        const state = this.props.state
        console.log('State: ' + state)

        if (state === 'CLOSED') {
          return
        }

        console.log('***Watched ExtentChange***')

        const layoutName = this.printWidget.templateOptions.layout

        if (layoutName.toLowerCase() === 'map_only') {
          this.drawFrameForMapOnly()
        } else {
          this.drawFrameForLayout(layoutName)
        }
      })

      //Watch Layout Change
      //Also triggered by change to MAP_ONLY Tab!
      this.printWidget.templateOptions.watch('layout', (newValue, oldValue, propertyName, target) => {
        console.log('***Watched LayoutChange***')
        const layoutName = this.printWidget.templateOptions.layout
        console.log('+' + layoutName + '+')

        if (layoutName.toLowerCase() === 'map_only') {
          this.drawFrameForMapOnly()
        } else {
          this.drawFrameForLayout(layoutName)
        }
      })

      //Watch Change of Scale
      this.printWidget.templateOptions.watch('scale', (newValue, oldValue, propertyName, target) => {
        const state = this.props.state
        console.log('State: ' + state)

        if (state === 'CLOSED') {
          return
        }

        console.log('***Watched ScaleChange***')
        console.log('New Scale: ' + newValue)

        const layoutName = this.printWidget.templateOptions.layout

        if (layoutName.toLowerCase() === 'map_only') {
          this.drawFrameForMapOnly()
        } else {
          this.drawFrameForLayout(layoutName)
        }
      })

      //Watch Change of Width (MAP_ONLY)
      this.printWidget.templateOptions.watch('width', (newValue, oldValue, propertyName, target) => {
        console.log('***Watched WidthChange***')
        console.log('New Width: ' + newValue)
        const layoutName = this.printWidget.templateOptions.layout
        console.log('+' + layoutName + '+')

        if (layoutName.toLowerCase() === 'map_only') {
          this.drawFrameForMapOnly()
        } else {
          console.log('DPI change is only supported for "MAP_ONLY"')
        }
      })

      //Watch Change of Height (MAP_ONLY)
      this.printWidget.templateOptions.watch('height', (newValue, oldValue, propertyName, target) => {
        console.log('***Watched HeightChange***')
        console.log('New Height: ' + newValue)
        const layoutName = this.printWidget.templateOptions.layout
        console.log('+' + layoutName + '+')

        if (layoutName.toLowerCase() === 'map_only') {
          this.drawFrameForMapOnly()
        } else {
          console.log('DPI change is only supported for "MAP_ONLY"')
        }
      })

      //Watch DPI Change
      this.printWidget.templateOptions.watch('dpi', (newValue, oldValue, propertyName, target) => {
        console.log('***Watched DPIChange***')
        console.log('New DPI value: ' + newValue)
        const layoutName = this.printWidget.templateOptions.layout
        console.log('+' + layoutName + '+')

        if (layoutName.toLowerCase() === 'map_only') {
          this.drawFrameForMapOnly()
        } else {
          console.log('DPI change is only supported for "MAP_ONLY"')
        }
      })

      this.printWidget.viewModel.load().then((x) => {
        //Not used
        //
        //
      })
    }

    if (!this.state.printWidgetVM) {
      const vm = new PrintVM({
        view: this.mapView as MapView
      })
      this.setState({
        printWidgetVM: vm
      })
    }
  }

  drawFrameForLayout (layoutName: string) {
    let layout: any

    if (this.props.config.layout && this.props.config.layout.layouts) {
      if (this.props.config.layout.layouts[layoutName]) {
        layout = this.props.config.layout.layouts[layoutName]
      } else {
        console.log('No Layout Properties for Layout ' + layoutName)
        return
      }
    } else {
      console.log('No Layout Properties for Layout ' + layoutName)
      return
    }

    const scale = this.printWidget.templateOptions.scale

    let unitFactor: number
    if (layout.unit === 'esriCentimeters') {
      console.log('Unit: esriCentimeters')
      unitFactor = 100
    } else if (layout.unit === 'esriInches') {
      console.log('Unit: esriInches')
      unitFactor = 100 / 2.54
    } else {
      console.log('Layout unit with name ' + layout.unit + ' not supported!')
      return
    }

    const printWidth = layout.frame.width / unitFactor * scale
    const printHeight = layout.frame.height / unitFactor * scale
    const center = this.mapView.extent.center

    let printExtent: Extent

    //METRIC
    if (!this.mapView.extent.spatialReference.isGeographic) {
      console.log('Metric SRS')
      printExtent = new Extent({
        xmin: center.x - printWidth / 2,
        ymin: center.y - printHeight / 2,
        xmax: center.x + printWidth / 2,
        ymax: center.y + printHeight / 2,
        spatialReference: this.mapView.extent.spatialReference
      })

      console.debug('printExtent', printExtent)
      // this.frame.update(printExtent, layout, 0)
    } else {
      //GEOGRAPHIC
      console.log('Geographic SRS')
      let unitFactorGeographic: number
      if (layout.unit === 'esriCentimeters') {
        console.log('Unit: esriCentimeters')
        unitFactorGeographic = 2.54
      } else if (layout.unit === 'esriInches') {
        console.log('Unit: esriInches')
        unitFactorGeographic = 1
      } else {
        console.log('Layout unit with name ' + layout.unit + ' not supported!')
        return
      }

      const currentMapScale = this.mapView.scale
      const desiredPrintScale = this.printWidget.templateOptions.scale
      const corrFactorScale = desiredPrintScale / currentMapScale

      //Formel
      //Pixelanzahl in der Breite = Breite [cm] / 2,54 [cm/i] x Auflösung [dpi]
      //Pixelanzahl in der Höhe = Höhe [cm] / 2,54 [cm/i] x Auflösung [dpi]
      const printWidth = (layout.frame.width / unitFactorGeographic * parseInt(this.printWidget.templateOptions.dpi)) * corrFactorScale
      const printHeight = (layout.frame.height / unitFactorGeographic * parseInt(this.printWidget.templateOptions.dpi)) * corrFactorScale

      const p = this.mapView.toScreen(this.mapView.extent.center)

      const lowerX = p.x - (printWidth / 2)
      const lowerY = p.y + (printHeight / 2)
      const upperX = p.x + (printWidth / 2)
      const upperY = p.y - (printHeight / 2)

      const lowerMapPoint = this.mapView.toMap({ x: lowerX, y: lowerY })
      const upperMapPoint = this.mapView.toMap({ x: upperX, y: upperY })

      const printExtent = new Extent({
        xmin: lowerMapPoint.x,
        ymin: lowerMapPoint.y,
        xmax: upperMapPoint.x,
        ymax: upperMapPoint.y,
        spatialReference: this.mapView.extent.spatialReference
      })

      console.debug('printExtent', printExtent)
      // this.frame.update(printExtent, layout, 0)
    }
  }

  drawFrameForMapOnly () {
    const currentMapScale = this.mapView.scale
    const desiredPrintScale = this.printWidget.templateOptions.scale
    const corrFactorScale = desiredPrintScale / currentMapScale

    const corrFactorDPI = 96 / parseInt(this.printWidget.templateOptions.dpi) //Printing is tied to the default value of 96 dpi

    const mapOnlyWidth = this.printWidget.templateOptions.width * corrFactorScale * corrFactorDPI
    const mapOnlyHeight = this.printWidget.templateOptions.height * corrFactorScale * corrFactorDPI

    const p = this.mapView.toScreen(this.mapView.extent.center)

    const lowerX = p.x - (mapOnlyWidth / 2)
    const lowerY = p.y + (mapOnlyHeight / 2)
    const upperX = p.x + (mapOnlyWidth / 2)
    const upperY = p.y - (mapOnlyHeight / 2)

    const lowerMapPoint = this.mapView.toMap({ x: lowerX, y: lowerY })
    const upperMapPoint = this.mapView.toMap({ x: upperX, y: upperY })

    const printExtent = new Extent({
      xmin: lowerMapPoint.x,
      ymin: lowerMapPoint.y,
      xmax: upperMapPoint.x,
      ymax: upperMapPoint.y,
      spatialReference: this.mapView.extent.spatialReference
    })

    console.debug('printExtent', printExtent)
    // this.frame.update(printExtent, null, 0)
  }

  render () {
    if (!this.isConfigured()) {
      return 'Select a map'
    }

    return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>

      <JimuMapViewComponent useMapWidgetId={this.props.useMapWidgetIds?.[0]} onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>

      <div ref={this.apiWidgetContainer}></div>
    </div>
  }

  isConfigured = () => {
    return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1
  }
}
