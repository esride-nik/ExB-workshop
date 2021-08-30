# what3words widget

This sample watches for changes on the map view and pushes the center point into the what3words REST API to display the w3w address in the widget.

## How to use the sample
Clone the sample repo and paste the "w3w" folder in the Experience Builder client/your-extensions/widget. Install the npm package "@what3words/api".

Clone the sample repo and paste the folder contents in the client/your-extensions/widgets
folder of your Experience Builder installation. 

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
