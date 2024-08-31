import defaultMessages from './translations/default'

export const unitOptions = [
  { value: 'miles', label: defaultMessages.miles },
  { value: 'meters', label: defaultMessages.meters },
  { value: 'kilometers', label: defaultMessages.kilometers },
  { value: 'feet', label: defaultMessages.feet },
  { value: 'yards', label: defaultMessages.yards }
]

export const distanceUnitWithAbbr = [
  {
    value: 'meters',
    abbreviation: 'metersAbbreviation'
  },
  {
    value: 'feet',
    abbreviation: 'feetAbbreviation'
  },
  {
    value: 'kilometers',
    abbreviation: 'kilometersAbbreviation'
  },
  {
    value: 'miles',
    abbreviation: 'milesAbbreviation'
  },
  {
    value: 'yards',
    abbreviation: 'yardsAbbreviation'
  }
]
