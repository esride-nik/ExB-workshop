import type Geometry from 'esri/geometry/Geometry'
import type SpatialReference from 'esri/geometry/SpatialReference'
import { type FeatureLayerQueryParams, type DataRecord, type QueriableDataSource, utils } from 'jimu-core'

/**
 * Queries the dataSource and fetch the records satisfying the query
 * @param ds - DataSource on which the query needs to be executed
 * @param query - FeatureLayerQueryParams
 * @returns Promise which resolves the records
 */
const getFeatures = async (ds: QueriableDataSource, query: FeatureLayerQueryParams): Promise<DataRecord[]> => {
  const promise = new Promise<DataRecord[]>((resolve) => {
    ds.query(query).then((result) => {
      if (result?.records) {
        resolve(result.records)
      } else {
        resolve([])
      }
    }, (err) => {
      console.log(err)
      resolve([])
    })
  })
  return promise
}

/**
 * Returns all the records satisfying the query
 * If the number of records are more than the maxRecord count then all the records are fetched by batch query and finally all records are return
 * @param ds Layers DataSource from which records needs to be fetched
 * @param queryGeometry Geometry of the buffer/ the incident location
 * @param returnGeometry Specify if geometry should returned while fetching the records
 * @param outSR Out Spatial Reference in which the returned geometries should be
 * @returns promise of datarecords
 */
export const getALLFeatures = async (ds, queryGeometry: Geometry, returnGeometry: boolean, outSR: SpatialReference): Promise<DataRecord[]> => {
  const promise = new Promise<DataRecord[]>((resolve) => {
    if (!ds) {
      resolve([])
      return
    }
    const query: FeatureLayerQueryParams = {}
    if (queryGeometry) {
      //when passing query as FeatureLayerQueryParams use toJson else invalid geometry is passed in the query request
      query.geometry = queryGeometry.toJSON()
      query.geometryType = queryGeometry ? utils.getGeometryType(queryGeometry) : undefined
    }
    //get all the fields as we need to show the feature info
    query.outFields = ['*']
    //get the return geometry only if asked
    query.returnGeometry = returnGeometry
    //get total number of features satisfying the query using queryCount method
    ds.queryCount(query).then((result) => {
      if (result?.count > 0) {
        const totalNumberOfRecords = result.count
        let maxRecordCount = ds.layerDefinition?.maxRecordCount ? ds.layerDefinition.maxRecordCount : 1000
        if (maxRecordCount <= 0) {
          maxRecordCount = 1000
        }
        const totalNumberOfPages = Math.floor(totalNumberOfRecords / maxRecordCount) + 1
        const queries: Array<Promise<DataRecord[]>> = []
        //query records pageWise, based on number of pages required for the total number of records
        for (let pageNo = 1; pageNo <= totalNumberOfPages; pageNo++) {
          const newQuery: any = {
            ...query,
            page: pageNo,
            pageSize: maxRecordCount
          }
          if (outSR) {
            newQuery.outSpatialReference = outSR.toJSON()
          }
          queries.push(getFeatures(
            ds,
            newQuery as FeatureLayerQueryParams
          ))
        }
        Promise.all(queries).then((queryResults) => {
          if (queryResults) {
            let allRecord: DataRecord[] = []
            for (let i = 0; i < queryResults.length; i++) {
              allRecord = allRecord.concat(queryResults[i])
            }
            resolve(allRecord)
          } else {
            resolve([])
          }
        }, (err) => {
          console.log(err)
          resolve([])
        })
      } else {
        resolve([])
      }
    }, (err) => {
      console.log(err)
      resolve([])
    })
  })
  return promise
}
