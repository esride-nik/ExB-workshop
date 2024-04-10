import { DataSourceManager, React, type AllWidgetProps } from 'jimu-core'
import { FeatureLayerDataSource, JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import Graphic from 'esri/Graphic'
import { type Point } from 'esri/geometry'

const { useState, useEffect } = React

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget (props: AllWidgetProps<{ Config }>) {
  const [dataSourceId, setDataSourceId] = useState<string>(undefined)

  useEffect(() => {
    // queryFunc();
  }, [])

  let jimuMapView: JimuMapView

  const isConfigured = () => {
    return props.useMapWidgetIds && props.useMapWidgetIds.length === 1
  }

  const activeViewChangeHandler = async (jmv: JimuMapView) => {
    jimuMapView = jmv

    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    console.log('urlParams', urlParams.get('data_filter'))
    const dataFilter = urlParams.get('data_filter')
    const dataSourceId = dataFilter.split(':')[0]
    const whereClause = dataFilter.split(':')[1]
    console.log('dataSourceId', dataSourceId, whereClause)
    console.log('whereClause', whereClause)

    // find datasource from DataSourceManager by ID from data_filter
    const dataSource = DataSourceManager.getInstance().getDataSource(dataSourceId)
    console.log('dataSource', dataSource)

    const featureLayerDataSource = dataSource as FeatureLayerDataSource

    const flQuery = featureLayerDataSource.layer.createQuery()
    flQuery.where = whereClause
    const flFilteredExtent = await featureLayerDataSource.layer.queryExtent(flQuery)
    console.log('flFilteredExtent', flFilteredExtent)

    jimuMapView.view.goTo(flFilteredExtent)
  }

  if (!isConfigured()) {
    return 'Select a map'
  }
  return (
        <div
            className="widget-map-click"
            style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
            {{}.hasOwnProperty.call(props, 'useMapWidgetIds') && props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
                <JimuMapViewComponent
                    useMapWidgetId={props.useMapWidgetIds?.[0]}
                    onActiveViewChange={activeViewChangeHandler}
                />
            )}
        </div>
  )
}
