//Copied and modified from EsriCH.AWAB widgets/ECH_PrintMore
define([
  'dojo/_base/declare',
  'esri/geometry/Point',
  'dojo/dom-construct',
  'dojox/gfx'
], function (declare, Point, domConstruct, gfx) {
  return declare(null, {
    map: null, //is a MapView
    surface: null,
    minXY: null,
    maxXY: null,
    constructor: function (args) {
      declare.safeMixin(this, args)
      this.minXY = new Point(0, 0, this.map.spatialReference)
      this.maxXY = new Point(0, 0, this.map.spatialReference)
      //var elementMap = document.getElementsByClassName('esri-view-root')[0];
      const elementMap = this.map.container
      //Create unique ID for PrintFrameDiv in case there are several PrintWidgets/Maps in the Experience
      const idPrintFrame = 'print_frame_' + new Date().getTime().toString()
      domConstruct.create('div', { id: idPrintFrame, style: 'position:absolute;pointer-events:none;left:0px;right:0px;top:0px;bottom:0px;' }, elementMap)
      this.surface = gfx.createSurface(idPrintFrame, '100%', '100%')
    },

    disable: function () {
      this.surface.clear()
    },

    clear: function () {
      this.surface.clear()
    },

    update: function (printExtent, layout, rotation) {
      if (!rotation) {
        rotation = 0
      }

      this.minXY = new Point(printExtent.xmin, printExtent.ymin, this.map.spatialReference)
      this.maxXY = new Point(printExtent.xmax, printExtent.ymax, this.map.spatialReference)
      const min = this.map.toScreen(this.minXY)
      const max = this.map.toScreen(this.maxXY) //max.y < min.y, because screenpoints are inverted to coords

      this.surface.clear()

      //***Create Mapframe***
      const p = this.surface.createPath().setFill([0, 0, 0, 0.5]).moveTo(-this.map.width, -this.map.height).hLineTo(this.map.width * 3).vLineTo(this.map.height * 3).hLineTo(-this.map.width * 3).closePath().moveTo(min.x, min.y).vLineTo(max.y).hLineTo(max.x).vLineTo(min.y).closePath()
      p.setTransform([dojox.gfx.matrix.translate(this.map.width / 2, this.map.height / 2), dojox.gfx.matrix.rotateg(rotation), dojox.gfx.matrix.translate(-this.map.width / 2, -this.map.height / 2)])
      this.surface.createRect({ x: min.x, y: max.y, height: min.y - max.y, width: max.x - min.x }).setStroke('white').setTransform([dojox.gfx.matrix.translate(this.map.width / 2, this.map.height / 2), dojox.gfx.matrix.rotateg(rotation), dojox.gfx.matrix.translate(-this.map.width / 2, -this.map.height / 2)])
      //*********************

      //***Create Paperframe***
      if (!layout || !layout.paper) return
      const unitInPixels = (max.x - min.x) / layout.frame.width
      const paper = {}
      paper.x = min.x - layout.padding.x * unitInPixels
      paper.y = max.y - layout.padding.y * unitInPixels
      paper.height = layout.paper.height * unitInPixels
      paper.width = layout.paper.width * unitInPixels
      this.surface.createRect(paper).setStroke('white').setTransform([dojox.gfx.matrix.translate(this.map.width / 2, this.map.height / 2), dojox.gfx.matrix.rotateg(rotation), dojox.gfx.matrix.translate(-this.map.width / 2, -this.map.height / 2)])
      //**********************
    }
  })
}
)
