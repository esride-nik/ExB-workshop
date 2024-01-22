import Action from './action'
import type { Widget } from '../widget'

export default class EmptyAction extends Action {
  constructor (widget: Widget, title: string) {
    super()
    this.id = 'empty'
    this.title = title
    this.className = ''
    this.group = 10
    this.widget = widget
  }

  isValid = (layerItem): boolean => {
    return true
  }

  execute = (layerItem): void => {
    console.log('empty action')
  }
}
