//Copied and modified from EsriCH.AWAB widgets/ECH_PrintMore

import Point from 'esri/geometry/Point'
// import gfx from 'dojox/gfx'
import MapView from 'esri/views/MapView'

export default class Frame {
  surface: any
  minXY: Point
  maxXY: Point
  mapView: MapView

  constructor (mapView: MapView) {
    this.mapView = mapView

    this.minXY = new Point({
      spatialReference: mapView.spatialReference,
      x: 0,
      y: 0
    })
    this.maxXY = new Point({
      spatialReference: mapView.spatialReference,
      x: 0,
      y: 0
    })

    //Create unique ID for PrintFrameDiv in case there are several PrintWidgets/Maps in the Experience
    const idPrintFrame = 'print_frame_' + new Date().getTime().toString()
    const printTargetNode = document.createElement('div', { is: idPrintFrame })
    printTargetNode.style.pointerEvents = 'none'
    printTargetNode.style.backgroundColor = '#f00'
    printTargetNode.style.height = '150px'
    printTargetNode.style.width = '300px'
    this.mapView.ui.add(printTargetNode, 'bottom-left')

    // TODO: Neue Lösung, um dojox zu ersetzen
    // this.surface = gfx.createSurface(idPrintFrame, '100%', '100%')
  }

  disable () {
    this.surface.clear()
  }

  clear () {
    this.surface.clear()
  }

  update (printExtent, layout, rotation) {
    if (!rotation) {
      rotation = 0
    }

    this.minXY = new Point({
      spatialReference: this.mapView.spatialReference,
      x: printExtent.xmin,
      y: printExtent.ymin
    })
    this.maxXY = new Point({
      spatialReference: this.mapView.spatialReference,
      x: printExtent.xmax,
      y: printExtent.ymax
    })
    const min = this.mapView.toScreen(this.minXY)
    const max = this.mapView.toScreen(this.maxXY) //max.y < min.y, because screenpoints are inverted to coords

    this.surface.clear()

    //***Create Mapframe***
    // const p = this.surface.createPath().setFill([0, 0, 0, 0.5]).moveTo(-this.mapView.width, -this.mapView.height).hLineTo(this.mapView.width * 3).vLineTo(this.mapView.height * 3).hLineTo(-this.mapView.width * 3).closePath().moveTo(min.x, min.y).vLineTo(max.y).hLineTo(max.x).vLineTo(min.y).closePath()
    // p.setTransform([gfx.matrix.translate(this.mapView.width / 2, this.mapView.height / 2), gfx.matrix.rotateg(rotation), gfx.matrix.translate(-this.mapView.width / 2, -this.mapView.height / 2)])
    // this.surface.createRect({ x: min.x, y: max.y, height: min.y - max.y, width: max.x - min.x }).setStroke('white').setTransform([gfx.matrix.translate(this.mapView.width / 2, this.mapView.height / 2), gfx.matrix.rotateg(rotation), gfx.matrix.translate(-this.mapView.width / 2, -this.mapView.height / 2)])
    //*********************

    //***Create Paperframe***
    if (!layout || !layout.paper) return
    const unitInPixels = (max.x - min.x) / layout.frame.width
    const paper: any = {}
    paper.x = min.x - layout.padding.x * unitInPixels
    paper.y = max.y - layout.padding.y * unitInPixels
    paper.height = layout.paper.height * unitInPixels
    paper.width = layout.paper.width * unitInPixels
    // this.surface.createRect(paper).setStroke('white').setTransform([gfx.matrix.translate(this.mapView.width / 2, this.mapView.height / 2), gfx.matrix.rotateg(rotation), gfx.matrix.translate(-this.mapView.width / 2, -this.mapView.height / 2)])
    //**********************
  }
}
