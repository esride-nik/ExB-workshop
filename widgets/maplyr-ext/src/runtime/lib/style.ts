import { type IMThemeVariables, css, type SerializedStyles } from 'jimu-core'
import { type IMConfig } from '../../config'

export function getStyle (theme: IMThemeVariables, widgetConfig: IMConfig): SerializedStyles {
  let displayItemIcon
  let itemLabelOutLine
  if (widgetConfig.setVisibility && widgetConfig.useMapWidget) {
    displayItemIcon = 'block'
    itemLabelOutLine = ''
  } else {
    displayItemIcon = 'none'
    itemLabelOutLine = 'unset'
  }

  const root = theme.surfaces[1].bg
  const item = theme.surfaces[1].bg
  const icon = require('jimu-icons/svg/filled/application/check.svg')

  const tickBoxesStyle = widgetConfig?.setVisibility && widgetConfig?.useTickBoxes
    ? `
    .esri-icon-non-visible:before {
      display: block;
      content: '';
      height: 16px;
      width: 16px;
      margin-bottom: -1px;
      background-color: ${root};
      border: 1px solid ${theme.colors.palette.dark[600]};
      border-radius: 3px;
    }
    .esri-icon-visible {
      width: 16px;
      height: 16px;
      margin-bottom: -1px;
      border-radius: 3px;
      background-color: ${theme.colors.primary};
    }
    .esri-icon-visible:before {
      display: block;
      content: '';
      height: 10px;
      width: 10px;
      margin: 3px;
      -webkit-mask-image: url('data:image/svg+xml;base64,${window.btoa(icon)}');
      background-color: ${root};
      -webkit-mask-position: center center;
    }
    `
    : ''

  return css`
    overflow: auto;
    .widget-layerlist {
      width: 100%;
      height: 100%;
      min-height: 32px;
      /*background-color: ${theme.arcgis.widgets.layerlist.root.bg};*/
      background-color: ${root};

      .data-action-list-loading {
        height: 32px;
        border: 1px solid rgba(0,0,0,0);
        border-top: 2px solid ${theme.colors.palette.secondary[300]};
        padding-left: 16px;

        display: flex;
        align-items: center;
        @keyframes ball-fall {
          0%{
            opacity: 0;
            transform: translateY(-145%);
          }
          10%{
            opacity: .5;
          }
          20%{
            opacity: 1;
            transform: translateY(0);
          }
          80%{
            opacity: 1;
            transform: translateY(0);
          }
          90%{
            opacity: .5;
          }
          100%{
            opacity: 0;
            transform:translateY(145%);
          }
        }
        &:before,
        &:after,
        .dot-loading {
          width: 0.25rem;
          height: 0.25rem;
          border-radius: 0.25rem;
          box-sizing: border-box;
          opacity:0;
          animation: ball-fall 1s ease-in-out infinite;
        }
        &:before,
        &:after {
          content: '';
          display: inline-block;
        }
        &:before {
          left: -0.375rem;
          animation-delay: -200ms;
        }
        .dot-loading {
          display: inline-block;
          margin: 0 0.125rem;
          animation-delay: -100ms;
        }
        &:after {
          left: 0.375rem;
          animation-delay: 0ms;
        }
        .dot-loading, &:before, &:after {
          background: ${theme.colors.palette.secondary[500]};
        }
      }

      .esri-layer-list__item-label:focus {
        outline: ${itemLabelOutLine};
      }

      .esri-layer-list__item-toggle {
        display: ${displayItemIcon};
      }

      .esri-layer-list {
        background-color: ${root};
      }

      .esri-layer-list__list {
        padding: 0px 2px;
      }

      .esri-layer-list__item {
        background-color: ${item};
        .data-action-list-wrapper {
          padding: 0;

          .jimu-dropdown, .jimu-dropdown-item {
            font-size: 12px;
            color: ${theme?.arcgis?.widgets?.layerlist?.icon?.default?.color};
          }

          .jimu-dropdown-item {
            padding: 6px 15px;
            border: 1px solid rgba(0,0,0,0);
            border-top: 2px solid ${theme?.border?.color};
          }

          .dropdown-item:hover {
            .jimu-icon-auto-color {
              color: ${theme.colors.primary} !important;
            }
            background: transparent;
            color: ${theme.colors.primary} !important;
          }
        }
        .ml-2 {
          margin-left: 5px !important;
        }
      }

      ${tickBoxesStyle}

      .esri-layer-list__item-action {
        outline-offset: -2px;
      }

      .invalid-ds-message {
        font-size: 12px;
        padding: 6px 15px;
        border: 1px solid rgba(0,0,0,0);
        border-top: 2px solid #d5d5d5;
        color: ${theme.colors.palette.dark[600]};
      }
    }
  `
}
