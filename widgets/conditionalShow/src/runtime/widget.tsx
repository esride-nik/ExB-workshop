import { React, utils, type AllWidgetProps } from 'jimu-core'

interface IState {
  visibility: boolean
}

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>, IState> {
  componentDidUpdate (prevProps: AllWidgetProps<unknown>) {
    if (utils.getValue(this.props, 'stateProps.queryString') !== utils.getValue(prevProps, 'stateProps.queryString')) {
      const editTimestamp = this.props.stateProps.queryString

      // if editDate is today, then set visibility state props to true
      const now = new Date()
      const editDate = new Date(editTimestamp)
      if (now.getDate() === editDate.getDate() && now.getMonth() === editDate.getMonth() && now.getFullYear() === editDate.getFullYear()) {
        this.setState({ visibility: true })
      } else {
        this.setState({ visibility: false })
      }
    }
  }

  isDsConfigured = () => {
    return this.props?.stateProps !== undefined
  }

  render = () => {
    if (!this.isDsConfigured()) {
      return <h3>
        Wait for visibility...
      </h3>
    }

    const display = this.state?.visibility ? 'block' : 'none'
    return <div className="widget-subscribe" style={{ display: display }}>
    {/* return <div className="widget-subscribe" style={{ overflow: 'auto', maxHeight: '700px', display: this.state?.visibility ? 'block' : 'none' }}> */}
    </div>
  }
}
