/** @jsx jsx */
import DownAction from './actions/downAction'
import LayerFx from './actions/layerfx'
import { Widget as MapLayers } from './map-layers'
export default class Widget extends MapLayers {
  constructor (props) {
    super(props)
    console.log('MapLayers Extended: Widget constructor')
  }

  registerLayerListActions () {
    console.log('Extended: registerLayerListActions')
    super.registerLayerListActions()
    this.layerListActions.push(new DownAction(this, 'Nach unten verschieben'))
    this.layerListActions.push(new LayerFx(this, 'Layer Effects'))
    console.log(this.layerListActions)
  }

  // The following commented out sections are templates for the methods that can be overridden in the widget class

  // componentDidUpdate (prevProps, prevState) {
  //   super.componentDidUpdate(prevProps, prevState)
  //   console.log('MapLayers Extended: componentDidUpdate')
  // }

  // createDataActionList is a field that holds a function, not a method. In TypeScript, you can't use super to access fields from the parent class. => workaround: direct call via prototype
  // createDataActionList = (layer) => {
  //   console.log('MapLayers Extended: createDataActionList')
  //   return Widget.prototype.createDataActionList.call(this, layer)
  // }

  // render () {
  //   console.log('MapLayers Extended: render')
  //   return super.render()
  // }
}
