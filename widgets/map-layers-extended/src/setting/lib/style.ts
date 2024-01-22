import { type IMThemeVariables, css, type SerializedStyles, polished } from 'jimu-core'

export function getStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
    .widget-setting-layerlist{
      .source-descript {
        color: ${theme.colors.palette.dark[600]};
      }

      .webmap-thumbnail{
        cursor: auto;
        width: 100%;
        height: 120px;
        overflow: hidden;
        padding: 1px;
        border: ${polished.rem(2)} solid initial;
        img, div{
          width: 100%;
          height: 100%;
        }
      }

      .warning-tooltip{
        .jimu-icon-component {
          color: ${theme.colors.palette.warning[600]}
        }
      }

      .customize-layer-list{
        margin-top: ${polished.rem(12)};
      }

      .empty-customize-layer-list{
        margin-top: 0;
      }

      .layerlist-tools{
        .layerlist-tools-item{
          display: flex;
          /* justify-content: space-between; */
          margin-bottom: 8px;
          align-items: center;
        }
      }

      .map-selector-section .component-map-selector .form-control{
        width: 100%;
      }

      .data-selector-section, .map-selector-section{
        padding-top: 10px;
      }

      .check-box-label {
        color: ${theme.colors.palette.dark[600]};
        font-weight: 400;
        line-height: ${polished.rem(18)};
      }

      .cursor-pointer {
        cursor: pointer;
      }

    }
  `
}

export function getStyleForLI (theme: IMThemeVariables): SerializedStyles {
  return css`
    .layer-item-panel {
      .setting-header {
        padding: ${polished.rem(10)} ${polished.rem(16)} ${polished.rem(0)} ${polished.rem(16)}
      }
      .setting-title {
        font-size: ${polished.rem(16)};
        .layer-item-label{
          color: ${theme.colors.palette.dark[600]};
        }
      }
      .setting-container {
        height: calc(100% - ${polished.rem(50)});
        overflow: auto;

        .title-desc {
          color: ${theme.colors.palette.dark[200]};
        }

        .ep-divider-bottom {
          border-bottom: 1px solid var(--light-800)
        }

        .ep-divider-hide {
          border-bottom: none !important
        }

        .ep-section-title {
          max-width: 80%;
          color: var(--dark-800);
        }
      }
    }
  `
}
