import { type IMState, React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { type IMConfig } from '../config'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem } from 'jimu-ui'

interface widgetInfo {
  widgetId: string
  label: string
}

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const [widgetList, setWidgetList] = useState<widgetInfo[]>([])
  const appConfig = useSelector((state: IMState) => {
    // Da die settings.tsx im Builder-Modus verwendet wird, muss man über
    // state.appStateInBuilder.appConfig auf die Config der App zugreifen
    // Zur Laufzeit in der widget.tsx würde man stattdessen state.appConfig verwenden
    return state.appStateInBuilder.appConfig
  })

  // Die Widgets aus der appConfig auslesen, nachdem sich diese geändert hat
  useEffect(() => {
    console.log(appConfig.views)
    const widgetIds = Object.keys(appConfig.widgets)
    // Hier könnte man die Widgets noch nach einem bestimmten Typ filtern
    const widgets = widgetIds.map(widgetId => {
      return {
        widgetId: widgetId,
        label: appConfig.widgets[widgetId].label
      }
    })
    setWidgetList(widgets)
  }, [appConfig])

  const onWidgetSelected = (event: any) => {
    props.onSettingChange({ id: props.id, config: props.config.set('widgetId', event.target.id) })
  }

  return <div className="widget-setting-demo">
  <Dropdown activeIcon>
    <DropdownButton>
      {widgetList.filter(item => item.widgetId === props.config.widgetId).map(item => item.label)}
    </DropdownButton>
    <DropdownMenu>
        {widgetList.map(item => {
          if (props.config.widgetId === item.widgetId) {
            return <DropdownItem active onClick={onWidgetSelected} id={item.widgetId}>{item.label}</DropdownItem>
          } else {
            return <DropdownItem onClick={onWidgetSelected} id={item.widgetId}>{item.label}</DropdownItem>
          }
        })}
    </DropdownMenu>
  </Dropdown>
  </div>
}

export default Setting
