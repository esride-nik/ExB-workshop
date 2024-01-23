// import {MessageManager, ExtentChangeMessage, MessageType} from 'jimu-core';
import Action from './action'
import type { Widget } from '../widget'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import Graphic from 'esri/Graphic'
import { Point } from 'esri/geometry'
import geometryEngine from 'esri/geometry/geometryEngine'

export default class Spyglass extends Action {
  spyglassLayer: GraphicsLayer = null

  constructor (widget: Widget, title: string) {
    super()
    this.id = 'spyglass'
    this.title = title
    this.className = 'esri-icon-down-arrow-circled'
    this.group = 0
    this.widget = widget
  }

  isValid = (layerItem): boolean => {
    console.log('Spyglass', layerItem)
    return true
  }

  execute = (layerItem): void => {
    if (!this.spyglassLayer) {
      this.spyglassLayer = new GraphicsLayer({ id: 'spyglassGraphicsLayer' })
      layerItem.layer.map.add(this.spyglassLayer)
    } else {
      this.spyglassLayer.removeAll()
    }
    const spyglassMidpoint = new Point({
      x: layerItem.layer.fullExtent.xmin + (layerItem.layer.fullExtent.xmax - layerItem.layer.fullExtent.xmin) / 2,
      y: layerItem.layer.fullExtent.ymin + (layerItem.layer.fullExtent.ymax - layerItem.layer.fullExtent.ymin) / 2,
      spatialReference: layerItem.layer.fullExtent.spatialReference
    })
    const spyglassGeometry = geometryEngine.geodesicBuffer(spyglassMidpoint, 100, 'meters')
    const spyglassGraphic = new Graphic({
      geometry: {
        type: 'polygon',
        rings: spyglassGeometry[0].rings,
        spatialReference: spyglassGeometry[0].spatialReference
      },
      symbol: {
        type: 'simple-fill',
        color: [0, 0, 0, 0],
        outline: {
          color: [0, 0, 0, 0],
          width: 0
        }
      }
    })
    this.spyglassLayer.add(spyglassGraphic)
  }
}
