# what3words widget

This sample watches for changes on the map view and pushes the center point into the what3words REST API to display the w3w address in the widget.

## How to use the sample
Clone the sample repo into your Experience Builder Client root folder and restart your watcher. On the configuration pane, you'll need to enter your what3words API key. Don't worry, it's free! [So go ahead!](https://developer.what3words.com/public-api)

## How it works
A class property `onActiveViewChange` for the widget is assigned to the function `JimuMapView`.  This function uses
the `jimuMapView.view.watch()` method, which takes two imput parameters, the extent property and a callback function to
execute each time the extent property changes. The `setState` method is called to re-render the widget with the updated state.  

  ```javascript
  onActiveViewChange = (jimuMapView: JimuMapView) => {
    if(!this.extentWatch){
      this.extentWatch = jimuMapView.view.watch('extent', extent => { 
        this.setState({
          extent
        })
      });
    }
  }
```

## Steps
* Kartenmittelpunkt abgreifen + auf Widget-UI anzeigen => Widget-State aktualisieren per watch auf 'center' Property der MapView
* Event-Handler für w3w API auslösen, wenn Karte still steht => per watch auf 'stationary' Property der MapView
* Position ab w3w API schicken + 3-Wort-Ergebnis empfangen => in Event Handler
* Ergebnis auf Widget-UI anzeigen => Ergebnis in State eintragen
* Ergebnis in Kartenmitte anzeigen
    * mit Logo + Text = 2 Grafiken für Text + Logo
    * als Quadrat = Polygon-Grafik mit Umrisslinie
* Settings-Oberfläche darstellen => Setting Sections, Rows, Input-Komponenten
* config schreiben => Event-Handler zum Schreiben der Config in settings.tsx
