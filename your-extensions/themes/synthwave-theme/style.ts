/**
  Licensing

  Copyright 2020 Esri

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

/*
* Sample code:
* Uncomment the following sections to add:
* 1. global style: import the Roboto font from external url.
* 2. Button component style override: font size change for all Button components.
*/

import { css, IMThemeVariables } from 'jimu-core';

const globalStyles = () => {
    return css`
    // Set default font in "fontFamilyBase" property in variables.json
   @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@600&display=swap');

   body {
    background-image: linear-gradient(45deg, #65adff 30%, #E80DC4 50%);
  }
  `
};

const buttonStyles = (props) => {
    const theme: IMThemeVariables = props.theme;
    return css`
    font-size: ${theme?.typography.sizes.display3};
  `
};

// global styles
export { globalStyles as Global };
// Button component styles
export { buttonStyles as Button };
