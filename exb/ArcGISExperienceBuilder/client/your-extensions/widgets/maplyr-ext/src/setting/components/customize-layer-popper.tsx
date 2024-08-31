/** @jsx jsx */
import { Switch } from 'jimu-ui'
import defaultMessages from '../translations/default'
import {
  JimuLayerViewSelector,
  SettingRow,
  SettingSection
} from 'jimu-ui/advanced/setting-components'
import { getStyleForLI } from '../lib/style'
import { jsx, defaultMessages as jimuCoreDefaultMessages, hooks, React } from 'jimu-core'
import { type WidgetSettingProps } from '../setting'
import { MapViewManager } from 'jimu-arcgis'

interface Props {
  mapViewId: string
  isCustomizeEnabled: boolean
  settingProps: WidgetSettingProps
}

export default function CustomizeLayerPopper (props: Props) {
  const {
    mapViewId,
    isCustomizeEnabled,
    settingProps
  } = props
  const translate = hooks.useTranslation(defaultMessages, jimuCoreDefaultMessages)
  const localMapView = MapViewManager.getInstance().getJimuMapViewById(mapViewId)

  const getAllTreeItemKeys = React.useCallback(() => {
    if (!mapViewId) {
      return []
    }
    const keys = []
    for (const key of Object.keys(localMapView.jimuLayerViews)) {
      keys.push(key)
    }
    return keys
  }, [localMapView.jimuLayerViews, mapViewId])

  const getInitialSelected = React.useCallback(() => {
    if (!mapViewId) {
      return []
    }
    const keys = getAllTreeItemKeys()
    const hiddenSet = new Set(settingProps.config?.customizeLayerOptions?.[mapViewId]?.hiddenJimuLayerViewIds)
    return keys.filter(key => {
      return !hiddenSet.has(key)
    })
  }, [getAllTreeItemKeys, mapViewId, settingProps.config?.customizeLayerOptions])

  const defaultSelectedValues = getInitialSelected()
  const [selectedValues, setSelectedValues] = React.useState(defaultSelectedValues)

  const onCustomizeLayerChange = (hiddenJimuLayerViewIds: string[]) => {
    const newConfig = settingProps.config.setIn(['customizeLayerOptions', mapViewId, 'hiddenJimuLayerViewIds'], hiddenJimuLayerViewIds)

    settingProps.onSettingChange({
      id: settingProps.id,
      config: newConfig
    })
  }

  const onToggleCustomizeLayer = async (mapViewId: string, isEnabled: boolean) => {
    const keys = getAllTreeItemKeys()
    const allKeysSet = new Set(keys)

    if (isEnabled) {
      const newSelectedValues = Array.from(allKeysSet)
      setSelectedValues(newSelectedValues)
    } else {
      // Restore the layer's listMode
      const selectedSet = new Set(selectedValues)
      const hiddenValues = keys.filter(key => !selectedSet.has(key))
      for (const hiddenLayerViewId of hiddenValues) {
        const jimuLayerView = await localMapView.whenJimuLayerViewLoaded(hiddenLayerViewId)
        const layerObj = jimuLayerView.layer
        layerObj.listMode = 'show'
      }
      setSelectedValues([])
    }

    // No matter it's on/off, clean up the ids array
    settingProps.onSettingChange({
      id: settingProps.id,
      config: settingProps.config.setIn(['customizeLayerOptions', mapViewId], {
        isEnabled: isEnabled,
        hiddenJimuLayerViewIds: []
      })
    })
  }

  const onLayerViewChange = (jimuLayerViewIds: string[]) => {
    const layerViewIds = getAllTreeItemKeys()
    const displayedIdSet = new Set(jimuLayerViewIds)
    const hiddenJimuLayerViewIds = []
    for (const id of layerViewIds) {
      if (!displayedIdSet.has(id)) {
        hiddenJimuLayerViewIds.push(id)
      }
    }

    setSelectedValues(jimuLayerViewIds)
    onCustomizeLayerChange(hiddenJimuLayerViewIds)
  }

  return (
    <React.Fragment>
      <div className="w-100 h-100" css={getStyleForLI(settingProps.theme)}>
        <div className="w-100 h-100 layer-item-panel">
          <div className="setting-container">
            <SettingSection>
              <SettingRow label={translate('enableCustomizeLayers')}>
                <Switch
                  className="can-x-switch"
                  checked={isCustomizeEnabled}
                  data-key="enableCustomizeLayers"
                  onChange={(event) => {
                    onToggleCustomizeLayer(mapViewId, event.target.checked)
                  }}
                  aria-label={translate('enableCustomizeLayers')}
                />
              </SettingRow>
              {isCustomizeEnabled && (
                <SettingRow>
                  <JimuLayerViewSelector
                    // Use key attribute to force create new component instance
                    key={mapViewId}
                    jimuMapViewId={mapViewId}
                    onChange={onLayerViewChange}
                    isMultiSelection
                    defaultSelectedValues={defaultSelectedValues}
                  ></JimuLayerViewSelector>
                </SettingRow>
              )}
            </SettingSection>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
