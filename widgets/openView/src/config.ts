import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  widgetId: string
}

export type IMConfig = ImmutableObject<Config>
