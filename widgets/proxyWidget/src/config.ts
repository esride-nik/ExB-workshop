import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  proxyUrl: string
}

export type IMConfig = ImmutableObject<Config>
