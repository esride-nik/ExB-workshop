import { DataSourceManager, React, type AllWidgetProps } from 'jimu-core'
import { type FeatureLayerDataSource, JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import Graphic from 'esri/Graphic'

/**
 * This widget will show features from a configured feature layer
 */
export default function Widget (props: AllWidgetProps<{ Config }>) {
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
    const whereClause = decodeURI(dataFilter.split(':')[1])
    console.log('dataSourceId', dataSourceId, whereClause)
    console.log('whereClause', whereClause)

    // find datasource from DataSourceManager by ID from data_filter
    const dataSource = DataSourceManager.getInstance().getDataSource(dataSourceId)
    console.log('dataSource', dataSource)

    const featureLayerDataSource = dataSource as FeatureLayerDataSource

    const flQuery = featureLayerDataSource.layer.createQuery()
    flQuery.where = whereClause
    const flFilteredExtent = await featureLayerDataSource.layer.queryExtent(flQuery)
    console.log('flFilteredExtent', flFilteredExtent, flFilteredExtent.extent.xmax, flFilteredExtent.extent.ymax)

    jimuMapView.view.graphics.removeAll()
    const polygon = {
      type: 'polygon',
      rings: [
        [flFilteredExtent.extent.xmax, flFilteredExtent.extent.ymax],
        [flFilteredExtent.extent.xmax, flFilteredExtent.extent.ymin],
        [flFilteredExtent.extent.xmin, flFilteredExtent.extent.ymin],
        [flFilteredExtent.extent.xmin, flFilteredExtent.extent.ymax],
        [flFilteredExtent.extent.xmax, flFilteredExtent.extent.ymax]
      ],
      spatialReference: flFilteredExtent.extent.spatialReference
    } as unknown as __esri.Polygon
    const fillSymbol = {
      type: 'simple-fill',
      color: [227, 139, 79, 0.8],
      outline: {
        color: [255, 255, 255],
        width: 2
      }
    }
    const polygonGraphic = new Graphic({
      geometry: polygon,
      symbol: fillSymbol
    })
    jimuMapView.view.graphics.add(polygonGraphic)

    jimuMapView.view.goTo({ target: flFilteredExtent.extent })
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
