/**
  Licensing

  Copyright 2022 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, type AllWidgetProps, FormattedMessage } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Button } from 'jimu-ui'

import defaultMessages from './translations/default'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type SceneView from '@arcgis/core/views/SceneView'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import reactiveUtils from '@arcgis/core/core/reactiveUtils'
import SceneModification from '@arcgis/core/layers/support/SceneModification.js'
import SceneModifications from '@arcgis/core/layers/support/SceneModifications.js'

const { useState, useRef, useEffect } = React

export default function ({
  useMapWidgetIds
}: AllWidgetProps<unknown>) {
  const apiWidgetContainer = useRef<HTMLDivElement>()

  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [view, setSceneView] = useState<SceneView>(null)
  const [sketchViewModel, setSketchViewModel] = useState<SketchViewModel>(null)
  const [graphicsLayer, setGraphicsLayer] = useState<GraphicsLayer>(null)
  const [modificationSymbol, setModificationSymbol] = useState(null)
  const [modificationType, setModificationType] = useState(null)
  const [imLayer, setImLayer] = useState(null)

  useEffect(() => {
    if (jimuMapView && apiWidgetContainer.current) {
      if (view) {
        initMeshMod()
      }
    }
  }, [apiWidgetContainer, jimuMapView, view])

  const initMeshMod = () => {
    // Create graphicsLayer to store modifications and add to the map
    const graphicsLayer = new GraphicsLayer()
    view.map.add(graphicsLayer)
    setGraphicsLayer(graphicsLayer)

    // polygon symbol used for sketching the modifications
    const sketchSymbol = {
      type: 'polygon-3d', // autocasts as new PolygonSymbol3D()
      symbolLayers: [
        {
          type: 'fill', // autocasts as new FillSymbol3DLayer()
          material: {
            color: [255, 255, 255, 0.8]
          },
          outline: {
            size: '3px',
            color: [82, 82, 122, 1]
          }
        }
      ]
    }

    // polygon symbol to symbolize the modifications
    const modificationSymbol = {
      type: 'polygon-3d', // autocasts as new PolygonSymbol3D()
      symbolLayers: [
        {
          type: 'line', // autocasts as new LineSymbol3DLayer()
          material: {
            color: [0, 0, 0, 0]
          },
          size: '7px'
        }
      ]
    }
    setModificationSymbol(modificationSymbol)

    /*
     * define the SketchViewModel and pass in the symbol for sketching polygon
     * set updateOnGraphicClick to false to be able to start the update process
     * depending on the defined modification.
     * clip, mask --> z-value is not used
     * replace --> z-value is used to define the flatten height
     */
    const sketchViewModel = new SketchViewModel({
      layer: graphicsLayer,
      view: view,
      polygonSymbol: sketchSymbol,
      updateOnGraphicClick: false,
      defaultCreateOptions: {
        mode: 'click'
      }
    })
    setSketchViewModel(sketchViewModel)

    // listen to changes on the modificationType
    const modificationType = document.getElementsByName('modificationType')
    for (let i = 0, length = modificationType.length; i < length; i++) {
      modificationType[i].onclick = modificationTypeChanged
    }
    setModificationType(modificationType)

    /*
     * listen on sketch-create
     * - indicate on the button that the create operation is finished
     * - add the modificationType as attribute
     * - update the IntegratedMesh with the modifications
     * - start the update graphic and enable the Z only on type "replace"
     */
    sketchViewModel.on('create', (event) => {
      if (event.state === 'complete') {
        createModificationButton.classList.remove('esri-button--secondary')
        updateModificationType(event.graphic, getSelectedModificationType())
        updateIntegratedMesh()
        sketchViewModel.update(event.graphic, {
          enableZ: getSelectedModificationType() === 'replace'
        })
      }
    })

    /*
     * listen on sketch-update
     * - set the radio-button-modification-type accordingly to the attribute
     * - when the graphic update process is completed update the IntegratedMesh modifications
     */
    sketchViewModel.on('update', (event) => {
      if (event.state === 'start') {
        document.getElementById('modification-' + event.graphics[0].attributes.modificationType).checked = true
      }
      updateIntegratedMesh()
    })

    // listen to sketch-delete and update the IntegratedMesh modifications
    sketchViewModel.on('delete', updateIntegratedMesh)

    view.when(() => {
      // get the IntegratedMesh-Layer from the Map (or WebScene)
      const imLayer = view.map.layers.find((layer) => {
        return layer.type === 'integrated-mesh'
      })
      setImLayer(imLayer)

      // listen to click events to detect if the user would like to update a graphic
      view.on('click', (event) => {
        view
          .hitTest(event, {
            include: [graphicsLayer],
            exclude: [view.map.ground]
          })
          .then(processSelectedGraphic)
      })

      // add the ui
      view.ui.add('tools', 'top-right')
      document.getElementById('tools').style.display = 'block'

      // display the rendering status of the IntegratedMeshLayer
      const calciteLoader = document.getElementById('calciteLoader')
      view.whenLayerView(imLayer).then((lyrView) => {
        reactiveUtils.watch(
          () => lyrView.updating,
          (updating) => {
            if (updating) {
              calciteLoader.style.display = 'block'
            } else {
              calciteLoader.style.display = 'none'
            }
          }
        )
      })
    })
  }

  const onCreateModificationClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
    (event.target as HTMLElement).classList.add('esri-button--secondary')
    sketchViewModel.create('polygon')
  }

  /*
     * listen to click events to detect if the user would like to update a graphic
     * - with hittest get the selected graphic
     * - only if there is no create or update ongoing
     * - start the update process dependent on the modificationType -> "replace" with enableZ
     */
  const processSelectedGraphic = (hitTestResult) => {
    if (!sketchViewModel.activeTool) {
      if (hitTestResult.results.length > 0) {
        const graphicToModify = hitTestResult.results[0].graphic
        sketchViewModel.update(graphicToModify, {
          enableZ: graphicToModify.attributes.modificationType === 'replace'
        })
      }
    }
  }

  // Get the selected modificationType from radio-button-ui
  const getSelectedModificationType = () => {
    for (let i = 0; i < modificationType.length; i++) {
      if (modificationType[i].checked) {
        return modificationType[i].value
      }
    }
  }

  // update the attribute and modification on radio-button click
  const modificationTypeChanged = () => {
    const item = sketchViewModel.updateGraphics.items[0]
    if (item) {
      try {
        updateModificationType(item, this.value)
        sketchViewModel.update(item, {
          enableZ: this.value === 'replace'
        })
        updateIntegratedMesh()
      } catch (error) {
        console.log(error)
      }
    }
  }

  // update/add the modificationType as attribute information and change the symbolization accordingly
  const updateModificationType = (graphic, modificationType) => {
    graphic.attributes = { modificationType: modificationType }
    const colors = {
      clip: [252, 173, 88],
      mask: [157, 219, 129],
      replace: [133, 148, 209]
    }
    modificationSymbol.symbolLayers[0].material.color = colors[modificationType]
    graphic.symbol = modificationSymbol
  }

  // update the IntegratedMesh with the modifications
  const updateIntegratedMesh = () => {
    // create the modification collection with the geometry and attribute from the graphicsLayer
    const modifications = new SceneModifications(
      graphicsLayer.graphics.toArray().map((graphic) => {
        return new SceneModification({
          geometry: graphic.geometry,
          type: graphic.attributes.modificationType
        })
      })
    )

    // add the modifications to the IntegratedMesh
    imLayer.modifications = modifications
  }

  const onActiveViewChange = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
      if (jmv.view.type === '3d') {
        setSceneView(jmv.view)
      }
    }
  }

  const isConfigured = useMapWidgetIds && useMapWidgetIds.length === 1

  return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    {!isConfigured && <h3><FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} /></h3>}
    <Button
      onClick={onCreateModificationClicked}
      size="default"
      id='createModification'
    >
      Button
    </Button>

    <JimuMapViewComponent
      useMapWidgetId={useMapWidgetIds?.[0]}
      onActiveViewChange={onActiveViewChange}
    />

    <div ref={apiWidgetContainer} />
  </div>
}
