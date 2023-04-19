# Excel Export (Data Action only)

This widget exports selected records from an attribute table to an Excel file by providing a data action to be used on a widget that supports it, e.g. the table widget.

### How to use the sample
Clone the sample repo into your Experience Builder Client root folder and restart your watcher.

### How it works
The widget defines a <b>data action that needs to be enabled on a table widget</b>, configured in your app. Configure a map widget with the Select capability enabled, using a map that contains at least one FeatureLayer. Connect the table to a FeatureLayer in the map. Making a selection now will be reflected in your table worksheet. From there, use the data action to export the selection as an Excel file.

![How to use the Excel Export Widget](./assets/excelExportWidget_howto.png)

#### Author
Niklas Köhn, Esri Deutschland GmbH
