import { type AllWidgetSettingProps } from 'jimu-for-builder'
import React from 'react'
import { type IMConfig } from '../config'
import { SettingSection } from 'jimu-ui/advanced/setting-components'
import { TextInput } from 'jimu-ui'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const onUrlChanged = (urlValue: string) => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set('proxyUrl', urlValue)
    })
  }

  return (
        <div className="widget-setting-proxy">
            <SettingSection title='Proxy URL'>
                <TextInput type="text" defaultValue={props.config.proxyUrl} onAcceptValue={onUrlChanged} />
            </SettingSection>
        </div>
  )
}

export default Setting
