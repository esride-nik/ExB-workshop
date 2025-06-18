import { type ImmutableObject } from 'jimu-core'

export enum MeterValueOption {
  oneDecimalPlace,
  twoDecimalPlaces,
  decimalPlacesRoundedTo05,
  noDecimalPlaces
}
export interface Config {
  meterValueOption: MeterValueOption
  distanceMeasurementEnabled: boolean
  areaMeasurementEnabled: boolean
  locationMeasurementEnabled: boolean
  headerText: string
  copyText: string
  disclaimerText: string
}

export type IMConfig = ImmutableObject<Config>
