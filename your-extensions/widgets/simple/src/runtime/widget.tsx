/** @jsx jsx */
import {React, AllWidgetProps,  jsx } from 'jimu-core';
import { IMConfig } from '../config';

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig>, any> {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="widget-demo jimu-widget m-2">
        <p>Simple Widget</p>
        <p>exampleConfigProperty: {this.props.config.exampleConfigProperty}</p>
      </div>
    );
  }
}
