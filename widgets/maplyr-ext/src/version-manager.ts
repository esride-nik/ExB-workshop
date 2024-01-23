import { BaseVersionManager } from 'jimu-core'

class VersionManager extends BaseVersionManager {
  versions = [{
    version: '1.12.0',
    description: 'disable old app data-action, delete unused config prop selectedJimuLayerIds',
    upgrader: (oldConfig) => {
      let newConfig = oldConfig
      newConfig = newConfig.without('selectedJimuLayerIds')
      return newConfig
    }
  }]
}

export const versionManager = new VersionManager()
