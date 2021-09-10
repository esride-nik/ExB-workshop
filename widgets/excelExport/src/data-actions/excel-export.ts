import { AbstractDataAction, DataSource, DataRecord, MutableStoreManager } from 'jimu-core';

export default class ExportJson extends AbstractDataAction {
    async isSupported(dataSource: DataSource, records: DataRecord[]): Promise<boolean> {
        return records?.length > 0;
    }

    async onExecute(dataSource: DataSource, records: DataRecord[]): Promise<boolean> {
        const features = records.map((r) => (r as any).feature?.attributes);
        console.log('action: excel-export onExecute', records, features);
        MutableStoreManager.getInstance().updateStateValue(this.widgetId, 'features', features);
        return true;
    }
}
