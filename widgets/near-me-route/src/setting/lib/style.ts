import { type IMThemeVariables, css, type SerializedStyles, polished } from 'jimu-core'

export function getStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
    .widget-setting-near-me {
      height: 100%;

      .map-selector-section .component-map-selector .form-control {
        width: 100%;
      }

      .nearme-analysis-tooltip {
        margin-bottom: 0rem!important;
        width: 177px;
      }

      .placeholder-container {
        height: calc(100% - 180px);

        .placeholder {
          flex-direction: column;

          .icon {
            color: var(--dark-200);
          }

          .hint {
            font-size: ${polished.rem(14)};
            font-weight: 500;
            color: var(--dark-500);
            max-width: ${polished.rem(160)};
          }
        }
      }

      .color-label {
        color: ${theme.colors.palette.dark[400]};
      }

      .jimu-tree {
        width: 100%;
      }

      .data-item {
        display: flex;
        flex: 1;
        padding: 0.5rem 0.6rem;
        line-height: 23px;
        cursor: pointer;

        .data-item-name {
          word-break: break-word;
        }
      }
    }
  `
}

export function getMainSidePopperStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
  .collapsibleLabel {
    margin-bottom: 0rem!important;
  }

  .warningMsg {
    padding: 0.25rem!important;
    margin-top: 20px;
    margin-left: 10px;
  }
`
}

export function getSearchSettingStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
    .cursor-pointer {
      cursor: pointer;
    }

    .switchLabelWidth {
      width: calc(100% - 28px);
    }

    .nm-divider-top {
      border-top: 1px solid var(--light-800)
    }

    .color-label {
      color: ${theme.colors.palette.dark[400]};
    }

    .onlyShowResultsLabel {
      width: calc(100% - 52px);
    }
  `
}

export function getAnalysisSettingStyle (theme: IMThemeVariables, isActiveMapAreaSelected: boolean): SerializedStyles {
  return css`
  .alignTooltip {
    margin-right: -6px;
  }
  
  .disabled-label{
    color: ${theme.colors.palette.light[800]};
  }

  .nearme-analysis-list-items {
    .analysis-item {
      padding: 4px 2px 8px 2px;

      .layer-analysis-name {
        font-size: ${polished.rem(14)};
        font-weight: 400;
        width: ${isActiveMapAreaSelected ? '150px' : '165px'};
       }

      .analysis-type-name {
        font-size: ${polished.rem(13)};
        padding-top: 10px;
        width: 165px;
      }
    }

    .cursor-pointer {
      cursor: pointer;
    }
  }

  .sort-field-section {
    display: flex;
    align-items: center;
    flex: 1;
    .sort-field-selector {
      background:${theme.colors.palette.secondary[200]};
      border-radius: 2px;
      flex: 1;
      width: 0
    }

    .order-button {
        cursor: pointer;
        text-align:right;
        margin-left: ${polished.rem(2)};
    }

    .order-button svg {
        margin-right:0;
    }
  }

  .sort-icon {
    & {
        margin-left:5px;
    }

    .sort-button-l {
      border-radius: 2px 0 0 2px;
      border-right:none;
    }

    .sort-button-r {
      border-radius: 0px 2px 2px 0px;
      border-left:none;
    }

    .sort-button {
      border-color: ${theme.border.color};
    }

    svg {
      margin-right:0;
    }
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .add-summary-field {
    height: ${polished.rem(40)};
    width: 100%;
    color: ${theme.colors.palette.primary[700]};
    font-size: ${polished.rem(14)};
    cursor: pointer;
    &:hover {
      .add-summary-field-icon-container {
        background-color: ${theme.colors.palette.primary[800]};
      }
      color: ${theme.colors.palette.primary[800]};
    }
    .add-summary-field-icon-container {
      width: 20px;
      height: 20px;
      background-color: ${theme.colors.palette.primary[700]};
      border-radius: 10px;
    }
    .add-summary-field-icon {
      color: ${theme.colors.palette.light[300]};
    }
  }

  .fieldName {
    width: 180px;
  }

  .nearme-summary-fields-list-items {
    flex: 1;
    max-height: 290px;
    overflow-y: auto;
    margin-bottom: 10px;
    margin-top: 3px;

    .labelAlign {
      width: calc(100% - 65px);
      max-width: 155px;
    }

    .jimu-tree-item.jimu-tree-item_dnd-true {
      height: auto;
      padding-top: 0rem;
  
      .jimu-tree-item__body {
        padding: 4px 0px 4px 0px;
      }
    }
  }

  .colorModesWidth {
    width: calc(100% - 30px);
  }

  .analysisTypeWidth { 
    width: calc(100% - 16px);
  }
  `
}

export function getExpressionBuilderPanelStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
    .component-main-data-and-view {
      display: none;
    }

    .component-expression-builder .expression-editor-helper {
      height: calc(100% - 25px)!important;
    }

    .component-expression-builder .statistics-tab div {
      padding-top: 0px!important;
    }

    .expression-editor-container div {
      padding: 0px!important;
    }

    .component-expression-editor .exp-editor-helper-tab {
      margin-left: 0px!important;
      margin-right: 0px!important;
    }

    .component-field-selector .item-selector-search {
      margin-top: 18px!important;
    }
  `
}

export function getSidePanelStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
    position: absolute;
    top: 0;
    bottom: 0;
    width: 259px;
    height: 100%;
    padding-bottom: 1px;
    border-right: 1px solid ${theme.colors.white};
    border-bottom: 1px solid ${theme.colors.white};

    .setting-container {
      height: calc(100% - 52px);
      overflow: auto;
    }
`
}

export function getColorSelectorStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: var(--dark-800);
    > .color-list {
      width: 100%;
      flex-grow: 1;
      overflow-y: auto;
      max-height: 562px;
    }
    > .footer {
      height: 57px;
      width: 100%;
      border-top: 1px solid #6a6a6a;
      > div {
        display: flex;
        width: 100%;
        justify-content: space-between;
      }
    }

    .colorItemStyle {
      display: flex;
      width: 100%;
      justify-content: space-between;
      label {
        width: 88%;
        flex-grow: 1;
        display: inline-flex;
        justify-content: space-between;
        .label {
          max-width: 70%;
        }
      }
    }
`
}
