import * as Graphic from 'esri/Graphic';
import { AbstractDataAction, DataSource, DataRecord, MutableStoreManager } from 'jimu-core';

export default class ExportJson extends AbstractDataAction {
    async isSupported(dataSource: DataSource, records: DataRecord[]): Promise<boolean> {
        return records?.length > 0;
    }

    // TODO: Hidden columns are exported as well. Can we see which ones are hidden in the datasource?
    async onExecute(dataSource: DataSource, records: DataRecord[]): Promise<boolean> {
        if (records.length > 0) {
            const features = records.map((r) => (r as any).feature as Graphic);
            MutableStoreManager.getInstance().updateStateValue(this.widgetId, 'results', {
                features: features,
                label: records[0].dataSource?.belongToDataSource?.fetchedSchema?.label,
            });
            return true;
        }
        return false;
    }
}
