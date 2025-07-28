import CIMSymbol from '@arcgis/core/symbols/CIMSymbol'

const distanceLineSymbol = new CIMSymbol({
  data: {
    type: 'CIMSymbolReference',
    symbol: {
      type: 'CIMLineSymbol',
      symbolLayers: [
        {
          type: 'CIMSolidStroke',
          effects: [
            {
              type: 'CIMGeometricEffectDashes',
              dashTemplate: [
                14,
                12
              ],
              lineDashEnding: 'FullGap',
              controlPointEnding: 'NoConstraint'
            }
          ],
          enable: true,
          capStyle: 'Butt',
          joinStyle: 'Round',
          width: 3.5,
          color: [
            255,
            255,
            255,
            255
          ]
        },
        {
          type: 'CIMSolidStroke',
          enable: true,
          capStyle: 'Butt',
          joinStyle: 'Round',
          width: 5,
          color: [
            255,
            127,
            0,
            255
          ]
        }
      ]
    }
  }
})

export default distanceLineSymbol
