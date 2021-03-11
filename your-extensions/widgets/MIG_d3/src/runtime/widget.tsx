/** @jsx jsx */
/**
  Licensing

  Copyright 2021 Esri

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
import { React, AllWidgetProps, jsx, css } from "jimu-core";
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import * as d3 from "./lib/d3/d3.min.js";

export default class Widget extends React.PureComponent<AllWidgetProps<any>, any> {
    // Create a React Ref - https://reactjs.org/docs/refs-and-the-dom.html
    private mainRef = React.createRef<HTMLDivElement>();

    constructor(props) {
        super(props);
        this.state = {
            migData: {
                labels: [
                    "16 Mbit/s",
                    "30 Mbit/s",
                    "50 Mbit/s",
                    "100 Mbit/s",
                    "200 Mbit/s",
                    "1000 Mbit/s"
                ],
                datasets: [
                    {
                        level: "Gemeinde",
                        id: "160655002048",
                        name: "Gemeinde Niederb\u00f6sa",
                        data: [
                            2,
                            2,
                            2,
                            0,
                            0,
                            0
                        ]
                    },
                    {
                        level: "Kreis",
                        id: "16065",
                        name: "Landkreis Kyffh\u00e4userkreis",
                        data: [
                            82,
                            80,
                            79,
                            66,
                            46,
                            8
                        ]
                    },
                    {
                        level: "Region",
                        id: "385",
                        name: "Region Nordth\u00fcringen",
                        data: [
                            92,
                            90,
                            89,
                            75,
                            50,
                            13
                        ]
                    }
                ]
            }
        };
    }

    isConfigured = () => {
        return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1;
    }

    componentDidMount() {
        const datasetGemeinde = this.state.migData.datasets.filter((dataset: any) => dataset.level == "Gemeinde")[0];
        const dataGemeinde = datasetGemeinde.data.map((val: number, i: number) => {
            return {
                label: this.state.migData.labels[i],
                value: val / 100
            };
        });
        this.mainRef.current.appendChild(this.getBarChart(dataGemeinde, 25, { top: 20, right: 0, bottom: 0, left: 60 }));

        const datasetKreis = this.state.migData.datasets.filter((dataset: any) => dataset.level == "Kreis")[0];
        const dataKreis = datasetKreis.data.map((val: number, i: number) => {
            return {
                label: this.state.migData.labels[i],
                value: val / 100
            };
        });
        this.mainRef.current.appendChild(this.getBarChart(dataKreis, 25, { top: 20, right: 0, bottom: 0, left: 60 }));

        const datasetRegion = this.state.migData.datasets.filter((dataset: any) => dataset.level == "Region")[0];
        const dataRegion = datasetRegion.data.map((val: number, i: number) => {
            return {
                label: this.state.migData.labels[i],
                value: val / 100
            };
        });
        this.mainRef.current.appendChild(this.getBarChart(dataRegion, 25, { top: 20, right: 0, bottom: 0, left: 60 }));

        // this.letsCrateABarChart(datasetGemeinde, data);

    }

    getBarChart(data, barHeight, margin) {
        const height = Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;
        const width = Math.ceil((data.length + 0.1) * 100) + margin.left + margin.right;

        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, width * 1.1, height]);

        const x = d3.scaleLinear()
            .domain([0, 1]) //d3.max(data, d => d.value)])
            .range([margin.left, width - margin.right])

        const y = d3.scaleBand()
            .domain(d3.range(data.length))
            .rangeRound([margin.top, height - margin.bottom])
            .padding(0.1);

        svg.append("g")
            .attr("fill", "steelblue")
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", x(0))
            .attr("y", (d, i) => y(i))
            .attr("width", d => x(d.value) - x(0))
            .attr("height", y.bandwidth());

        const precision = "%";
        const format = x.tickFormat(20, precision);
        svg.append("g")
            .attr("fill", "white")
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 12)
            .selectAll("text")
            .data(data)
            .join("text")
            .attr("x", d => x(d.value))
            .attr("y", (d, i) => y(i) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("dx", -4)
            .text(d => format(d.value))
            .call(text => text.filter(d => x(d.value) - x(0) < 20) // short bars
                .attr("dx", +4)
                .attr("fill", "black")
                .attr("text-anchor", "start"));

        const xAxis = g => g
            .attr("transform", `translate(0,${margin.top})`)
            .call(d3.axisTop(x).ticks(width / 80, "%"))
            .call(g => g.select(".domain").remove())
        svg.append("g")
            .call(xAxis);

        const yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickFormat(i => data[i].label).tickSizeOuter(0));
        svg.append("g")
            .call(yAxis);

        return svg.node();
    }

    onActiveViewChange = (jimuMapView: JimuMapView) => {
        if (!jimuMapView) return;
        console.log("onActiveViewChange", jimuMapView);
    }

    private letsCrateABarChart(datasetGemeinde: any, data: any) {
        const x = d3
            .scaleLinear()
            .domain([0, d3.max(datasetGemeinde.data)])
            .range([0, 100]);

        const div = d3.create("div");
        div.style("font", "10px sans-serif");
        div.style("text-align", "right");
        div.style("color", "white");

        // Define the initial (empty) selection for the bars.
        const bar = div.selectAll("div");

        // Bind this selection to the data (computing enter, update and exit).
        const barUpdate = bar.data(data);

        // Join the selection and the data, appending the entering bars.
        const barNew = barUpdate.join("div");

        // Apply some styles to the bars.
        barNew.style("background", "steelblue");
        barNew.style("padding", "3px");
        barNew.style("margin", "1px");

        // Set the width as a function of data.
        console.log("before STYLE", x, x(2));
        barNew.style("width", (d) => `${x(d.value)}px`);

        // Set the text of each bar as the data.
        barNew.text((d) => d.value);
        /**
         * END code from
         * https://observablehq.com/@d3/lets-make-a-bar-chart
         */


        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, 300, 300]);
        const margin = ({ top: 30, right: 0, bottom: 10, left: 30 });
        const barHeight = 25;
        const height = Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;
        const y = d3.scaleBand()
            .domain(d3.range(data.length))
            .rangeRound([margin.top, height - margin.bottom])
            .padding(0.1);
        const yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickFormat(i => data[i].name).tickSizeOuter(0));

        svg.append("g")
            .call(yAxis);

        // Please the results from the D3 operation into the DOM using
        // react references - https://reactjs.org/docs/refs-and-the-dom.html
        this.mainRef.current.appendChild(div.node());
        this.mainRef.current.appendChild(svg.node());
    }

    render() {
        const style = css`
      `;

        if (!this.isConfigured()) {
            return 'Select a map';
        }

        return (
            <div className="widget-d3 jimu-widget p-2" css={style}>
                <h3>{this.state.migData.datasets.filter((dataset: any) => dataset.level === "Gemeinde").map((dataset: any) => dataset.name)[0]}</h3>

                {
                    this.props.hasOwnProperty("useMapWidgetIds") && this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1
                    && (
                        <JimuMapViewComponent useMapWidgetIds={this.props.useMapWidgetIds} onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>
                    )
                }

                <div className="chart" ref={this.mainRef}></div>
            </div>
        );
    }
}
