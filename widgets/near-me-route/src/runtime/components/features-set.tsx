/** @jsx jsx */ // <-- make sure to include the jsx pragma
import { React, jsx, type IntlShape, type IMThemeVariables, type DataRecord } from 'jimu-core'
import { Row, Button, Label } from 'jimu-ui'
import defaultMessages from '../translations/default'
import { type JimuMapView } from 'jimu-arcgis'
import { type IMConfig } from '../../config'
import { Collapse } from 'reactstrap/lib'
import { RightOutlined } from 'jimu-icons/outlined/directional/right'
import { getFeaturesSetStyles } from '../lib/style'
import { DownOutlined } from 'jimu-icons/outlined/directional/down'
import type GraphicsLayer from 'esri/layers/GraphicsLayer'
import Feature from 'esri/widgets/Feature'
import { createSymbol, getDisplayLabel } from '../../common/utils'

interface Props {
  intl: IntlShape
  widgetId: string
  index: string
  theme: IMThemeVariables
  config: IMConfig
  popupTitleField: string
  jimuMapView: JimuMapView
  selectedRecord: DataRecord
  selectedFeatureLength: number
  ifOneAnalysisResult: boolean
  distanceUnit: string
  isExpanded: boolean
  expandOnOpen: boolean
  approximateDistanceUI?: boolean
  showDistFromInputLocation: boolean
  isGroup: boolean
  graphicLayer?: GraphicsLayer
  children?: React.ReactNode
  displayMapSymbol: boolean
  selectRecord?: (index: string, popupContainer: HTMLDivElement, record: DataRecord) => void
  clearRecord?: (index: string) => void
}
interface State {
  isFeatureLayerOpen: boolean
  isIconRight: boolean
  title: string
  isTitleLoaded: boolean
  featureItem: JSX.Element
}

export default class FeaturesSet extends React.PureComponent<Props, State> {
  public popUpContent: React.RefObject<HTMLDivElement>
  public readonly symbolRef: React.RefObject<HTMLDivElement>
  constructor (props) {
    super(props)
    this.popUpContent = React.createRef()
    this.symbolRef = React.createRef()

    if (this.props.config) {
      this.state = {
        isFeatureLayerOpen: this.props.isExpanded,
        isIconRight: !this.props.isExpanded,
        title: '',
        isTitleLoaded: false,
        featureItem: null
      }
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

  componentDidMount = () => {
    //for closest and proximity with expanded list
    //if only one analysis result is returned with only one feature then zoom to feature automatically
    if (!this.props.popupTitleField || (this.props.popupTitleField && this.props.isExpanded)) {
      this.createFeatureItem(this.props.ifOneAnalysisResult && this.props.expandOnOpen, this.props.displayMapSymbol)
    } else if (this.props.ifOneAnalysisResult && this.props.popupTitleField && this.props.expandOnOpen) {
      this.onToggleSelectedLayer()
    }
    if (this.props.displayMapSymbol) {
      createSymbol(this.props.selectedRecord, this.symbolRef)
    }
  }

  componentDidUpdate = (prevProps) => {
    // also create symbol if layer is changed
    if (prevProps.selectedRecord !== this.props.selectedRecord && this.props.displayMapSymbol) {
      createSymbol(this.props.selectedRecord, this.symbolRef)
    }
  }

  /**
   * Create the feature module using feature record
   */
  createFeature = () => {
    const featureRecord = this.props.selectedRecord as any
    if (featureRecord?.feature) {
      const container = document && document.createElement('div')
      container.className = 'jimu-widget bg-transparent pointer'
      this.popUpContent.current.appendChild(container)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const featureWidget = new Feature({
        container: container,
        graphic: featureRecord.feature,
        map: this.props.jimuMapView.view.map,
        spatialReference: this.props.jimuMapView.view.spatialReference,
        defaultPopupTemplateEnabled: !featureRecord.feature.layer.popupTemplate
      })
    }
  }

  /**
   * Get the popup title for aria-label
   * @returns string popup title for aria-label
   */
  displayPopupTitle = (): string => {
    let popupTitle = ''
    if (this.props.selectedRecord) {
      popupTitle = this.props.selectedRecord.getFormattedFieldValue(this.props.popupTitleField, this.props.intl)
    }
    return getDisplayLabel(popupTitle, this.nls('noValueForDisplayField'))
  }

  /**
   * On toggle the layer the feature details section will show or collapse
   */
  onToggleSelectedLayer = () => {
    if (!this.props.isExpanded) {
      this.setState({
        isFeatureLayerOpen: !this.state.isFeatureLayerOpen,
        isIconRight: !this.state.isIconRight
      }, () => {
        if (this.state.isFeatureLayerOpen && !this.state.featureItem) {
          this.createFeatureItem(true)
        } else {
          this.onFeatureDetailsClick()
        }
      })
    }
  }

  /**
   * On feature details click highlight the feature or flash it on the map
   */
  onFeatureDetailsClick = () => {
    const featureRecord = this.props.selectedRecord as any
    if (featureRecord) {
      if (featureRecord.getFeature().geometry) {
        this.selectOrClearRecord()
      } else {
        featureRecord._dataSource.queryById(this.props.selectedRecord.getId()).then((fetchedRecord) => {
          this.selectOrClearRecord(fetchedRecord)
        })
      }
    }
  }

  /**
   * Select or clear the record based on if it is already selected and if details are open
   */
  selectOrClearRecord = (fetchedRecord?: DataRecord) => {
    if (!this.popUpContent?.current?.classList.contains('record-selected') && this.state.isFeatureLayerOpen) {
      this.props.selectRecord(this.props.index, this.popUpContent.current, fetchedRecord ?? this.props.selectedRecord)
    } else {
      this.props.clearRecord(this.props.index)
    }
  }

  /**
   * On expand list create each feature item with its approximate distance and feature details
   * @param boolean flag to call featuresDetails click once the item is created
   */
  createFeatureItem = (callFeatureDetailsClick: boolean, displayMapSymbol?: boolean) => {
    const featureRecord = this.props.selectedRecord as any
    let individualFeatureItem: JSX.Element = null
    const formattedDistance = this.props.intl.formatNumber(featureRecord.feature.distance, { maximumFractionDigits: 2 })
    //Show the Display field value instead of the Approximate distance string in case expand feature details
    const title = this.props.popupTitleField && this.props.isExpanded ? this.displayPopupTitle() : this.nls('approximateDistance')
    const displayFeatureTitle = this.props.approximateDistanceUI && (this.props.showDistFromInputLocation || this.props.popupTitleField)
    individualFeatureItem = (
      <div>
        {/* show approximateDistanceUI - closet, proximity with expanded list */}
        {(displayMapSymbol || (displayFeatureTitle && this.props.isExpanded)) &&
          <div className='approximateDist-container border-bottom'>
            {displayMapSymbol && <div className='feature-title-map-symbol' ref={this.symbolRef}></div>}
            {displayFeatureTitle &&
              <div className='approximateDist-label'>
                <Label className='mb-0'>
                  {title}
                </Label>
              </div>}
            {this.props.showDistFromInputLocation && this.props.approximateDistanceUI &&
              <Label tabIndex={-1} className='approximateDist mb-0 pt-0 font-weight-bold'>
                <div tabIndex={0} aria-label={this.getAriaLabelString(this.nls('approximateDistance'), formattedDistance, this.props.distanceUnit)}>
                  {this.getLabelForDistUnit(formattedDistance, this.props.distanceUnit)}
                </div>
              </Label>
            }
          </div>
        }
        <div tabIndex={0} className='mt-2 pb-2 pointer record-container' ref={this.popUpContent} onClick={this.onFeatureDetailsClick.bind(this)} />
      </div>
    )
    this.setState({
      featureItem: individualFeatureItem
    }, () => {
      this.createFeature()
      //when creating the featureItem first time and if callFeatureDetailsClick is true call onFeatureDetailsClick after creation of the item
      if (callFeatureDetailsClick) {
        this.onFeatureDetailsClick()
      }
    })
  }

  /**
   * Get the string for aria label
   * @param approximateDistanceLabel approximateDistance Label
   * @param formattedDistance  formatted Distance
   * @param distanceUnit  distance Unit
   * @returns aria label string
   */
  getAriaLabelString = (approximateDistanceLabel: string, formattedDistance: string, distanceUnit: string): string => {
    let getAriaLabel = ''
    getAriaLabel = this.props.intl.formatMessage({
      id: 'ariaLabelString', defaultMessage: defaultMessages.ariaLabelString
    }, { label: approximateDistanceLabel, formattedDist: formattedDistance, distUnit: distanceUnit })
    return getAriaLabel
  }

  /**
   * Get label for distance and unit
   * @param formattedDistance formatted Distance
   * @param distanceUnit distance Unit
   * @returns distance unit label
   */
  getLabelForDistUnit = (formattedDistance: string, distanceUnit: string): string => {
    let getLabelForDistanceUnit = ''
    getLabelForDistanceUnit = this.props.intl.formatMessage({
      id: 'distanceUnitLabel', defaultMessage: defaultMessages.distanceUnitLabel
    }, { distanceLabel: formattedDistance, unitLabel: distanceUnit })
    return getLabelForDistanceUnit
  }

  render () {
    const featureRecord = this.props.selectedRecord as any
    const displayPopupTitle = this.displayPopupTitle()
    let featureTitleAriaLabel = displayPopupTitle
    let formattedDistance: string
    if (featureRecord.feature.distance !== undefined) {
      formattedDistance = this.props.intl.formatNumber(featureRecord.feature.distance, { maximumFractionDigits: 2 })
      featureTitleAriaLabel = this.getAriaLabelString(featureTitleAriaLabel, formattedDistance, this.props.distanceUnit)
    }
    const featuresSetStyles = getFeaturesSetStyles(this.props.theme)
    return (
      <div className='feature-container border-top w-100 m-0' css={featuresSetStyles}>
        {/* proximity without expanded list */}
        {this.props.selectedFeatureLength > 0 && this.props.popupTitleField && !this.props.isExpanded &&
          <React.Fragment>
            <Row flow='wrap'>
              <div className={!this.props.approximateDistanceUI && this.state.isFeatureLayerOpen ? 'feature-title-container border-bottom' : 'feature-title-container'} onClick={this.onToggleSelectedLayer.bind(this)}
                tabIndex={0} role={'button'} aria-label={featureTitleAriaLabel} onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (!this.props.isExpanded) {
                      this.onToggleSelectedLayer()
                    }
                  }
                }}>
                <div className='d-inline-flex'>
                  {this.props.displayMapSymbol && <div className='feature-title-map-symbol' ref={this.symbolRef}></div>}
                  <div className='feature-title'>
                    <Label className={this.props.isExpanded ? 'label-title expand-list-label-title' : 'label-title'}>
                      {displayPopupTitle}
                    </Label>
                  </div>
                </div>
                <div className='d-inline-flex'>
                  {(featureRecord.feature.distance !== undefined && this.props.showDistFromInputLocation) &&
                    <Label className='approximateDist pr-1'>
                      {this.getLabelForDistUnit(formattedDistance, this.props.distanceUnit)}
                    </Label>
                  }
                  <Button tabIndex={-1} type='tertiary' icon role={'button'} aria-expanded={this.state.isFeatureLayerOpen} className={'actionButton p-0'}>
                    { this.state.isIconRight && <RightOutlined size={'m'} autoFlip /> }
                    { !this.state.isIconRight && <DownOutlined size={'m'} /> }
                  </Button>
                </div>
              </div>
            </Row>

            <Collapse isOpen={this.state.isFeatureLayerOpen} className='w-100'>
              {this.state.featureItem}
            </Collapse>
          </React.Fragment>
        }

        {/* proximity with expanded list */}
        {this.props.popupTitleField && this.props.isExpanded &&
          this.state.featureItem
        }

        {/* Closest */}
        {this.props.selectedFeatureLength === 1 && !this.props.popupTitleField &&
          this.state.featureItem
        }
      </div>
    )
  }
}
