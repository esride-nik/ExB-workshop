/* eslint-disable no-prototype-builtins */
import Graphic from 'esri/Graphic'
import Color from 'esri/Color'

/**
* This function is used to get highlight graphics for point/polyline/polygon geometry
* @param graphic - selected feature graphic which needs to be highlighted
* @param color - highlight color
* @returns  - Returns the graphic with highlight symbol
*/
export const getHighLightSymbol = (graphic: __esri.Graphic, color?: string): __esri.Graphic => {
  //Use default color if color is not valid
  if (!color) {
    color = '#00FFFF'
  }
  // If feature geometry is of type point, add a square symbol
  // If feature geometry is of type polyline, highlight the line
  // If feature geometry is of type polygon, highlight the boundary of the polygon
  switch (graphic?.geometry?.type) {
    case 'point':
      return getPointSymbol(graphic, color)
    case 'polyline':
      return getPolyLineSymbol(graphic, color)
    case 'polygon':
      return getPolygonSymbol(graphic, color)
    default:
      return null
  }
}

/**
 * This function is used to get symbol size of the layer
 *  @param Layer object
 *  @returns The sizeInfo object
 */
const getSizeInfo = (layer): any => {
  let sizeInfo = null
  if (layer.renderer.visualVariables) {
    layer.renderer.visualVariables.forEach(info => {
      if (info.type === 'sizeInfo') {
        sizeInfo = info
      }
    })
  }
  return sizeInfo
}

/**
* This function is used to get highlight graphics for point geometry
* @param graphic - selected feature graphic which needs to be highlighted
* @param color - highlight color
* @returns  - Returns the point graphic with highlight symbol
*/
const getPointSymbol = (graphic: __esri.Graphic, color: string): __esri.Graphic => {
  const layer: any = graphic.layer
  let symbol, isSymbolFound, graphicInfoValue, layerInfoValue, i, symbolShape,
    symbolDetails, sizeInfo, arcSymbolSize
  isSymbolFound = false
  symbol = {
    type: 'simple-marker',
    style: 'square',
    color: [0, 255, 255, 0],
    outline: {
      color: color || '#00FFFF',
      width: 2
    }
  }
  //set default Symbol size which will be used in case symbol not found.
  symbol.size = 30
  //if layer is valid and have valid renderer then only check for other symbol properties
  if (layer?.renderer) {
    if (layer.renderer.symbol) {
      isSymbolFound = true
      symbol = updatePointSymbolProperties(symbol, layer.renderer.symbol)
    } else if (layer.renderer.infos?.length > 0) {
      for (i = 0; i < layer.renderer.infos.length; i++) {
        if (layer.typeIdField) {
          graphicInfoValue = graphic.attributes[layer.typeIdField]
        } else if (layer.renderer.attributeField) {
          graphicInfoValue = graphic.attributes[layer.renderer.attributeField]
        }
        layerInfoValue = layer.renderer.infos[i].value
        // To get properties of symbol when infos contains other than class break renderer.
        if (graphicInfoValue !== undefined && graphicInfoValue !== null &&
          graphicInfoValue !== '' && layerInfoValue !== undefined &&
          layerInfoValue !== null && layerInfoValue !== '') {
          if (graphicInfoValue.toString() === layerInfoValue.toString()) {
            isSymbolFound = true
            symbol = updatePointSymbolProperties(symbol, layer.renderer.infos[i].symbol)
          }
        }
      }
      if (!isSymbolFound) {
        if (layer.renderer.defaultSymbol) {
          isSymbolFound = true
          symbol = updatePointSymbolProperties(symbol, layer.renderer.defaultSymbol)
        }
      }
    }
  }
  if (layer?.graphics?.length > 0) {
    if (layer._getSymbol(graphic)) {
      const graphicObj: any = graphic
      symbolShape = graphicObj.getShape()
      if (symbolShape?.shape) {
        if (symbolShape.shape.hasOwnProperty('r')) {
          isSymbolFound = true
          symbol.size = (symbolShape.shape.r * 2) + 10
        } else if (symbolShape.shape.hasOwnProperty('width')) {
          isSymbolFound = true
          //get offsets in case of smart mapping symbols from the renderer info if available
          if (layer.renderer?.infos?.length > 0) {
            symbol = updatePointSymbolProperties(symbol, layer.renderer.infos[0].symbol)
          }
          symbol.size = symbolShape.shape.width + 10
        }
        //handle arcade expressions, take max size of symbol
      } else if (layer.renderer.visualVariables) {
        symbolDetails = layer._getRenderer(graphic)
        sizeInfo = getSizeInfo(layer)
        if (sizeInfo) {
          arcSymbolSize = symbolDetails.getSize(graphic, {
            sizeInfo: sizeInfo,
            shape: layer._getSymbol(graphic),
            resolution: layer && layer.getResolutionInMeters && layer.getResolutionInMeters()
          })
          if (arcSymbolSize !== null) {
            symbol.size = arcSymbolSize + 10
          }
        }
      }
    }
  }
  const graphics = new Graphic({
    geometry: graphic.geometry,
    symbol: symbol,
    attributes: graphic.attributes
  })
  return graphics
}

/**
* This function is used to get different data of symbol from infos properties of renderer object.
* @param symbol symbol that needs to be assigned to selected/activated feature
* @param layerSymbol renderer layer Symbol
* @returns symbol
*/
const updatePointSymbolProperties = (symbol, layerSymbol): any => {
  let height: number
  let width: number
  let size: number
  if (layerSymbol.hasOwnProperty('height') && layerSymbol.hasOwnProperty('width')) {
    height = layerSymbol.height
    width = layerSymbol.width
    // To display cross hair properly around feature its size needs to be calculated
    size = (height > width) ? height : width
    size = size + 10
    symbol.size = size
  }
  if (layerSymbol.hasOwnProperty('size')) {
    if (!size || size < layerSymbol.size) {
      symbol.size = layerSymbol.size + 10
    }
  }
  if (layerSymbol.hasOwnProperty('xoffset')) {
    symbol.xoffset = layerSymbol.xoffset
  }
  if (layerSymbol.hasOwnProperty('yoffset')) {
    symbol.yoffset = layerSymbol.yoffset
  }
  return symbol
}

/**
* This function is used to get highlight graphics for polyline geometry
* @param graphic - selected feature graphic which needs to be highlighted
* @param color - highlight color
* @returns  - Returns the polyline graphic with highlight symbol
*/
const getPolyLineSymbol = (graphic: __esri.Graphic, color: string): __esri.Graphic => {
  const layer: any = graphic.layer
  let symbolWidth, graphicInfoValue, layerInfoValue, i
  symbolWidth = 4 // default line width
  //if layer is valid and have valid renderer then only check for other symbol properties
  if (layer?.renderer) {
    if (layer.renderer?.symbol && layer.renderer.symbol.hasOwnProperty('width')) {
      symbolWidth = layer.renderer.symbol.width
    } else if (layer.renderer?.infos?.length > 0) {
      for (i = 0; i < layer.renderer.infos.length; i++) {
        if (layer.typeIdField) {
          graphicInfoValue = graphic.attributes[layer.typeIdField]
        } else if (layer.renderer.attributeField) {
          graphicInfoValue = graphic.attributes[layer.renderer.attributeField]
        }
        layerInfoValue = layer.renderer.infos[i].value
        // To get properties of symbol when infos contains other than class break renderer.
        if (graphicInfoValue !== undefined && graphicInfoValue !== null &&
          graphicInfoValue !== '' && layerInfoValue !== undefined &&
          layerInfoValue !== null && layerInfoValue !== '') {
          if (graphicInfoValue.toString() === layerInfoValue.toString() &&
            layer.renderer.infos[i].symbol.hasOwnProperty('width')) {
            symbolWidth = layer.renderer.infos[i].symbol.width
          }
        }
      }
    } else if (layer.renderer.defaultSymbol &&
      layer.renderer.defaultSymbol.hasOwnProperty('width')) {
      symbolWidth = layer.renderer.defaultSymbol.width
    }
  }
  const symbolLine = {
    type: 'simple-line',
    color: color || '#00FFFF',
    width: 4,
    style: 'solid',
    outline: {
      color: '#00FFFF',
      width: symbolWidth
    }
  }
  const graphics = new Graphic({
    geometry: graphic.geometry,
    symbol: symbolLine,
    attributes: graphic.attributes
  })
  return graphics
}

/**
* This function is used to get highlight graphics for polygon geometry
* @param graphic - selected feature graphic which needs to be highlighted
* @param color - highlight color
* @returns  - Returns the polygon graphic with highlight symbol
*/
const getPolygonSymbol = (graphic: __esri.Graphic, color: string): __esri.Graphic => {
  const symbolPolygon = {
    type: 'simple-fill',
    color: [0, 255, 255, 0],
    style: 'solid',
    outline: {
      color: color || '#00FFFF',
      width: 2
    }
  }
  const graphics = new Graphic({
    geometry: graphic.geometry,
    symbol: symbolPolygon,
    attributes: graphic.attributes
  })
  return graphics
}

/**
 * Returns the symbol for showing sketched graphics on the map
 * @param geometryType - Geometry type (point/polyline/polygon)
 * @param symbolColor - Symbol color string
 * @returns  - Returns the symbol for the geometryType using the symbol color
 */
export const getSketchSymbol = (geometryType: string, symbolColor?: string): any => {
  let symbol
  //Use default color if symbolColor is not valid
  if (!symbolColor) {
    symbolColor = '#00FFFF'
  }
  const color = new Color(symbolColor)
  //use same outline color with alpha 1
  const outlineColor = new Color(symbolColor)
  outlineColor.a = 1
  switch (geometryType) {
    case 'point':
    case 'multipoint':
      symbol = {
        type: 'simple-marker',
        style: 'circle',
        color: color,
        outline: {
          color: color,
          width: 1
        }
      }
      break
    case 'polyline':
      symbol = {
        type: 'simple-line',
        color: color,
        width: 4,
        style: 'solid',
        outline: {
          color: color,
          width: 1
        }
      }
      break
    case 'polygon':
      symbol = {
        type: 'simple-fill',
        color: color,
        style: 'solid',
        outline: {
          color: outlineColor,
          width: 1
        }
      }
      break
    default:
      break
  }
  return symbol
}

/**
 * Returns the symbol for showing buffer graphics on the map
 * Always returns buffer symbol with alpha 0.3 (30% Transparent)
 * @param color - Buffer Symbol color string
 * @returns  - Returns the symbol for the buffer using the symbol color
 */
export const getBufferSymbol = (color: string): __esri.Symbol => {
  const bufferSymbol: any = getSketchSymbol('polygon', color)
  if (bufferSymbol) {
    bufferSymbol.color.a = 0.3
  }
  return bufferSymbol
}
