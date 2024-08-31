import { ImmutableObject } from 'seamless-immutable'

export interface Config {
  serviceURL: string
  title: { default: string }
  author: { default: string }
  copyright: { default: string }
  format: { default: string }
  layout: { default: string, map_only_visible: boolean
    layouts: [string, {unit: string
      frame: {width: number, height: number}
      paper: {width: number, height: number}
      padding: {x: number, y: number}}] }
}

export type IMConfig = ImmutableObject<Config>
