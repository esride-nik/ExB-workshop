import { type ImmutableObject } from 'jimu-core'

export interface Config {
  goto?: boolean
  label?: boolean
  opacity?: boolean
  information?: boolean
  setVisibility?: boolean
  useMapWidget?: boolean
  enableLegend?: boolean
  useTickBoxes?: boolean
  showAllLegend?: boolean
  customizeLayerOptions?: {
    [jimuMapViewId: string]: CustomizeLayerOption
  }
}

export interface CustomizeLayerOption {
  isEnabled: boolean
  hiddenJimuLayerViewIds?: string[]
}
export type IMConfig = ImmutableObject<Config>
