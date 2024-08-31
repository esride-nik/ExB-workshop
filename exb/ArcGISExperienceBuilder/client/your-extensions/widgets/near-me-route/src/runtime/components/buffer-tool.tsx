/** @jsx jsx */
import { React, jsx, type IMThemeVariables, geometryUtils, type IntlShape } from 'jimu-core'
import { NumericInput, Select, Option } from 'jimu-ui'
import { getBufferStyle } from '../lib/style'
import type Geometry from 'esri/geometry/Geometry'
import { unitOptions } from '../constant'
import { getMaxBufferLimit, validateMaxBufferDistance } from '../../common/utils'
import { defaultBufferDistance } from '../../setting/constants'
import { type SearchSettings } from '../../config'
import defaultMessages from '../translations/default'

interface Props {
  theme?: IMThemeVariables
  intl: IntlShape
  config: SearchSettings
  geometry: __esri.Geometry
  distanceUnit: string
  bufferDistance: number
  bufferHeaderLabel: string
  refreshButtonClicked: boolean
  bufferComplete: (bufferGeometry: Geometry) => void
  distanceChanged: (distanceValue: number) => void
  unitChanged: (unit: string) => void
}

interface State {
  distanceUnit: string
  bufferDistance: number
}

export default class BufferTool extends React.PureComponent<Props, State> {
  numberValueInputRef: any
  checkIfDistanceChange: boolean
  constructor (props) {
    super(props)
    this.state = {
      distanceUnit: this.props?.distanceUnit,
      bufferDistance: this.props?.bufferDistance
    }
  }

  nls = (id: string) => {
    const messages = Object.assign({}, defaultMessages)
    //for unit testing no need to mock intl we can directly use default en msg
    if (this.props.intl?.formatMessage) {
      return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] })
    } else {
      return messages[id]
    }
  }

  /**
   * On buffer tool mount update the units and get the buffer geometry
   */
  componentDidMount = () => {
    this.props.unitChanged(this.state.distanceUnit)
    this.getBufferGeometry()
  }

  /**
   * Check the current config property or runtime property changed in live view
   * @param prevProps previous property
   */
  componentDidUpdate = (prevProps) => {
    //check if inicdent buffer geometry is changed
    if (this.props?.geometry !== prevProps?.geometry) {
      this.getBufferGeometry()
    }

    //check if distance units value is changed
    if (this.props?.distanceUnit !== prevProps.distanceUnit) {
      this.setState({
        distanceUnit: this.props?.distanceUnit
      }, () => {
        //valid current distance as per unit
        this.onUnitChange(this.props.distanceUnit)
      })
    }

    //check if buffer distance value is changed
    if (this.props?.bufferDistance !== prevProps.bufferDistance) {
      this.setState({
        bufferDistance: this.props?.bufferDistance
      }, () => {
        this.props.distanceChanged(this.props?.bufferDistance)
        this.getBufferGeometry()
      })
    }

    //check if refresh button clicked props changed
    if (prevProps?.refreshButtonClicked !== this.props?.refreshButtonClicked) {
      if (this.props.refreshButtonClicked) {
        this.setState({
          bufferDistance: this.props.bufferDistance,
          distanceUnit: this.props.distanceUnit
        })
      }
    }
  }

  /**
   * get planar/geodesic buffer polygons at a specified distance around the input geometry
   */
  getBufferGeometry = async () => {
    if (this.props.geometry) {
      if (this.state.bufferDistance && this.state.distanceUnit && this.state.bufferDistance > 0) {
        const bufferGeometry = await geometryUtils.createBuffer(this.props.geometry, [this.state.bufferDistance], this.state.distanceUnit)
        //as we will always deal with only one geometry get first geometry only
        const firstGeom = Array.isArray(bufferGeometry) ? bufferGeometry[0] : bufferGeometry
        this.props.bufferComplete(firstGeom)
      } else {
        this.props.bufferComplete(null)
      }
    }
  }

  /**
   * Update the buffer distance value
   * @param value distance value
   */
  onDistanceHandleChange = (value?: number) => {
    this.checkIfDistanceChange = true
    this.setState({
      bufferDistance: value ?? defaultBufferDistance
    })
  }

  //blur the distance numeric input
  onDistancePressEnter = () => {
    this.numberValueInputRef.blur()
  }

  /**
 * handle accept value event for distance box
 */
  onDistanceBlur = () => {
    if (this.checkIfDistanceChange) {
      this.updateDistance()
      this.checkIfDistanceChange = false
    }
  }

  /**
   * Update the distanceChanged props and get the buffer geometry
   */
  updateDistance = () => {
    this.props.distanceChanged(this.state.bufferDistance)
    this.getBufferGeometry()
  }

  /**
   * handle change event for unit select
   * @param value updated unit value
   */
  onUnitChange = (value: string) => {
    const bufferDistanceMaxLimit = validateMaxBufferDistance(this.state.bufferDistance, value)
    this.props.distanceChanged(bufferDistanceMaxLimit)
    this.props.unitChanged(value)
    this.setState({
      distanceUnit: value,
      bufferDistance: bufferDistanceMaxLimit
    }, () => {
      this.getBufferGeometry()
    })
  }

  render () {
    return (
      <div css={getBufferStyle(this.props?.theme)}>
        {this.props.config.showDistanceSettings &&
          <React.Fragment>
            <div className={'d-inline w-100 pt-1'} >
              <div className='column-section'>
                <NumericInput aria-label={this.props.bufferHeaderLabel}
                 className='w-50' value={this.state.bufferDistance}
                 size='sm'
                 min={0} max={getMaxBufferLimit(this.state.distanceUnit)}
                 ref={ref => { this.numberValueInputRef = ref }}
                 onBlur={this.onDistanceBlur}
                 onPressEnter={this.onDistancePressEnter}
                 onChange={this.onDistanceHandleChange} />
                <Select aria-label={this.props.bufferHeaderLabel} className='w-50 pl-2' size={'sm'} value={this.state.distanceUnit} onChange={(evt) => { this.onUnitChange(evt.target.value) }}>
                  {unitOptions.map((option, index) => {
                    return <Option key={index} value={option.value}>{this.nls(option.value)}</Option>
                  })}
                </Select>
              </div>
            </div>
          </React.Fragment>
        }

      </div>
    )
  }
}
