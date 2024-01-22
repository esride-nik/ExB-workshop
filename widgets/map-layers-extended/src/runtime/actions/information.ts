import { portalUrlUtils } from 'jimu-core'
import Action from './action'
import type { Widget } from '../widget'

export default class Information extends Action {
  constructor (widget: Widget, title: string) {
    super()
    this.id = 'information'
    this.title = title
    this.className = 'esri-icon-description'
    this.group = 3
    this.widget = widget
  }

  isValid = (layerItem): boolean => {
    if (layerItem.layer.url && this.widget.props.config.information) {
      return true
    } else {
      return false
    }
  }

  execute = (layerItem): void => {
    const layerObject = layerItem.layer
    const portalItem = layerObject?.portalItem
    if (portalItem?.portal?.url && portalItem.id) {
      const itemDetailUrl = portalUrlUtils.getStandardPortalUrl(portalItem.portal.url) + `/home/item.html?id=${portalItem.id}`
      window.open(itemDetailUrl)
    } else {
      const layerUrl = layerObject?.type === 'feature' ? `${layerObject.url}/${layerObject.layerId}` : layerObject.url
      window.open(layerUrl)
    }
  }
}
