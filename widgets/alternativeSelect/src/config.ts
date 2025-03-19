import { type ImmutableObject } from 'jimu-core'

export interface Config {
  radius: number
}

export type IMConfig = ImmutableObject<Config>
