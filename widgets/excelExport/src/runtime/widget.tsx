import { React, AllWidgetProps } from 'jimu-core';
import defaultMessages from './translations/default';

import XLSX from 'xlsx';

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>> {
    render() {
        const features = this.props?.mutableStateProps?.features;
        console.log('Excel Export render', this.props?.mutableStateProps?.label, ' | ', features);

        // TODO: Automatic export writes 2 files most of the times.. maybe because 2 props are set and reder() es executed 2 times?
        if (features?.length > 0) {
            const label =
                this.props?.mutableStateProps?.label?.length > 0
                    ? this.props?.mutableStateProps?.label
                    : defaultMessages._widgetLabel;
            const filename = label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const sheetname = label.substr(0, 31);
            const ws = XLSX.utils.json_to_sheet(features, { sheet: sheetname });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetname);
            XLSX.writeFile(wb, `${filename}.xlsb`);
        }

        return (
            <div>
                <h3>{defaultMessages._widgetLabel}</h3>
                {features ? JSON.stringify(features) : 'No records to display.'}
            </div>
        );
    }
}
