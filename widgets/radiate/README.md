# Radiate widget

This widget places a point Graphic symbolizing something like a transmission tower.
## How to use the sample
Clone the sample repo into your Experience Builder Client root folder and restart your watcher. 

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
