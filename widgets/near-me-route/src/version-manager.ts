import { BaseVersionManager } from 'jimu-core'
import { type IMConfig } from './config'
import { defaultConfigInfo } from './setting/constants'

class VersionManager extends BaseVersionManager {
  versions = [{
    version: '1.13.0',
    description: 'To avoid crash, reset the previous configuration from beta release',
    upgrader: (oldConfig: IMConfig) => {
      let newConfig = oldConfig
      //Add settings for promptTextMessage which is newly added in configuration
      newConfig = newConfig.setIn(['generalSettings', 'promptTextMessage'], '')
      newConfig = newConfig.setIn(['generalSettings', 'promptTextMsgStyleSettings'], {
        fontFamily: 'Avenir Next',
        fontBold: false,
        fontItalic: false,
        fontUnderline: false,
        fontStrike: false,
        fontColor: 'var(--black)',
        fontSize: '12px'
      })
      //Reset the previous analysis configuration (as those are of beta version and in this first release version we did major changes)
      if (newConfig.configInfo) {
        for (const dsId in newConfig.configInfo) {
          newConfig = newConfig.setIn(['configInfo', dsId], defaultConfigInfo)
        }
      }
      return newConfig
    }
  }, {
    version: '1.14.0',
    description: '1.14.0',
    upgrader: (oldConfig: IMConfig) => {
      let newConfig = oldConfig
      //Add the following settings which is newly added in configuration
      if (newConfig.configInfo) {
        for (const dsId in newConfig.configInfo) {
          const oldSearchSettingConfig = oldConfig.configInfo[dsId].searchSettings
          //values depends on previous config
          newConfig = newConfig.setIn(['configInfo', dsId, 'searchSettings', 'showInputAddress'], true)
          newConfig = newConfig.setIn(['configInfo', dsId, 'searchSettings', 'headingLabelStyle'], {
            fontFamily: 'Avenir Next',
            fontBold: false,
            fontItalic: false,
            fontUnderline: false,
            fontStrike: false,
            fontColor: 'var(--black)',
            fontSize: '13px'
          })
          newConfig = newConfig.setIn(['configInfo', dsId, 'searchSettings', 'sketchTools'], {
            showPoint: oldSearchSettingConfig.showSketchTools,
            showPolyline: oldSearchSettingConfig.showSketchTools,
            showPolygon: oldSearchSettingConfig.showSketchTools
          })
          newConfig = newConfig.setIn(['configInfo', dsId, 'analysisSettings', 'displayMapSymbols'], false)
          newConfig = newConfig.setIn(['configInfo', dsId, 'analysisSettings', 'showDistFromInputLocation'], oldSearchSettingConfig.showDistFromInputLocation)
          newConfig = newConfig.setIn(['configInfo', dsId, 'analysisSettings', 'onlyShowLayersResult'], oldSearchSettingConfig.onlyShowLayersResult)
        }
      }
      return newConfig
    }
  }]
}

export const versionManager = new VersionManager()
