/** @jsx jsx */
import { React, css, jsx, type IMThemeVariables, type SerializedStyles, polished, defaultMessages as jimuCoreDefaultMessages, type IntlShape, classNames } from 'jimu-core'
import { Button, defaultMessages as jimuUIDefaultMessages } from 'jimu-ui'
import defaultMessages from '../translations/default'
import { LeftOutlined } from 'jimu-icons/outlined/directional/left'
import { CloseOutlined } from 'jimu-icons/outlined/editor/close'

interface Props {
  intl: IntlShape
  title: string
  hideBackArrow?: boolean
  showCloseIcon?: boolean
  theme: IMThemeVariables
  children?: React.ReactNode
  showOkButton?: boolean
  disableOkButton?: boolean
  onOkButtonClicked?: () => void
  onBack: () => void
}

export default class SidepopperBackArrow extends React.PureComponent<Props> {
  backRef = React.createRef<HTMLDivElement>()
  getStyle (theme: IMThemeVariables): SerializedStyles {
    return css`
      .setting-header {
        padding: ${polished.rem(18)} ${polished.rem(16)} ${polished.rem(0)} ${polished.rem(16)}
      }

      .setting-title {
        font-size: ${polished.rem(16)};
        color: ${theme?.colors?.palette?.dark?.[600]}
      }

      .commonOkButton {
        padding: 9px 17px 0px 17px;
      }

      .hideCursorPointer {
        cursor: default;
      }
    `
  }

  nls = (id: string) => {
    const messages = Object.assign({}, defaultMessages, jimuUIDefaultMessages, jimuCoreDefaultMessages)
    //for unit testing no need to mock intl we can directly use default en msg
    if (this.props.intl?.formatMessage) {
      return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] })
    } else {
      return messages[id]
    }
  }

  /**
   * Focus on back icon
   */
  backRefFocus = () => {
    setTimeout(() => {
      this.backRef?.current?.focus()
    }, 50)
  }

  /**
   * Update respected functionality/ save the config on OK button click
   */
  onOkButtonClick = () => {
    this.props.onOkButtonClicked()
  }

  render () {
    return (
      <div tabIndex={-1} className='w-100 h-100' css={this.getStyle(this.props.theme)}>
        <div tabIndex={-1} className='w-100 d-flex align-items-center justify-content-between setting-header border-0' style={{ height: '38px', marginBottom: '20px' }}>
          {(!this.props.hideBackArrow)
            ? <div tabIndex={-1} className='h-100'>
              <div ref={this.backRef} tabIndex={0} className='d-flex align-items-center h-100' style={{ cursor: 'pointer' }}
                onClick={this.props.onBack}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    this.props.onBack()
                  }
                }}>
                <div className='d-flex align-items-center' title={this.nls('back')} aria-label={this.nls('back')}>
                  <LeftOutlined autoFlip size='14' className='text-dark' />
                </div>
                <div aria-label={this.props.title}
                  className='pl-2 setting-title' style={{ maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={this.props.title}
                >{this.props.title}
                </div>
              </div>
            </div>
            : <div aria-label={this.props.title} className='setting-title mt-1' style={{ maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={this.props.title}>
              {this.props.title}
            </div>}
          {this.props.showCloseIcon &&
            <Button role={'button'} aria-label={this.props.title + ' ' + this.nls('close')} title={this.nls('close')} size='sm' icon type='tertiary' onClick={this.props.onBack}>
              <CloseOutlined autoFlip size='14' className='text-dark' /></Button>
          }
        </div>
        {this.props.children}
        {this.props.showOkButton &&
          <div className='commonOkButton'>
            <Button role={'button'} className={classNames('w-100 text-dark', this.props.disableOkButton ? 'hideCursorPointer' : '')} type={'primary'} disabled={this.props.disableOkButton} onClick={this.onOkButtonClick.bind(this)} >
              {this.nls('commonModalOk')}
            </Button>
          </div>
        }
      </div>
    )
  }
}
