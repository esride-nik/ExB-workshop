// import {MessageManager, ExtentChangeMessage, MessageType} from 'jimu-core';
import Action from './action'
import type { Widget } from '../widget'

export default class Leabel extends Action {
  titleShow: string
  titleHide: string

  constructor (widget: Widget, titleShow: string, titleHide: string) {
    super()
    this.id = 'label'
    this.className = 'esri-icon-labels label-action-title'
    this.group = 0
    this.widget = widget
    this.titleShow = titleShow
    this.titleHide = titleHide
  }

  isValid = (layerItem): boolean => {
    this.title = layerItem.layer.labelsVisible ? this.titleHide : this.titleShow
    if (!this.useMapWidget() || !this.widget.props.config.label || !layerItem?.layer?.labelingInfo) {
      return false
    } else {
      return true
    }
  }

  execute = (layerItem): void => {
    layerItem.layer.labelsVisible = !layerItem.layer.labelsVisible
    this.updateTitle(layerItem.layer.labelsVisible)
  }

  private readonly updateTitle = (labelsVisible: boolean): void => {
    const dom = document.querySelector(`.widget-layerlist_${this.widget?.props?.id} .esri-layer-list__item-action .label-action-title`)
    const iconDom = document.querySelector<HTMLElement>(`.widget-layerlist_${this.widget?.props?.id} .esri-layer-list__item-actions-menu .esri-layer-list__item-actions-menu-item`)

    const domParent = dom?.parentElement
    let domTitle
    domParent?.childNodes.forEach((childNode) => {
      // @ts-expect-error
      if (childNode.className?.indexOf('esri-layer-list__item-action-title') > -1) {
        domTitle = childNode
      }
    })

    if (domTitle) {
      const titleString = labelsVisible ? this.titleHide : this.titleShow
      domTitle.innerHTML = titleString
      domParent.title = titleString
      domParent.ariaLabel = titleString
    }

    if (iconDom.title === this.titleShow || iconDom.title === this.titleHide) {
      iconDom.title = labelsVisible ? this.titleHide : this.titleShow
      iconDom.ariaLabel = labelsVisible ? this.titleHide : this.titleShow
    }
  }
}
