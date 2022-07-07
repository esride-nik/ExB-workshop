# what3words widget
Niklas Köhn, Esri Deutschland GmbH, 2022

This widget uses the what3words REST API to find the w3w address of the click point resp. the center point of the map.

## How to use the sample
Clone the sample repo into your Experience Builder Client root folder and restart your watcher. On the configuration pane, you'll need to enter your what3words API key. Don't worry, it's free! [So go ahead!](https://developer.what3words.com/public-api)

## How it works
Connecting widget to configured map widget in the event handler `onActiveViewChange` follows the usual Experience Builder developement pattern for connecting datasources. The what3words widget also creates the necessary layer objects, event listeners and property watchers. Depending on the configuration, the widget reacts to map clicks (`handleMapClick`) or takes action when the map stops moving (`stationaryWatchHandler`). 

While map graphics are drawn manually by the widget code, the widget itself is a React component that redraws autoamtically after the `setState` method has run and updated the observable data in the widget state.