/**
  Licensing

  Copyright 2020 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, DataSourceComponent, DataSourceManager, DataSource, IMDataSourceInfo, FormattedMessage, css } from 'jimu-core';
import { BaseWidget, AllWidgetProps } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import defaultMessages from './translations/default';
import { IMConfig } from '../config';
import { ArcGISDataSourceTypes } from 'jimu-arcgis';


import { webMercatorToGeographic } from 'esri/geometry/support/webMercatorUtils';
import Point = require('esri/geometry/Point');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import Graphic = require('esri/Graphic');

const w3wApi = require("@what3words/api");

interface State {
    extent: __esri.Extent,
    center: __esri.Point,
    w3wAddress: any,
    query: any;
}

export default class Widget extends BaseWidget<AllWidgetProps<IMConfig>, State>{
    extentWatch: __esri.WatchHandle;
    centerWatch: __esri.WatchHandle;
    stationaryWatch: __esri.WatchHandle;
    w3wLayer: GraphicsLayer;

    state: State = {
        extent: null,
        center: null,
        w3wAddress: null,
        query: null
    }

    isConfigured = () => {
        return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1;
    }

    componentDidMount() {
        w3wApi.setOptions({ key: this.props.config.w3wApiKey });
        this.w3wLayer = new GraphicsLayer();
    }

    componentWillUnmount() {
        if (this.extentWatch) {
            this.extentWatch.remove();
            this.extentWatch = null;
        }
        if (this.centerWatch) {
            this.centerWatch.remove();
            this.centerWatch = null;
        }
        if (this.stationaryWatch) {
            this.stationaryWatch.remove();
            this.stationaryWatch = null;
        }
    }

    onActiveViewChange = (jimuMapView: JimuMapView) => {
        if (!jimuMapView) return;

        if (!this.stationaryWatch) {
            this.stationaryWatch = jimuMapView.view.watch('stationary', stationary => {
                if (stationary) {
                    let geoPoint = webMercatorToGeographic(this.state.center) as Point;
                    w3wApi.convertTo3wa({
                        lat: geoPoint.y,
                        lng: geoPoint.x
                    }).then((w3wAddress: any) =>
                        this.setState({
                            w3wAddress
                        }));

                    const w3wGraphic = new Graphic({
                        geometry: geoPoint,
                        symbol: {
                            type: "simple-marker",
                            style: "cross",
                            color: "red",
                            size: "20px",
                            outline: {
                                color: [255, 0, 0],
                                width: 3  // points
                            }
                        }
                    })
                    this.w3wLayer.graphics.add(w3wGraphic);
                    jimuMapView.view.map.add(this.w3wLayer);
                }
                else {
                    this.w3wLayer.graphics.removeAll();
                    jimuMapView.view.map.remove(this.w3wLayer);
                }
            });
        }
        if (!this.extentWatch) {
            this.extentWatch = jimuMapView.view.watch('extent', extent => {
                this.setState({
                    extent
                })
            });
        }
        if (!this.centerWatch) {
            this.centerWatch = jimuMapView.view.watch('center', center => {
                this.setState({
                    center
                });
            });
        }
    }


    // #region DataSource

    // query = () => {
    //   const fieldName = this.props.useDataSources[0].fields[0];
    //   const w = this.cityNameRef.current && this.cityNameRef.current.value ?
    //     `${fieldName} like '%${this.cityNameRef.current.value}%'` : '1=1'
    //   this.setState({
    //     query: {
    //       where: w,
    //       outFields: ['*'],
    //       resultRecordCount: 10
    //     }//,
    //     // refresh: true
    //   });
    // }

    dataRender = (ds: DataSource, info: IMDataSourceInfo, count: number) => {
        this.createOutputDs(ds);
        const fName = this.props.useDataSources[0].fields[0];
        return <>
            <div>
                {/* <input placeholder="Query value" ref={this.cityNameRef}/> */}
                <button onClick={this.query}>Query</button>
            </div>
            <div>Query state: {info.status}</div>
            <div>Count: {count}</div>

            {/* <div className="record-list" style={{width: '100%', marginTop: '20px', height: 'calc(100% - 80px)', overflow: 'auto'}}>
        {
          ds && ds.getStatus() === DataSourceStatus.Loaded ? ds.getRecords().map((r, i) => {
            return <div key={i}>{r.getData()[fName]}</div>
          }) : null
        }
      </div> */}
        </>
    }

    createOutputDs(useDs: DataSource) {
        console.log("createOutputDs", this.props);
        if (!this.props.outputDataSources) {
            return;
        }
        const outputDsId = this.props.outputDataSources[0];
        const dsManager = DataSourceManager.getInstance();
        if (dsManager.getDataSource(outputDsId)) {
            if (dsManager.getDataSource(outputDsId).dataSourceJson.originDataSources[0].dataSourceId !== useDs.id) {
                dsManager.destroyDataSource(outputDsId);
            }
        }
        dsManager.createDataSource(outputDsId).then(ods => {
            ods.setRecords(useDs.getRecords());
        });
    }

    // #endregion DataSource

    render() {
        const notThatBig = css`
        max-width: '100%';
        max-height: '100%';
        overflow: 'hidden';
      `;

        if (!this.isConfigured()) {
            return 'Select a map';
        }

        return <div className="shadow-lg p-3 m-4 bg-white" css={notThatBig}>
            <h3><FormattedMessage id="w3w" defaultMessage={defaultMessages.w3w} /></h3>

            {
                this.props.hasOwnProperty("useMapWidgetIds") && this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1
                && (
                    <JimuMapViewComponent useMapWidgetIds={this.props.useMapWidgetIds} onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>
                )
            }

            <table class="table table-striped">
                <tbody>
                    <tr>
                        <td scope="row">X</td>
                        <td>{this.state.center && this.state.center.x}</td>
                    </tr>
                    <tr>
                        <td scope="row">Y</td>
                        <td>{this.state.center && this.state.center.y}</td>
                    </tr>
                    <tr>
                        <th scope="row">{defaultMessages.center}</th>
                        <td>{this.state.w3wAddress && this.state.w3wAddress.words}</td>
                    </tr>
                </tbody>
            </table>

            {/* <DataSourceComponent useDataSource={this.props.useDataSources[0]} query={this.state.query} refresh={this.state.refresh} queryCount onQueryStart={() => this.setState({refresh: false})}> */}

            {/* <DataSourceComponent useDataSource={ }>
        {
          this.dataRender
        }
      </DataSourceComponent> */}
        </div >;
    }
}
