import { ImmutableObject } from 'jimu-core'

export interface Config {
  radiusKm: number
}

export type IMConfig = ImmutableObject<Config>
