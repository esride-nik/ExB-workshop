/**
  Licensing

  Copyright 2023 Esri Deutschland

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

/** @jsx jsx */ // <-- make sure to include the jsx pragma

import { React, type AllWidgetProps, FormattedMessage, css, jsx } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Button, Label, Loading, Radio } from 'jimu-ui'

import defaultMessages from './translations/default'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type SceneView from '@arcgis/core/views/SceneView'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import SceneModification from '@arcgis/core/layers/support/SceneModification.js'
import SceneModifications from '@arcgis/core/layers/support/SceneModifications.js'
import { convertSymbolColorToColorPickerValue } from 'jimu-ui/advanced/lib/map/components/symbol-selector/components/symbol-list/utils/symbol-utils'

const { useState, useRef, useEffect } = React

enum ModificationType {
  Clip = 'clip',
  Mask = 'mask',
  Replace = 'replace',
}

export default function ({ useMapWidgetIds }: AllWidgetProps<unknown>) {
  const apiWidgetContainer = useRef<HTMLDivElement>()

  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [view, setSceneView] = useState<SceneView>(null)
  const [sketchViewModel, setSketchViewModel] = useState<SketchViewModel>(null)
  const [sketchCompleteGraphic, setSketchCompleteGraphic] = useState(null)
  const [sketchUpdated, setSketchUpdated] = useState(false)
  const [graphicsLayer, setGraphicsLayer] = useState<GraphicsLayer>(null)
  const [modificationSymbol, setModificationSymbol] = useState(null)
  const [modificationType, setModificationType] = useState<ModificationType>(ModificationType.Clip)
  const [imLayer, setImLayer] = useState(null)
  const [layerView, setLayerView] = useState(null)
  const [hitTestResult, setHitTestResult] = useState(null)

  useEffect(() => {
    if (jimuMapView && apiWidgetContainer.current) {
      if (view) {
        initMeshMod()
      }
    }
  }, [apiWidgetContainer, jimuMapView, view])

  // update the attribute and modification on radio-button click
  useEffect(() => {
    if (sketchViewModel?.updateGraphics && (sketchViewModel?.updateGraphics as any).items?.length > 0) {
      const item = (sketchViewModel?.updateGraphics as any).items[0]
      try {
        updateModificationType(item)
        sketchViewModel.update(item, {
          enableZ: modificationType === ModificationType.Replace
        })
        updateIntegratedMesh()
      } catch (error) {
        console.log(error)
      }
    }
  }, [modificationType, modificationSymbol])

  useEffect(() => {
    if (sketchCompleteGraphic) {
      updateModificationType(sketchCompleteGraphic)
      updateIntegratedMesh()
      sketchViewModel.update(sketchCompleteGraphic, {
        enableZ: modificationType === ModificationType.Replace
      })
      setSketchCompleteGraphic(null)
    }
  }, [sketchCompleteGraphic])

  useEffect(() => {
    updateIntegratedMesh()
    setSketchUpdated(false)
  }, [sketchUpdated])

  /*
  * listen to click events to detect if the user would like to update a graphic
  * - with hittest get the selected graphic
  * - only if there is no create or update ongoing
  * - start the update process dependent on the modificationType -> "replace" with enableZ
  */
  useEffect(() => {
    if (hitTestResult) {
      if (!sketchViewModel.activeTool) {
        if (hitTestResult.results.length > 0) {
          const graphicToModify = hitTestResult.results[0].graphic
          sketchViewModel.update(graphicToModify, {
            enableZ: graphicToModify.attributes.modificationType === 'replace'
          })
        }
      }
    }
    setHitTestResult(null)
  }, [hitTestResult])

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
    } as unknown as __esri.PolygonSymbol3D

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

    /*
         * listen on sketch-create
         * - indicate on the button that the create operation is finished
         * - add the modificationType as attribute
         * - update the IntegratedMesh with the modifications
         * - start the update graphic and enable the Z only on type "replace"
         */
    sketchViewModel.on('create', (event) => {
      if (event.state === 'complete') {
        // no access to state in JSSDK event handlers
        setSketchCompleteGraphic(event.graphic)
      }
    })

    // listen to sketch-update and update the IntegratedMesh modifications // no access to state in JSSDK event handlers
    sketchViewModel.on('update', () => {
      setSketchUpdated(true)
    })

    // listen to sketch-delete and update the IntegratedMesh modifications // no access to state in JSSDK event handlers
    sketchViewModel.on('delete', () => {
      setSketchUpdated(true)
    })

    view.when(() => {
      // get the IntegratedMesh-Layer from the Map (or WebScene)
      const imLayer = view.map.layers.find((layer) => {
        return layer.type === 'integrated-mesh'
      })
      setImLayer(imLayer)

      view.whenLayerView(imLayer).then((lyrView) => {
        setLayerView(lyrView)
      })

      // listen to click events to detect if the user would like to update a graphic
      view.on('click', (event) => {
        view.hitTest(event, {
          include: [graphicsLayer],
          exclude: [view.map.ground]
        }).then(setHitTestResult)
      })

      // TODO: build UI for the tools
      // // add the ui
      // view.ui.add('tools', 'top-right')
      // document.getElementById('tools').style.display = 'block'

      // TODO: add loader
      // display the rendering status of the IntegratedMeshLayer
      // const calciteLoader = document.getElementById('calciteLoader')
      // view.whenLayerView(imLayer).then((lyrView) => {
      //   reactiveUtils.watch(
      //     () => lyrView.updating,
      //     (updating) => {
      //       if (updating) {
      //         calciteLoader.style.display = 'block'
      //       } else {
      //         calciteLoader.style.display = 'none'
      //       }
      //     }
      //   )
      // })
    })
  }

  const onCreateModificationClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
    (event.target as HTMLElement).classList.add('esri-button--secondary')
    sketchViewModel.create('polygon')
  }

  // update/add the modificationType as attribute information and change the symbolization accordingly
  const updateModificationType = (graphic) => {
    graphic.attributes = { modificationType: modificationType }
    const colors = {
      clip: [252, 173, 88],
      mask: [157, 219, 129],
      replace: [133, 148, 209]
    }
    graphic.symbol = modificationSymbol
    if (graphic?.symbol?.symbolLayers?.items?.length > 0) {
      graphic.symbol.symbolLayers.items[0].material.color = colors[modificationType]
    }
  }

  // update the IntegratedMesh with the modifications
  const updateIntegratedMesh = () => {
    if (graphicsLayer && graphicsLayer.graphics.length > 0) {
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
  }

  const onActiveViewChange = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
      if (jmv.view.type === '3d') {
        setSceneView(jmv.view)
      }
    }
  }

  const menuItem = css`
    display: block;
    margin:10px;
  `
  const radioClip = css`
    border-bottom: 3px solid rgb(252, 173, 88);
  `
  const radioMask = css`
    border-bottom: 3px solid rgb(157, 219, 129);
  `
  const radioReplace = css`
    border-bottom: 3px solid rgb(133, 148, 209);
  `

  const isConfigured = useMapWidgetIds && useMapWidgetIds.length === 1

  return <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            {!isConfigured && (
                <h3>
                    <FormattedMessage id="pleaseSelectMap" defaultMessage={defaultMessages.pleaseSelectAMap} />
                </h3>
            )}
            <div css={menuItem}>
                <Radio
                    aria-label="Clip"
                    checked={modificationType === ModificationType.Clip}
                    onChange={(event, checked) => {
                      setModificationType(ModificationType.Clip)
                    }}
                />
                <Label css={radioClip} for="modification-clip"><b>&nbsp;Clip </b></Label> - removes selected area
            </div>
            <div css={menuItem}>
                <Radio
                    aria-label="Mask"
                    checked={modificationType === ModificationType.Mask}
                    onChange={(event, checked) => {
                      setModificationType(ModificationType.Mask)
                    }}
                />
                <Label css={radioMask} for="modification-mask"><b>&nbsp;Mask </b></Label> - displays only selected area
            </div>
            <div css={menuItem}>
                <Radio
                    aria-label="Replace"
                    checked={modificationType === ModificationType.Replace}
                    onChange={(event, checked) => {
                      setModificationType(ModificationType.Replace)
                    }}
                />
                <Label css={radioReplace} for="modification-replace"><b>&nbsp;Replace </b></Label> - flattens selected area
            </div>
            <Button onClick={onCreateModificationClicked} size="default" id="createModification">
                Button
            </Button>

            {layerView?.updating && (
                <div
                    style={{
                      height: '80px',
                      position: 'relative',
                      width: '200px'
                    }}>
                    <Loading />
                </div>
            )}

            <div>{layerView?.updating ? 'Updating' : 'Not updating'}</div>

            <JimuMapViewComponent useMapWidgetId={useMapWidgetIds?.[0]} onActiveViewChange={onActiveViewChange} />

            <div ref={apiWidgetContainer} />
        </div>
}
