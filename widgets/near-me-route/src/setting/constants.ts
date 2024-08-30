import { AnalysisTypeName } from '../config'

export const unitOptions = [
  { value: 'feet', label: 'Feet' },
  { value: 'meters', label: 'Meters' },
  { value: 'kilometers', label: 'Kilometers' },
  { value: 'miles', label: 'Miles' },
  { value: 'yards', label: 'Yards' }
]

export const analysisType = [AnalysisTypeName.Closest, AnalysisTypeName.Proximity, AnalysisTypeName.Summary]

export const defaultBufferDistance = 1

export const defaultHighlightResultsColor = '#f507f5'

export const transparentColor: string = '#FFFFFF00'

export const defaultAnalysis = [
  {
    analysisId: '',
    analysisType: analysisType[0],
    highlightResultsOnMap: true,
    highlightColorOnMap: defaultHighlightResultsColor,
    expandOnOpen: true
  },
  {
    analysisId: '',
    analysisType: analysisType[1],
    displayField: '',
    sortFeaturesByDistance: true,
    sortFeatures: {
      sortFeaturesByField: '',
      sortFeaturesOrder: 'ASC'
    },
    groupFeaturesEnabled: false,
    groupFeatures: {
      groupFeaturesByField: '',
      groupFeaturesOrder: 'ASC'
    },
    sortGroupsByCount: false,
    highlightResultsOnMap: true,
    highlightColorOnMap: defaultHighlightResultsColor,
    expandOnOpen: false,
    expandFeatureDetails: false
  },
  {
    analysisId: '',
    analysisType: analysisType[2],
    isSingleColorMode: true,
    singleFieldColor: transparentColor,
    summaryFields: [
    ],
    highlightResultsOnMap: true,
    highlightColorOnMap: defaultHighlightResultsColor,
    expandOnOpen: false
  }
]

export const defaultConfigInfo = {
  analysisSettings: {
    layersInfo: [],
    displayFeatureCount: true,
    displayAnalysisIcon: false,
    displayMapSymbols: false,
    showDistFromInputLocation: true,
    onlyShowLayersResult: false
  },
  searchSettings: {
    headingLabel: '',
    bufferDistance: defaultBufferDistance,
    distanceUnits: '',
    showDistanceSettings: true,
    sketchTools: {
      showPoint: true,
      showPolyline: true,
      showPolygon: true
    },
    searchByActiveMapArea: false,
    includeFeaturesOutsideMapArea: false,
    headingLabelStyle: {
      fontFamily: 'Avenir Next',
      fontBold: false,
      fontItalic: false,
      fontUnderline: false,
      fontStrike: false,
      fontColor: 'var(--black)',
      fontSize: '13px'
    },
    showInputAddress: true
  }
}

export const enum NumberFormatting {
  NoFormatting = 'noFormatting',
  Round = 'round',
  Truncate = 'truncate'
}

export const enum CommonSummaryFieldValue {
  SumOfIntersectedArea = 'sumOfIntersectedArea',
  SumOfIntersectedLength = 'sumOfIntersectedLength'
}

export const commonSummaryIntersectedLengthField = {
  summaryBy: CommonSummaryFieldValue.SumOfIntersectedLength,
  showSeparator: true,
  numberFormattingOption: NumberFormatting.NoFormatting,
  significantDigits: 0
}

export const commonSummaryIntersectedAreaField = {
  summaryBy: CommonSummaryFieldValue.SumOfIntersectedArea,
  showSeparator: true,
  numberFormattingOption: NumberFormatting.NoFormatting,
  significantDigits: 0
}

export const enum ColorMode {
  SingleColor = 'singleColor',
  ByCategory = 'byCategory'
}

export const colorsStrip1 = ['#5E8FD0', '#77B484', '#DF6B35', '#DBCF4E', '#41546D', '#8257C2', '#D6558B']
const colorsStrip2 = ['#596A90', '#85C2E4', '#DEB3D9', '#9FB6E1', '#BBE4EF', '#C5B2E1', '#8482D0']
const colorsStrip3 = ['#A6382F', '#47707A', '#F0CF35', '#D18332', '#B9C143', '#E38B67', '#AAC86A']
const colorsStrip4 = ['#E49DAF', '#B1F2D0', '#F5F49A', '#94CAFC', '#E9C7A3', '#C9A7E8', '#DDF3AA']
const colorsStrip5 = ['#004CA3', '#005ECA', '#076FE5', '#2C8FFF', '#65ADFF', '#ACD3FF', '#E6F2FF']
const colorsStrip6 = ['#7D5D00', '#AA7F00', '#DDA400', '#FFC300', '#FFCE2F', '#FFDE72', '#FFEDB1']
const colorsStrip7 = ['#4E427E', '#6A5A9E', '#8E7AC3', '#A293D9', '#B0A3E7', '#C4B7EB', '#DFD9F1']
const colorsStrip8 = ['#BA4300', '#ED5500', '#FF7121', '#FF8D4C', '#FFA878', '#FFC4A3', '#FFE0CE']

export const colorSet = [colorsStrip1, colorsStrip2, colorsStrip3, colorsStrip4, colorsStrip5, colorsStrip6, colorsStrip7, colorsStrip8]
