import { validateMaxBufferDistance } from '../src/common/utils'

describe('Validate the buffer distance limits according to the Units', () => {
  it('The distance and units should satisfies the condition', function () {
    const setMaxBufferDistOfFeet = validateMaxBufferDistance(52800001, 'feet')
    expect(setMaxBufferDistOfFeet).toEqual(5280000)

    const setMaxBufferDistOfMiles = validateMaxBufferDistance(10001, 'miles')
    expect(setMaxBufferDistOfMiles).toEqual(1000)

    const setMaxBufferDistOfKm = validateMaxBufferDistance(1609.3441, 'kilometers')
    expect(setMaxBufferDistOfKm).toEqual(1609.344)

    const setMaxBufferDistOfMeters = validateMaxBufferDistance(16093445, 'meters')
    expect(setMaxBufferDistOfMeters).toEqual(1609344)

    const setMaxBufferDistOfYards = validateMaxBufferDistance(17600001, 'yards')
    expect(setMaxBufferDistOfYards).toEqual(1760000)
  })
})
