import { type extensionSpec, type AppConfig, loadArcGISJSAPIModules } from 'jimu-core'

export default class ChangeMap implements extensionSpec.AppConfigProcessorExtension {
  id = 'setProxy'
  widgetId: string

  async process (appConfig: AppConfig): Promise<AppConfig> {
    // Do not replace when run in builder.
    if (window.jimuConfig.isInBuilder) {
      return Promise.resolve(appConfig)
    }
    loadArcGISJSAPIModules(['esri/config']).then(modules => {
      if (modules && modules.length > 0) {
        const esriConfig = modules[0] as __esri.config
        esriConfig.request.proxyUrl = 'dummy'
        const keys = Object.keys(appConfig.widgets)
        keys.forEach((key) => {
          const widget = appConfig.widgets[key as keyof typeof appConfig.widgets]
          if (widget.uri.includes('proxyWidget') && widget.config?.proxyUrl) {
            console.log('Set Proxy to ' + widget.config.proxyUrl)
            esriConfig.request.proxyUrl = widget.config.proxyUrl
          }
        })
      }
    })

    return Promise.resolve(appConfig)
  }
}
