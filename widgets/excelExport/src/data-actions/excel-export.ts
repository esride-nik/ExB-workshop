import { AbstractDataAction, DataSource, DataRecord, MutableStoreManager } from 'jimu-core';

export default class ExportJson extends AbstractDataAction {
    async isSupported(dataSource: DataSource, records: DataRecord[]): Promise<boolean> {
        return records?.length > 0;
    }

    // TODO: Hidden columns are exported as well. Can we see which ones are hidden in the datasource?
    async onExecute(dataSource: DataSource, records: DataRecord[]): Promise<boolean> {
        if (records.length > 0) {
            const features = records.map((r) => (r as any).feature?.attributes);
            console.log('action: excel-export onExecute', records, features);
            MutableStoreManager.getInstance().updateStateValue(this.widgetId, 'features', features);
            MutableStoreManager.getInstance().updateStateValue(
                this.widgetId,
                'label',
                records[0].dataSource?.belongToDataSource?.fetchedSchema?.label
            );
            return true;
        }
        return false;
    }
}
