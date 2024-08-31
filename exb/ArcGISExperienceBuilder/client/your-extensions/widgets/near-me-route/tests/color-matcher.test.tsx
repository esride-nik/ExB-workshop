import { applyColorMatchColors } from '../src/common/utils'

describe('Validate color matcher', () => {
  it('Should get the respective matched colors', function () {
    const colorMatches = {
      'Sum of Intersected length': {
        _fieldLabel: 'Sum of Intersected length',
        _fillColor: '#4E427E'
      }
    }
    const colors = ['#4E427E', '#6A5A9E', '#8E7AC3', '#A293D9', '#B0A3E7', '#C4B7EB', '#DFD9F1']
    const colorMatchersResult = applyColorMatchColors(colorMatches, colors)
    expect(colorMatchersResult).toEqual(colorMatches)
  })
})
