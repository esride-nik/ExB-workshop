# Message Publisher
The functionality demonstrated here is part of the widget communication within ArcGIS Experience Builder.
This widget executes a trigger and is capable to connect it to message actions, implemented by other widgets.

### How to use the sample
Clone the sample repo into your Experience Builder Client root folder and restart your watcher.
Configure app with this widget, add triggers and connect actions.

![Message Publisher widget configuration demo](../../assets/messagePublisher_demo.gif)

### How it works
This widget executes a trigger and is capable to connect it to message actions implemented by other widgets. Components:
* register ``publishMessages`` in ``manifest.json``: https://developers.arcgis.com/experience-builder/api-reference/jimu-core/WidgetManifest/#publishMessages
* implement ``"DATA_RECORDS_SELECTION_CHANGE"`` message in ``widget.tsx``: 
  ```
    MessageManager.getInstance().publishMessage(
        new DataRecordsSelectionChangeMessage(widgetId, records)
    )
  ```
* implement ``"DATA_RECORD_SET_CHANGE"`` message in ``widget.tsx``: 
  ```
    MessageManager.getInstance().publishMessage(
        new DataRecordSetChangeMessage(widgetId, RecordSetChangeType.CreateUpdate, data)
    )
  ```

#### Author
Niklas Köhn, Esri Deutschland GmbH
