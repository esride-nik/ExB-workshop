'use client'
import { React, type AllWidgetProps, getAppStore, type SectionNavInfo, appActions, jimuHistory } from 'jimu-core'
import type { IMConfig } from '../config'
import { useEffect, useRef } from 'react'
import { Button } from 'jimu-ui'

interface SectionInfos {
  sectionId: string
  viewId: string
}

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const sectionId = useRef<string>(undefined)
  const viewId = useRef<string>(undefined)

  // Auslesen in welcher Section und in welcher View das Widget liegt,
  // mit Hilfe der WidgetId
  const getSectionInfos = (widgetId: string): SectionInfos => {
    let viewId: string, sectionId: string
    const appSections = getAppStore().getState().appConfig.sections
    const layoutsArray = Object.values(getAppStore().getState().appConfig.layouts)
    layoutsArray.forEach(layout => {
      if (layout.content) {
        const contentArray = Object.values(layout.content)
        const widgetContent = contentArray.filter(w => w.widgetId === widgetId)
        if (widgetContent.length > 0) {
          if (layout.parent?.id && layout.parent?.id?.startsWith('view_')) {
            viewId = layout.parent.id
            if (appSections) {
              const sectionArray = Object.values(appSections)
              sectionArray.forEach(section => {
                const viewsArray = Object.values(section.views)
                const myViewsArray = viewsArray.filter(v => v === viewId)
                if (myViewsArray.length > 0) {
                  sectionId = section.id
                }
              })
            }
          }
        }
      }
    })
    return {
      sectionId: sectionId,
      viewId: viewId
    }
  }

  const switchSection = () => {
    // Beim 1. Mal auslesen in welcher Section und in welcher View das Widget liegt,
    // das geöffnet werden soll.
    // Ich arbeite hier mit der WidgetID, die in der Config des Widgets hinterlegt ist.
    // Alternativ könnte man auch das 1. Widget eines bestimmten Typs in der Config suchen.
    // Wenn man weiß, dass dieses nur einmal in der App vorkommt. Beispiel:
    // https://github.com/Esri/arcgis-experience-builder-sdk-resources/blob/master/widgets/control-the-widget-state/src/runtime/widget.tsx#L55
    if (sectionId.current === undefined) {
      const sectionInfos = getSectionInfos(props.config.widgetId)
      sectionId.current = sectionInfos.sectionId
      viewId.current = sectionInfos.viewId
    }
    // Aktuellen Status der Section auslesen
    const state = getAppStore()?.getState()
    const views = state.appConfig.sections?.[sectionId.current]?.views
    const sectionNavInfo = state?.appRuntimeInfo?.sectionNavInfos?.[sectionId.current]
    const currentViewId = sectionNavInfo?.currentViewId || views[0]
    const visibleViews = sectionNavInfo?.visibleViews || views

    // Zukünftigen Status der Section festlegen
    const nextNavInfo: SectionNavInfo = {
      visibleViews: visibleViews.asMutable(),
      previousViewId: currentViewId,
      currentViewId: viewId.current,
      useProgress: false,
      progress: views.indexOf(viewId.current) / (views.length - 1)
    }
    getAppStore().dispatch(appActions.sectionNavInfoChanged(sectionId.current, nextNavInfo))
    jimuHistory.changeViewBySectionNavInfo(sectionId.current, nextNavInfo)
  }

  // Wenn WidgetID geändert wird, dann SectionID zurücksetzen
  // Das neue Widget könnte in einer anderen Section und View liegen
  useEffect(() => {
    if (sectionId.current) {
      sectionId.current = undefined
    }
  }, [props.config.widgetId])

  return (
    <div className="widget-demo jimu-widget m-2">
      <p>Widget per ID in Section / View öffnen</p>
      <p>WidgetID: {props.config.widgetId}</p>
      <Button onClick={switchSection}>Öffnen</Button>
    </div>
  )
}

export default Widget
