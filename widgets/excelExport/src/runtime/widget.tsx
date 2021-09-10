import { React, AllWidgetProps } from 'jimu-core';
import defaultMessages from './translations/default';

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>> {
    render() {
        const features = this.props?.mutableStateProps?.features;
        console.log('Excel Export render', features);
        return (
            <div>
                <h3>{defaultMessages._widgetLabel}</h3>
                {features ? JSON.stringify(features) : 'No records to display.'}
            </div>
        );
    }
}
