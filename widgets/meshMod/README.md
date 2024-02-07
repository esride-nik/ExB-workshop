# Mesh mod widget

This widgets brings the [integrated mesh modification](https://developers.arcgis.com/javascript/latest/sample-code/layers-integratedmeshlayer-modification/) to an Experience Builder custom widget.

## How to use the sample
Clone the [sample repo](https://github.com/esri/arcgis-experience-builder-sdk-resources) and copy this widget's folder (within `widgets`) to the `client/your-extensions/widgets` folder of your Experience Builder installation.

Configure an Experience Builder app with a Map widget and the Mesh Mod widget. Load a web scene with a 3D integrated mesh into the map widget. Connect the mesh mod widget to the map widget.

## How it works

In `manifest.json`, the dependencies are loaded using the `dependency` property.

```javascript
"dependency": "jimu-arcgis",
```

Then in `widget.tsx`, it imports the required modules to leverage the classes necessary from the ArcGIS Maps SDK for JavaScript.  

```javascript
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import SceneModification from '@arcgis/core/layers/support/SceneModification.js'
import SceneModifications from '@arcgis/core/layers/support/SceneModifications.js'
```
