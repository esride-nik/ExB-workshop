// import {MessageManager, ExtentChangeMessage, MessageType} from 'jimu-core';
import Action from './action'
import type { Widget } from '../widget'

export default class LayerFx extends Action {
  constructor (widget: Widget, title: string) {
    super()
    this.id = 'layerfx'
    this.title = title
    this.className = 'esri-icon-lightbulb'
    this.group = 0
    this.widget = widget
  }

  isValid = (layerItem): boolean => {
    console.log('LayerFx', layerItem)
    return true
  }

  execute = (layerItem): void => {
    layerItem.layer.effect = 'bloom(8, 5px, 0.5)'
  }
}
