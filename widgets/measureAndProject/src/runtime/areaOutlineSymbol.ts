import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'

const areaOutlineSymbol = new SimpleLineSymbol({
  type: 'simple-line',
  color: [
    255,
    127,
    0,
    1
  ],
  width: 2
})

export default areaOutlineSymbol
