import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'

const manipulatorPointSymbol = new SimpleMarkerSymbol({
  color: [
    255,
    127,
    0,
    128
  ],
  angle: 0,
  xoffset: 0,
  yoffset: 0,
  size: 8,
  style: 'circle',
  outline: {
    type: 'simple-line',
    color: [
      0,
      0,
      0,
      255
    ],
    width: 0,
    style: 'solid'
  }
})

export default manipulatorPointSymbol
