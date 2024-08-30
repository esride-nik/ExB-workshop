import { type DataSource, DataSourceManager, Immutable, DataSourceTypes, type ImmutableObject, getAppStore, loadArcGISJSAPIModule } from 'jimu-core'
import { MapViewManager } from 'jimu-arcgis'
import { type SearchSettings, type ColorMatches, type ColorMatchUpdate } from '../config'

/**
 * Get the combination of colors
 * @param _colorMatches Update the color depending on the color match
 * @param colors Array of colors
 * @returns colors for each fields
 */

export const applyColorMatchColors = (_colorMatches: ColorMatchUpdate | ImmutableObject<ColorMatches>, colors: string[]): ImmutableObject<ColorMatches> => {
  if (!colors) return
  let colorMatches = Immutable({}) as ImmutableObject<ColorMatches>
  Object.entries(_colorMatches).forEach(([name, _match], index) => {
    const color = getColorMatchColor(colors, index)
    const newItem = { ..._match }
    newItem._fillColor = color
    colorMatches = colorMatches.set(name, newItem)
  })
  return colorMatches
}

/**
 * Get color for each element
 * @param colors Array of colors
 * @param index From 0 to number
 * @returns Specific colors
 */

const getColorMatchColor = (colors: string[], index: number = 0): string => {
  if (!colors?.length) return
  const idx = index % colors.length
  const color = colors[idx]
  return color
}

/**
 * Get the instance of current layer datasource
 * @param currentLayerDsId Current layer datasource used
 * @returns layer datasource instance
 */
export const getSelectedLayerInstance = (currentLayerDsId: string): DataSource => {
  return DataSourceManager.getInstance().getDataSource(currentLayerDsId)
}

//Specifies unit wise buffer limits
const enum UnitWiseMaxDistance {
  Feet = 5280000,
  Miles = 1000,
  Kilometers = 1609.344,
  Meters = 1609344,
  Yards = 1760000
}

/**
 * Limits a buffer distance.
 * @param unit Measurement units, e.g., feet, miles, meters
 * @returns The max value for the selected unit,
 */

export const getMaxBufferLimit = (unit: string) => {
  switch (unit) {
    case 'feet':
      return UnitWiseMaxDistance.Feet
    case 'miles':
      return UnitWiseMaxDistance.Miles
    case 'kilometers':
      return UnitWiseMaxDistance.Kilometers
    case 'meters':
      return UnitWiseMaxDistance.Meters
    case 'yards':
      return UnitWiseMaxDistance.Yards
    default:
      return 1000
  }
}

/**
 * Limits the distance to max of the selected unit
 * @param distance Distance subject to limit
 * @param unit Measurement units, e.g., feet, miles, meters
 * @return `distance` capped at the maximum for the `unit` type
 */

export const validateMaxBufferDistance = (distance: number, unit: string) => {
  const maxDistanceForUnit = getMaxBufferLimit(unit)
  if (distance > maxDistanceForUnit) {
    return maxDistanceForUnit
  }
  return distance
}

/**
 * Get all the available layers from the webmap/webscene
 * @param mapViewGroup specifies the map view group of the selected webmap/webscene
 * @returns all available layers
 */
export const getAllAvailableLayers = async (mapViewId: string): Promise<DataSource[]> => {
  let layerInstance = null
  const allDsLayers = []
  let dsAdded = false
  //get the layer views which includes different types layers e.g. map-image, feature layer
  const jimuMapView = MapViewManager.getInstance().getJimuMapViewById(mapViewId)
  const jimuLayerViews = await jimuMapView?.whenAllJimuLayerViewLoaded()

  for (const jimuLayerViewId in jimuLayerViews) {
    const currentJimuLayerView = await jimuMapView.whenJimuLayerViewLoaded(jimuLayerViewId)
    layerInstance = getSelectedLayerInstance(currentJimuLayerView.layerDataSourceId)
    if (layerInstance) {
      if (layerInstance?.type === DataSourceTypes.MapService || layerInstance?.type === DataSourceTypes.GroupLayer) {
        const recursiveCheckForGroupLayers = (grpLayer) => {
          const grpChildlayers = grpLayer.getChildDataSources()
          grpChildlayers.forEach((subLayers) => {
            if (subLayers?.type === DataSourceTypes.GroupLayer) {
              recursiveCheckForGroupLayers(subLayers)
            } else {
              allDsLayers.push(subLayers)
            }
          })
        }
        recursiveCheckForGroupLayers(layerInstance)
      } else { //for feature layer
        if (allDsLayers.length > 0) { //check for if map service child data source is same as feature layer ds id
          const matchedLayerWithMapService = allDsLayers.find(item => item.id === layerInstance.id)
          if (!matchedLayerWithMapService) {
            dsAdded = true
          }
          if (dsAdded) allDsLayers.push(layerInstance)
        } else {
          allDsLayers.push(layerInstance)
        }
      }
    }
  }
  return allDsLayers
}

/**
 * Get the default selected display field for proximity
 * @param layerDefinition selected layers definition
 * @returns displayfield
 */
export const getDisplayField = (layerDefinition): string => {
  let displayField: string = ''
  if (layerDefinition?.objectIdField) {
    displayField = layerDefinition.objectIdField
  } else if (layerDefinition?.displayField) {
    displayField = layerDefinition.displayField
  } else {
    displayField = layerDefinition?.fields?.[0].name
  }
  return displayField
}

/**
 * Get the display label for groups and feature list
 * @param label group field value or display field value
 * @param noValueNlsString string to be displayed in case of no value
 * @returns display label for groups and feature list
 */
export const getDisplayLabel = (label: any, noValueNlsString: string): string => {
  let title = label
  if (typeof (title) === 'string') {
    title = title.trim()
  }
  return [null, undefined, ''].includes(title) ? noValueNlsString : title
}

/**
 * Get the portal default unit
 * @returns portal default unit
 */
export const getPortalUnit = (): string => {
  const portalSelf = getAppStore().getState().portalSelf
  return portalSelf?.units === 'english' ? 'miles' : 'kilometers'
}

export interface SearchWorkflow {
  searchByLocation: boolean
  searchCurrentExtent: boolean
  showAllFeatures: boolean
}

/**
 * Returns the workflow(SearchBy Location/CurrentExtent/ShowAll) based on search configuration.
 * @param searchSettings from the configuration
 * @returns workflow flags
 */
export const getSearchWorkflow = (searchSettings: SearchSettings): SearchWorkflow => {
  const workflow: SearchWorkflow = {
    searchByLocation: false,
    searchCurrentExtent: false,
    showAllFeatures: false
  }
  if (searchSettings) {
    const { searchByActiveMapArea, includeFeaturesOutsideMapArea } = searchSettings
    // if search by active map area is enabled
    // else search by location is enabled
    if (searchByActiveMapArea) {
      //if searchByActiveMapArea is enabled and includeFeaturesOutsideMapArea means show all features
      //else only search in current extent
      if (includeFeaturesOutsideMapArea) {
        workflow.showAllFeatures = true
      } else {
        workflow.searchCurrentExtent = true
      }
    } else {
      workflow.searchByLocation = true
    }
  }
  return workflow
}

/**
 * Get the output datasource id
 * @param widgetId Widget id
 * @param layerAnalysisType Layer analysis type
 * @param analysisId analysis id
 * @returns output data source id
 */
export const getOutputDsId = (widgetId: string, layerAnalysisType: string, analysisId: string): string => {
  return `${widgetId}_output_${layerAnalysisType}_${analysisId}`
}

/**
 * Get random unique analysis id
 * @returns unique analysis id
 */
export const getUniqueAnalysisId = (): string => {
  return `${Math.random()}`.slice(2).toString()
}

/**
 * Create the html node from symbol using symbol utils methods
 * @param selectedRecord selected record
 * @param symbolRef symbol div reference
 */
export const createSymbol = async (selectedRecord: any, symbolRef: React.RefObject<HTMLDivElement>) => {
  const symbolUtils = await loadArcGISJSAPIModule('esri/symbols/support/symbolUtils')
  symbolUtils.getDisplayedSymbol(selectedRecord.feature as __esri.Graphic).then(async (symbol) => {
    if (symbol.size > 23) {
      symbol.set('size', 23)
    }
    if (selectedRecord.dataSource?.getGeometryType() === 'esriGeometryPoint' && (symbol.height || symbol.width)) {
      if (symbol.height < 15) {
        symbol.set('height', 15)
      }
      if (symbol.width < 15) {
        symbol.set('width', 15)
      }
    }
    const nodeHtml = document.createElement('div')
    nodeHtml.className = 'w-100 h-100 d-flex justify-content-center align-items-center'
    await symbolUtils.renderPreviewHTML(symbol as __esri.symbolsSymbol, {
      node: nodeHtml
    })
    if (symbolRef.current.innerHTML) {
      symbolRef.current.innerHTML = ''
    }
    if (nodeHtml.children?.length) {
      const imgOrSvgElm = nodeHtml.children[0]
      if (imgOrSvgElm) {
        const height = Number(imgOrSvgElm.getAttribute('height'))
        const width = Number(imgOrSvgElm.getAttribute('width'))
        if (width > 30) {
          imgOrSvgElm.setAttribute('width', '30')
        }
        imgOrSvgElm.setAttribute('viewBox', `0 0 ${width} ${height}`)
        symbolRef.current.appendChild(nodeHtml)
      }
    }
  })
}
