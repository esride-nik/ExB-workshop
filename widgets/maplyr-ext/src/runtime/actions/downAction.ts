import Action from './action'
import type LayerList from '../widget'

export default class DownAction extends Action {
  constructor (widget: LayerList, title: string) {
    super()
    this.id = 'downAction'
    this.title = title
    this.className = 'esri-icon-arrow-down'
    this.group = 0
    this.widget = widget
  }

  isValid = (layerItem): boolean => {
    if (layerItem.parent) {
      return false
    }
    if (this.useMapWidget()) {
      return true
    } else {
      return false
    }
  }

  execute = (layerItem): void => {
    const mapView = this.widget.viewFromMapWidget
    const mapLayers = mapView.layerViews.items
    const layerList = this.widget.layerList
    const layerListItems = layerList.visibleItems._items

    let stop = false
    layerListItems.forEach((item, index) => {
      if (item === layerItem && !stop) {
        if (index >= layerListItems.length - 1) {
          stop = true
        } else {
          console.log(layerListItems[index].layer.title, layerListItems[index + 1].layer.title)
          const temp = layerListItems[index + 1]
          layerListItems[index + 1] = layerItem
          layerListItems[index] = temp
          console.info('ListItem from ' + index + ' to ' + (index - 1))
          console.log(layerListItems[index].layer.title, layerListItems[index + 1].layer.title)

          let stopViews = false
          mapLayers.forEach((item, indexViews) => {
            if (item.uid === layerListItems[index + 1].layerView.uid && !stopViews) {
              stopViews = true
              console.log(mapLayers[indexViews].layer.title, mapLayers[indexViews - 1].layer.title)
              const tempLayer = mapLayers[indexViews - 1]
              mapLayers[indexViews - 1] = mapLayers[indexViews]
              mapLayers[indexViews] = tempLayer
              console.info('View from ' + indexViews + ' to ' + (indexViews - 1))
              console.log(mapLayers[indexViews].layer.title, mapLayers[indexViews - 1].layer.title)
            }
          })

          stop = true
          this.widget.viewFromMapWidget.layerViews.items = mapLayers
          this.widget.layerList.visibleItems._items = layerListItems
        }
      }
    })
  }
}