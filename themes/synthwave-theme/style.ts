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
            background-image: linear-gradient(45deg, #65adff 30%, #e80dc4 50%);
        }

        #app {
            background-size: 50vw;
            background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iMTI4MC4wMDAwMDBwdCIgaGVpZ2h0PSIxMDE0LjAwMDAwMHB0IiB2aWV3Qm94PSIwIDAgMTI4MC4wMDAwMDAgMTAxNC4wMDAwMDAiCiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0Ij4KPG1ldGFkYXRhPgpDcmVhdGVkIGJ5IHBvdHJhY2UgMS4xNiwgd3JpdHRlbiBieSBQZXRlciBTZWxpbmdlciAyMDAxLTIwMTkKPC9tZXRhZGF0YT4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMTAxNC4wMDAwMDApIHNjYWxlKDAuMTAwMDAwLC0wLjEwMDAwMCkiCmZpbGw9IiMwMDAwMDAiIHN0cm9rZT0ibm9uZSI+CjxwYXRoIGQ9Ik0yOTc4IDEwMTM0IGMtNSAtNCAtOCAtMTggLTggLTMwIDAgLTIxIC0zIC0yMiAtMzIgLTEzIC03MSAyMCAtOTMKMTMgLTI1MCAtODMgLTE4MCAtMTA5IC0yMzcgLTE1NCAtMzgyIC0yOTYgLTE2OSAtMTY2IC0yNTkgLTI5OCAtMzA2IC00NDcgLTEyCi0zOCAtMjQgLTc3IC0yNiAtODUgLTQgLTEwIC0xMSAtNyAtMjcgMTMgLTEyIDE1IC00MCAzNCAtNjIgNDEgLTM4IDEzIC00MCAxNwotNTEgNzAgLTYgMzEgLTE0IDU5IC0xNyA2MyAtMTEgMTAgLTEyMSAtMTYgLTE0NyAtMzYgLTE0IC0xMCAtMzcgLTQyIC01MiAtNzIKLTM4IC03NCAtMzkgLTE3MCAtMyAtMjY2IDM2IC05NiAxMjggLTI2NiAxODYgLTM0NyBsNTAgLTY4IC0yNiAtNDAgLTI3IC00MAoyNyAtMjggYzE1IC0xNSAyMiAtMzAgMTcgLTM0IC01IC0zIC03OSAtMzUgLTE2NSAtNzAgLTIxMCAtODggLTMzNiAtMTUyIC00MzQKLTIyMiAtMTkzIC0xMzkgLTQyNSAtMzcxIC01NjMgLTU2NCAtMzcgLTUyIC0xMDIgLTEzNSAtMTQ0IC0xODMgLTExMyAtMTMxCi0xNjEgLTE5NyAtMjQ5IC0zMzYgLTExNiAtMTg2IC0zMDUgLTU3NyAtMjg2IC01OTUgMiAtMyAyNSAwIDQ5IDUgNTEgMTIgNDIKMjAgMTE0IC0xMDYgMjcgLTQ3IDU0IC04NSA2MCAtODUgNiAwIDI0IDIxIDQxIDQ4IDQzIDY5IDE2NSAyMTIgMjE5IDI1OCBsNDYKNDAgNjkgLTEwIGMzNyAtNSA3NiAtNiA4NSAtMyA5IDQgMjggMzIgNDIgNjIgMzQgNzkgMzggODEgMzI3IDExMyBsNjggNyA2OQoxNDUgNzAgMTQ1IDEzNiAzIDEzNyAzIC03IC0zMyBjLTQ1IC0yMTggLTg1IC01NTggLTkzIC03ODMgLTYgLTE3NyA0IC0yNjUgNjcKLTYzNyAxOSAtMTA3IDIwIC0xMTAgNzAgLTE2NiAyOCAtMzEgNjUgLTc4IDgzIC0xMDQgMTggLTI2IDQwIC00OCA0OSAtNDggMTAKMCAzMyAxMyA1MSAzMCAxOSAxNiAzNyAzMCA0MCAzMCAyIDAgMjQgLTI5IDQ3IC02NSAyNCAtMzYgNTEgLTcwIDYxIC03NSAxMAotNiA0MSAtMTAgNjkgLTEwIDQ5IDAgNTQgLTMgMTMyIC03MSA3OSAtNzAgODIgLTcxIDEyNCAtNjUgMjQgMyA0NCAyIDQ0IC0zIDAKLTI4IC0yMjggLTg1OSAtNDg1IC0xNzcxIC0yMjEgLTc4MyAtMjQ0IC04NzAgLTI3OSAtMTAzNSAtNTggLTI4MSAtODQgLTU1NQotMTE2IC0xMjUwIC0xMSAtMjQyIC0yOCAtNTMwIC0zNiAtNjQwIC05IC0xMTAgLTE3IC0yMzEgLTE5IC0yNjkgLTMgLTQ2IC0xMAotNzQgLTIxIC04NyAtMTAgLTExIC0xNCAtMjIgLTEwIC0yNyAxMCAtOSA2NjggLTggNzE3IDIgMzQgNiAzOCAxMSA2OSA4NCAxNwo0MiA2NiAxNDUgMTA5IDIyNyAyMDQgMzk4IDUyMiA4MTMgOTUxIDEyNDYgNDUxIDQ1NCA5MjYgODYwIDIwOTUgMTc5NCA3OTgKNjM3IDg0NCA2NzMgMTI2NyA5ODggNDM3IDMyNiA1ODIgNDQ0IDgxMyA2NjUgMTEwIDEwNSAyMDEgMTkwIDIwMiAxODkgMSAtMgotMTMgLTc3IC0zMiAtMTY3IC00NiAtMjIzIC04NSAtNDU1IC04NSAtNTAyIDAgLTMyIDkgLTUwIDUwIC05OCAzMSAtMzggNTEKLTczIDU1IC05NSAzIC0xOSA3IC01MCAxMCAtNjggNCAtMjggMTMgLTM3IDYwIC02MCBsNTUgLTI3IC0xOSAtMzcgYy0yMSAtNDMKLTUxIC0xMzggLTUxIC0xNjQgMCAtMTMgMTMgLTIyIDQwIC0zMCA1MiAtMTYgMTExIC02NiAxNTYgLTEzNSAzMSAtNDcgODAgLTk0Cjk3IC05NCAzIDAgMjAgMjYgMzcgNTggMTcgMzEgMzkgNjcgNTAgODAgMTggMjIgMjAgMjIgNTAgNyA2MCAtMzEgODAgLTE5IDEyMAo3MSA1MCAxMTUgNjMgMTMyIDExNSAxNDUgNjUgMTYgNzQgMzEgODUgMTQ4IDUgNTcgMTQgMTIwIDIwIDE0MiBsMTEgMzkgNzQgMApjOTMgMCA5MyAxIDI2IDEzMyBsLTQ5IDk3IDYxIDAgYzExNSAwIDEwNyAtMTIgMTAwIDE2OSBsLTYgMTU4IDM3IDIyIGMyMCAxMwozOSAyMiA0MSAxOSAyIC0yIC03IC01NSAtMjEgLTExOCAtMTQgLTYzIC0yOCAtMTMwIC0zMSAtMTQ4IGwtNiAtMzMgNDQgNyBjMjQKNCA5MSAyMCAxNDggMzYgNTcgMTYgMTA1IDI3IDEwNyAyNiAxIC0yIC0yNSAtNzIgLTU4IC0xNTYgLTMzIC04NCAtNTggLTE1NgotNTQgLTE1OSA5IC05IDExNCA0MyAyMTcgMTA3IDcwIDQ0IDc5IDQ3IDc0IDI3IC00IC0xMiAtMjcgLTg2IC01MiAtMTY1IC0yNQotNzggLTQzIC0xNDYgLTM5IC0xNDkgMTIgLTEyIDgxIDU0IDExNiAxMTEgNDQgNzQgNDggNjQgNTAgLTEwOSBsMSAtMTMwIDM2CjQwIGMzNSAzOSAxMDcgMTQ0IDExNiAxNjggNyAxOSAxNyAzIDQyIC02OSAxMyAtMzggMjkgLTY5IDM2IC02OSA2IDAgNDQgNjEKODQgMTM1IDQwIDc0IDc3IDEzNiA4MiAxMzcgNiAyIDE0IC0xNiAxOSAtMzkgMTMgLTYzIDMzIC01NSA2MyAyNyAzNyAxMDAgMzcKOTkgNzUgNzUgNDIgLTI1IDUyIC0yNSA1OSAwIDMgMTEgMTMgMjAgMjIgMjAgOSAwIDI5IDggNDMgMTggNTEgMzUgNTMgMzQgMjgKLTE3IC0xNCAtMjggLTI2IC01NyAtMjYgLTY1IDAgLTkgMTcgLTI0IDM4IC0zNSA0NiAtMjQgNjMgLTQyIDk2IC0xMDggMjggLTU3CjM3IC02MCAxMDggLTQ0IGwzNyA5IDMgLTYyIDMgLTYxIDUzIC0zIGMzMCAtMiA2MCAyIDY3IDggNyA2IDIzIDQzIDM1IDgzIDI3Cjg5IDYwIDE2NyA3MSAxNjcgNyAwIDIxIC01OCAzNCAtMTQzIDkgLTU0IDI1IC00MyA2MCA0MiBsMzAgNzMgMTkgLTI0IGMxMAotMTMgMzAgLTQ3IDQ0IC03NyAyNCAtNTMgMjUgLTU0IDM4IC0zMCA3IDEzIDMyIDc1IDU1IDEzNiAyMiA2MiA0NSAxMTEgNTAKMTA4IDQgLTMgMjEgLTI4IDM2IC01NiAyNSAtNDggMjggLTUwIDM3IC0yOSA3IDE1IDYgNjkgLTMgMTYzIC03IDc4IC0xNSAxOTIKLTE4IDI1MyBsLTUgMTEwIDM2IDI4IGMyMCAxNSAzNiAzNSAzNiA0NiAwIDM2IC02MiAxOTYgLTExNiAyOTkgbC01NSAxMDMgMzgKNDkgYzIwIDI3IDM4IDQ3IDQwIDQ2IDEgLTIgLTUgLTI5IC0xNCAtNjAgLTkgLTMyIC0xMyAtNjEgLTggLTY1IDQgLTQgMzEgMTkKNjAgNTEgNDkgNTYgNTMgNTggNTggMzUgNCAtMTIgNyAtNjMgOCAtMTEzIDEgLTEzNSA2IC0xMzkgNjMgLTU1IDI3IDM4IDUyIDczCjU3IDc2IDEwIDYgLTIxIC03NyAtNTEgLTEzNiAtMTEgLTIyIC0yMCAtNDIgLTIwIC00NSAwIC0xNiAzMiAyIDk4IDU3IDYzIDUyCjc0IDU4IDY5IDM4IC00OCAtMTcyIC01NSAtMjI5IC0yMyAtMTg0IDEyIDE2IDEzIDEyIDQgLTM0IC01IC0zMCAtOCAtNjYgLTYKLTgwIDMgLTI1IDggLTIwIDYyIDUzIDgyIDExMiA3OSAxMTEgNzEgMTUgbC03IC04NSA2MSA2MCA2MiA2MCAtMzYgLTkwIGMtMTkKLTUwIC0zNCAtOTcgLTMzIC0xMDUgMiAtMTAgMjQgNCA2NiA0MyAzNCAzMSA2NSA1NyA2OCA1NyA0IDAgNCAtNTIgMSAtMTE1IC0zCi02MyAtMyAtMTE1IDEgLTExNSAzIDAgMzUgMjggNjkgNjIgMzkgMzkgNjMgNTYgNjMgNDYgMCAtMzQgNDEgLTE0OCA1NCAtMTQ4CjcgMCAyNiAyNCA0MiA1MyBsMjkgNTIgNiAtOTUgYzQgLTUyIDcgLTEzMyA4IC0xODAgbDIgLTg1IDM0IDM5IGMzMyAzNyAzNCAzOAozOSAxNSAzIC0xMyA3IC0zNSA4IC00OCAxMCAtODkgNjggNDAgNzUgMTY5IDExIDE3NSAtNzIgNDU2IC0yMzIgNzg0IC0xMDAKMjA2IC0yMTggMzc4IC00NTEgNjU4IC0xNTYgMTg2IC01MjEgNTU1IC03MzggNzQ0IC0xMzkgMTIxIC0xNjUgMTQ4IC0xOTggMjA5CmwtMzggNzAgMjQgMjEgYzE2IDE1IDMzIDIwIDUwIDE3IDI5IC02IDMxIDEgMTIgMzYgLTEzIDI0IC0xMSA2MSA0IDYxIDExIDAKMTAyIC0xMDAgMTQyIC0xNTYgMjcgLTM4IDMzIC00MiAzOSAtMjcgNCAxMCA4IDM1IDggNTUgMSAyMCA1IDM5IDExIDQzIDEyIDcKODEgLTExOCAxMjIgLTIyMyAxNyAtNDUgMzcgLTgxIDQyIC03OSAxMyA0IDQwIDEwMSA1NyAyMDIgbDEzIDczIDUzIC05MSBjMzAKLTUxIDYzIC0xMTEgNzUgLTEzNCAzOSAtNzcgNDcgLTUwIDI0IDcyIC04IDM5IC0xMyA3MiAtMTEgNzMgMiAyIDM0IC01OCA3MgotMTMzIGw2OCAtMTM3IDcgMTA4IGMxMyAxODkgNiAxNzggNTggMTAwIDI1IC0zOCA2MyAtMTAzIDg1IC0xNDUgMjIgLTQxIDQ1Ci03NyA1MiAtNzkgMTUgLTQgMjcgNzUgMjAgMTM2IGwtNSA0NyA0NSAtNTAgYzg5IC05OSAxMjcgLTE1MSAxNTkgLTIyMCAyMAotNDQgMzUgLTY0IDM4IC01NSAzIDggMTggNjMgMzQgMTIzIGwyOCAxMDcgNTUgLTU3IGMzMCAtMzIgNzkgLTg2IDEwOCAtMTIwCjI5IC0zNSA1OSAtNjMgNjYgLTYzIDkgMCAxNSAyMyAyMCA3OCAzIDQyIDcgODYgOCA5NyAxIDExIDI5IC00MiA2MiAtMTE4IGw2MAotMTM4IDUgOTAgNSA5MCA1NSAtMTIxIGM3MiAtMTU4IDg1IC0xNjMgNzcgLTI5IC0zIDU1IC00IDEwMSAtMiAxMDEgMiAwIDM2Ci00OCA3NSAtMTA2IDUwIC03NCA3NSAtMTAyIDgwIC05MyA0IDggMTMgNTUgMjAgMTA0IDcgNTAgMTUgODQgMTggNzYgMyAtOCAxNAotNzggMjYgLTE1NSAxMiAtNzggMjYgLTE0MSAzMSAtMTQwIDE0IDEgNDggNzEgNTUgMTE0IGw2IDM1IDIxIC00MCBjMTIgLTIyCjI2IC02MCAzMiAtODUgNyAtMjUgMTQgLTUyIDE3IC02MCAxMCAtMjcgMjEgMjAgMjkgMTIzIDQgNTQgOSA5NiAxMSA5NSAxIC0yCjI2IC04MCA1NCAtMTczIDI3IC05MyA1MiAtMTcxIDU1IC0xNzMgMTEgLTExIDE1IDggMjUgMTAzIDEyIDExOSAzMSAyMjUgNDAKMjI1IDMgMCAxMiAtMjggMTkgLTYyIDMxIC0xNTEgNTMgLTIzOCA2MSAtMjMzIDQgMyAxMSA0NCAxNSA5MSBsNyA4NyAzNyAtODkKYzUyIC0xMjMgNjMgLTE0NCA3NCAtMTQ0IDkgMCA0IDEwMSAtOSAxNzAgLTggNDUgMjYgLTUzIDQ4IC0xMzUgMTEgLTQ0IDIzCi04NCAyNiAtOTAgMTEgLTE4IDIxIDY3IDIxIDE4NSAxIDkzIC0yIDEyMCAtMTcgMTQxIC01NyA4NSAtMzk0IDQxMyAtNTU0IDUzOAotMjk4IDIzNSAtNjgyIDQwNiAtMTIwMSA1MzcgLTc3IDE5IC0xNTUgNDEgLTE3MyA0OSBsLTMzIDEzIDI5IDc4IGMxNiA0MiAzMwo4MSAzOSA4NyA2IDYgMzUgLTE3IDc5IC02MiA2NSAtNjcgOTIgLTg1IDkyIC02MSAwIDE4IDIyIDExIDg0IC0yOSAxMDkgLTY4CjI5OCAtMTczIDMwMyAtMTY3IDMgMyAtMjIgMzcgLTU2IDc3IC0zNCAzOSAtNjEgNzMgLTU5IDc0IDIgMiAzOSAtNSA4MyAtMTUKMTA3IC0yNiAxMTkgLTI2IDExMiAzIC0yIDEyIC0yMSA1NyAtNDAgMTAwIC0yMCA0MiAtMzUgNzcgLTMyIDc3IDIgMCA0MyAtMjUKOTEgLTU1IDQ5IC0zMCA5MiAtNTUgOTYgLTU1IDE2IDAgNyAyMCAtMjQgNTcgLTE4IDIxIC0zOSA0NiAtNDcgNTcgLTkgMTAgNTYKLTE3IDE0NCAtNjEgODggLTQ0IDE3MCAtODMgMTgzIC04NyAzMCAtMTAgMjkgMTQgLTMgNDQgLTE0IDEzIC0yNCAyNSAtMjIgMjYKMiAyIDMxIC02IDY2IC0xNiAzNCAtMTEgNzMgLTIwIDg3IC0yMCAxNiAwIDUzIDI5IDExOSA5MSA1MiA1MCA5NSA5NyA5NSAxMDQKMCA3IC0zOSAyOCAtODcgNDUgLTE5MCA3MCAtNDUzIDE1OSAtNTQ3IDE4NiAtODYgMjUgLTEwMyAzNCAtMTM1IDY4IC0yMCAyMgotNTEgNTUgLTcwIDc0IC0xOCAxOCAtMzIgMzUgLTMwIDM3IDcgNiAxNTkgMjUgMjA1IDI1IDI0IDAgNDQgNCA0NCA5IDAgMTIKLTE0OSA3OSAtMjYyIDExNyAtMjQ0IDgzIC02MjggMTQzIC05MTcgMTQ1IC0xMDUgMCAtMTMxIDMgLTExMyAxMSAxMiA2IDIyIDE2CjIyIDIyIDAgNiAtMjggMzkgLTYyIDc0IGwtNjMgNjQgNTAgLTI1IGM1NCAtMjYgMTAwIC00MiAxNTMgLTUxIDMzIC02IDM0IC01CjYxIDU3IDE2IDM0IDM4IDkyIDUwIDEyOSBsMjIgNjcgMTA4IC02IGMxMDEgLTUgMTA5IC00IDExNCAxMyAzIDEwIDEzIDUxIDIyCjg5IDI4IDExNCAyOSAxMTUgMTQwIDExNSBsOTUgMCAwIDQ4IGMwIDg2IC0zNiAxMjIgLTE1OCAxNjEgbC03MSAyMiAtMTYgNTUKYy04IDI5IC0yMCA1NCAtMjYgNTQgLTUgMCAtMTE5IC0yNyAtMjUyIC01OSAtMjQ0IC02MCAtMzgzIC0xMDMgLTQ2OSAtMTQ3CmwtNDYgLTIzIC0xMyAtOTMgYy03IC01MSAtMTQgLTg4IC0xNSAtODMgLTIgNiAtOCAyOSAtMTQgNTMgLTEzIDUwIDAgNTAgLTE1NwotNSAtMTEwIC0zOCAtMTE0IC00MiAtODcgLTk1IGwxNiAtMzEgLTMyIDIzIGMtMjggMjAgLTM0IDIxIC01NyA5IC0zMyAtMTgKLTE2MSAtMTI4IC0zNjQgLTMxNCAtMTk5IC0xODIgLTI3OCAtMjQ5IC0yODQgLTI0MyAtMyAzIDEgMzcgMTAgNzcgOCA0MCAxNQo4OSAxNSAxMTAgMCAzMyAtNCA0MCAtMzAgNTEgLTE2IDcgLTU2IDE1IC04OSAxOSAtMzQgNCAtNjMgMTAgLTY2IDEzIC03IDYgMTEKMjc1IDIxIDMyMCA1IDIzIDEgMjkgLTM1IDQ3IC0zMyAxNyAtNTkgMjEgLTE0OCAyMSBsLTEwOCAwIC0yMiAzOCBjLTExIDIwCi02NSA4NCAtMTE4IDE0MSAtNTMgNTcgLTEwNyAxMTggLTEyMSAxMzcgLTI5IDM3IC01NSA0OCAtMTY3IDY1IC05MiAxNCAtMjEzCjcgLTI3OSAtMTYgLTUyIC0xOCAtNTUgLTI0IC0zNCAtNTggNyAtMTIgMTYgLTQxIDE5IC02NCBsNSAtNDMgLTk3IDAgYy0xNDggMAotMjc5IC00MCAtMzgzIC0xMTggbC02MyAtNDcgOTAgLTcgYzE0MSAtMTIgMTMyIC02IDkzIC02MyAtMTggLTI3IC00NSAtNjUKLTU4IC04NCBsLTI1IC0zMyAzNCAtMjcgYzE0MiAtMTEwIDEzNSAtMTAyIDE1MCAtMTczIGwxNCAtNjcgMTAxIC00MiBjMTQzCi01OSAyMDQgLTc5IDI0NCAtNzkgbDM0IDAgLTMyIC0zNyBjLTMwIC0zNCAtNzYgLTEyMCAtNjggLTEyOCAxIC0xIDMwIC0yMCA2MwotNDAgNjggLTQyIDY3IC00MiAtNjkgMTQgLTU4MyAyNDIgLTE0MzIgNDI2IC0xODc2IDQwOCAtMzcxIC0xNiAtOTIzIC0xNjEKLTEyNTQgLTMzMCAtMTUzIC03OCAtNDc2IC0zMDAgLTQ3NiAtMzI3IDAgLTUgNCAtMTIgMTAgLTE1IDE1IC05IDI2MSAtNDMgMzY4Ci01MSBsOTcgLTYgNjUgMzggYzM2IDIwIDE1MyA5MSAyNjAgMTU3IDEwNyA2NiAyMDYgMTI2IDIyMCAxMzQgMjUgMTUgMjUgMTUKLTEgLTggLTE1IC0xMyAtNjMgLTU1IC0xMDggLTkzIC03NyAtNjYgLTEwMSAtOTYgLTY0IC04MiAzNyAxNSAyODMgMTU4IDM2OAoyMTUgNDkgMzMgOTEgNTggOTMgNTYgMiAtMiAtMjcgLTYyIC02NCAtMTMzIC0zOCAtNzIgLTY2IC0xMzMgLTYyIC0xMzcgOSAtOQoyNDIgMTEyIDQzMCAyMjQgbDM2IDIyIC0xMyAtNTggYy04IC0zMiAtMjEgLTc1IC0zMCAtOTYgLTkgLTIyIC0xNSAtNDMgLTEzCi00OCA0IC0xMSAxMjIgNDQgMTY3IDc4IGwzNCAyNiA2MSAtMzEgYzMzIC0xOCA4MyAtNDQgMTEwIC01OSA0MyAtMjMgNjMgLTI3CjE2MCAtMzEgMTQyIC02IDE1NSAtMTIgODcgLTQ2IC0xODYgLTk1IC0zODAgLTI0MyAtNTE0IC0zOTUgLTEyOSAtMTQ2IC0yNTYKLTQxMCAtMjkxIC02MDMgLTE0IC03NiA0NiAtMjggMTM3IDExMCAyMyAzNCA0NCA2MiA0OCA2MiA3IDAgNTIgLTY3IDYxIC05MSA1Ci0xMyAtMTQgLTMxIC03NSAtNzEgLTEwNSAtNzAgLTE4OCAtMTM3IC0zMDkgLTI0OSBsLTk3IC04OSAtMTEwIDc3IGMtNjAgNDMKLTEwNyA4MSAtMTAzIDg1IDQgMyAxNiA4IDI3IDEwIDQxIDcgMjUgMzMgLTUzIDg1IC00MiAyOCAtODcgNTYgLTk5IDYyIC0xMyA3Ci0yMyAxNSAtMjMgMTkgMSA0IDI4IDE5IDYyIDM1IDU5IDI2IDYyIDI3IDgxIDEwIDExIC0xMCAzOSAtNDggNjMgLTg1IDQ3IC03Mgo3NiAtOTMgMTczIC0xMjIgMzAgLTkgNzIgLTE2IDkyIC0xNiAzNiAwIDM4IDIgNDQgMzggNCAyMCAxMyA1OSAyMCA4NyAxNyA2MAoyNSA1MSAtMTY1IDIxNCAtMzM1IDI4OCAtNTE1IDQxOSAtNjk1IDUwNiAtMTM0IDY1IC0zNjkgMTYyIC02NTUgMjcxIC05MCAzNAotMTY2IDY2IC0xNjcgNzEgLTIgNSAxMCAxNiAyNiAyNiAyMiAxMyA1MyAxNyAxMzEgMTcgOTIgMCAxMDEgMiA5NyAxOCAtMjAgNzMKLTIzIDY5IDUxIDc2IDEyNiAxMyAxMTggMjEgLTY4IDcwIC02NSAxNyAtMzMgMjEgMzggNSA0NyAtMTEgNTEgLTExIDk0IDE5IDI0CjE3IDc4IDU4IDExOSA5MSA4NSA3MSAxNDUgOTYgMjU4IDExMCAxMDEgMTMgMTQ0IDMxIDE2NyA3MCAxMCAxNyAyMSAzMSAyNCAzMQozIDAgMjIgLTE2IDQxIC0zNiAzOSAtNDEgNTQgLTQxIDE2MCAyIDgzIDMzIDEyOSA2MiAxMjkgODAgMCAyMiAtMzA4IDE2OAotNDYyIDIxOSAtMTk0IDYzIC0zNTAgOTMgLTU1OSAxMDYgLTE2NiAxMCAtNDQ1IDEgLTU1MSAtMTcgLTM3IC02IC0zOCAtNiAtMzgKMjQgMCAxNyA1IDQzIDEwIDU4IDEwIDI0IDE0IDI2IDUzIDIxIDIzIC0zIDUyIC05IDY1IC0xMyAzOCAtMTEgMjcgMjUgLTM3CjEyMiAtNzcgMTE2IC05NCAxMzIgLTE2NyAxNDUgLTkwIDE3IC05MyAxOSAtNTYgMzUgMjQgMTAgMzggMjUgNDkgNTMgMTIgMzIKMjUgNDMgNjIgNTkgMjUgMTEgNTUgMjIgNjYgMjQgMTggMyAyMCAxMSAxOSA2OSAtMSA4NCAtMjMgMTI1IC04OCAxNjAgLTU2IDMxCi02OCA0NiAtNTQgNjkgNiAxMCA4IDI0IDUgMzMgLTkgMjMgLTE2MCA5MyAtMjUzIDExOCAtODEgMjIgLTI3MyAzNyAtMjg2IDIzegptNTE2MiAtMjU2MyBjMCAtNSAtNTEgLTM1IC0xMTIgLTY2IC02MiAtMzIgLTE4MSAtOTUgLTI2MyAtMTQxIC0xNjIgLTkwIC03MjUKLTM2MiAtNzI1IC0zNDkgMCAxOSA3NTIgNDEzIDk5MCA1MTggMTIyIDU0IDExMCA0OSAxMTAgMzh6IG0tMzI2MCAtOTIxIGMzOAotNjUgMzkgLTY1IDEyNyAtOTggMTIzIC00NiAxMjAgLTQzIDk1IC04NyAtMTIgLTIwIC0yMiAtMzggLTIyIC00MSAwIC0xMSAyMQotMiA0NyAyMCBsMjggMjQgLTM1IC0xMDggLTM1IC0xMDggLTc5IDcyIGMtNDMgMzkgLTEwMiA5MSAtMTMxIDExNiAtNTYgNDcKLTU2IDU5IDAgNjAgMzcgMCA3NSAxMCA3NSAxOSAwIDQgLTI4IDM4IC02MSA3NiAtNzUgODQgLTk5IDEyMiAtOTkgMTU1IGwxIDI1CjI1IC0zMCBjMTQgLTE2IDQyIC01OSA2NCAtOTV6IG0yNzc0IC0xMzkgbDg3IC04NCAtMjAgLTExNiBjLTI3IC0xNTUgLTM2Ci0yNTEgLTI0IC0yNTEgMTYgMCAxMDkgMTAzIDE0OSAxNjYgbDM3IDU4IDE1IC0zMiBjMTUgLTMxIDE1IC0zMyAtMzIgLTEwMgotMTM1IC0yMDQgLTQxOSAtNTc0IC01OTAgLTc3MCAtMTEyIC0xMjkgLTM0OCAtMzY4IC00MTUgLTQyMCBsLTQ0IC0zNCA4IDM5CmM0IDIyIDEwIDgwIDE0IDEzMCBsNiA4OSA0MCAxMiBjMjIgNyA2NiAxMyA5NyAxMyA2OCAxIDgyIDEyIDk4IDgzIDcgMjkgNDQKMTMzIDgyIDIzMSA4NiAyMjIgMTA1IDI5NSAxMTggNDYwIDEyIDE1OSAzNyAzNDkgNTAgMzgzIDE4IDQ1IDgxIDEzNyA5MCAxMjgKNCAtNSAxOCAtMzggMzEgLTc0IDEyIC0zNiAyNSAtNjkgMjkgLTczIDEyIC0xNCAzMCA1MSAzNiAxMjcgMiAzOSA3IDk1IDEwCjEyNSBsNiA1MyAxOCAtMjggYzkgLTE2IDU2IC02NyAxMDQgLTExM3ogbS0xMzMzIDExOSBjMTggLTEwIDEzIC0xNiAtNDggLTY2Ci0zOCAtMzAgLTE4MCAtMTY0IC0zMTggLTI5OCBsLTI1MCAtMjQzIDAgMTMxIDAgMTMxIDUwIC0yNyBjMjggLTE1IDYyIC0yOCA3NwotMjggMjQgMCAyOSA3IDU3IDgwIDE3IDQzIDMxIDg0IDMxIDkwIDAgNiAyNiAxMCA2MCAxMCA4NiAwIDEyMSAxOCAxNjQgODMgMzgKNTcgMTI3IDE0NyAxNDYgMTQ3IDYgMCAyMCAtNSAzMSAtMTB6IG0tMTY0NiAtNjc4IGw0NiAtNzkgMTAyIC0zMiBjNTYgLTE3CjExNCAtMzEgMTI5IC0zMSAxNCAwIDExNCAtNDUgMjIxIC0xMDAgMTA3IC01NSAyMDIgLTEwMCAyMTAgLTEwMCAyMSAwIDY3IDYxCjY3IDg5IDAgMTIgLTE0IDQ5IC0zMSA4MiAtMTcgMzQgLTI4IDY3IC0yNSA3NSA2IDE1IDEwOCAyMCAxNTMgOCAyMyAtNiAyMyAtNwotMTAgLTQ2IC02NyAtODMgLTc3IC0xMDAgLTY2IC0xMjAgMTQgLTI2IDEwOSAtNzggMTQzIC03OCAxNiAwIDM3IDcgNDcgMTYgMTUKMTQgMjAgMTMgNTAgLTUgNDkgLTMwIDY2IC0yNiAxMDEgMjQgMzIgNDYgNDggNTAgNDggMTIgMSAtNjQgNSAtNjcgMTAxIC02NwoxMDUgMCAxMDIgLTMgMTE0IDEyMyA4IDc5IDI1IDExNiAyNSA1MyAwIC01NiAyMSAtMTM3IDM3IC0xNDMgOCAtMyA0MSAyIDc0CjEyIDMyIDEwIDYxIDE2IDY0IDE0IDIgLTMgLTIgLTI5IC0xMCAtNTkgLTI3IC0xMDIgLTY1IC0zNDQgLTcxIC00NDAgbC01IC05NQoyOCA2NiAyOCA2NiAyIC0yMDYgYzIgLTE3MCA2IC0yMjUgMjUgLTMxNSAxMyAtNjIgMjkgLTExMSAzNiAtMTE0IDE3IC01IDUxCjc1IDU5IDEzNyA5IDc2IDEzIDc4IDc3IDM3IDMxIC0yMCA1NiAtNDAgNTYgLTQ1IDAgLTUgLTI2NCAtMjAyIC01ODcgLTQzNwotMTY5MiAtMTIzMiAtMjA5MSAtMTU0NiAtMjcyOSAtMjE0NSAtMzg0IC0zNjAgLTc0NCAtNzUyIC0xMTU4IC0xMjU5IC04OAotMTA3IC0xODcgLTIyNiAtMjIwIC0yNjMgLTcxIC04MiAtNjcgLTg2IC05MyA5NiAtMTUgOTkgLTE4IDE5NSAtMTggNTEyIDAKMzgyIDggNTUyIDQxIDgyMCAyMiAxOTAgMjggMjE0IDE3MCA3MTAgMjI2IDc4NyAzOTUgMTQzMCA1MTQgMTk1NSAyOCAxMjMgNTMKMjI2IDU0IDIyOCAyIDEgMTMgLTEzIDI0IC0zMyAyNCAtNDAgMzUgLTQyIDc3IC0xNyBsMzAgMTkgMzAgLTQ1IGMyNSAtMzggNDgKLTU0IDE0MCAtMTAxIDYxIC0zMSAxNTggLTg3IDIxNyAtMTI0IDU4IC0zNyAxMTAgLTY3IDExNSAtNjcgNSAwIDI5IDE2IDUyIDM3Cmw0MyAzNiA0NiAtMjQgYzI2IC0xMyA1MCAtMjUgNTUgLTI3IDEwIC01IDkgNDUgLTIgNjYgLTQgOSAtMTEgMjkgLTE1IDQ1IC02CjI3IC02IDI3IDQ1IDI3IDQ1IDAgNTAgMiA0NSAxOCAtMTUgMzkgLTkzIDE2NiAtMTQzIDIzMyBsLTU0IDcyIDI3IDIyIGMyMyAxOAoyNiAyNyAyMSA1NCBsLTcgMzMgNTkgLTcgNTggLTcgNyA2NCBjNCAzNCAxNSAxMDAgMjQgMTQ2IGwxNyA4MiA1MiAtMzUgYzQ0Ci0zMCA3MyAtNDMgNzMgLTMyIDAgMSA3IDQwIDE1IDg3IDIwIDExMyAzOSAxNzUgNzggMjU4IGwzNCA2OSAxMzQgLTEyNCBjMTY1Ci0xNTQgMzEyIC0yNzMgNDQ4IC0zNjQgMTAxIC02OCAxOTEgLTExOSAyMTAgLTExOSA1IDAgMTQgMjMgMjAgNTAgNiAyOCAyMCA2OAozMSA5MCAxOSAzNyAyMSAzOSA4NyA0NSAzOCA0IDg1IDE0IDEwNiAyMyAzMSAxMiAzOCAxOSAzMyAzNiAtMiAxMSAtNyAzNyAtMTEKNTYgbC02IDM1IDgyIC00IDgyIC0zIC03IDMzIGMtMTAgNTQgLTk0IDI1NSAtMTYyIDM5MiAtMzUgNzAgLTYyIDEyNyAtNTkgMTI3CjMgMCAyNSAtMzUgNTAgLTc4eiBtLTI0OTAgLTMyOSBjMzQgLTk4IDc4IC0yMTkgOTYgLTI2OCAzMiAtODkgMzIgLTkyIDE5Ci0xNTMgLTcgLTM0IC0xNiAtNjIgLTE5IC02MiAtNCAwIC0yMiAyNSAtNDAgNTUgLTMyIDUyIC0zMyA1NyAtMjIgOTggMTQgNTEKMTAgNjQgLTgzIDI5MSBsLTY1IDE1OCAyMiAzMyBjMTIgMTkgMjMgMzIgMjUgMzAgMiAtMiAzMiAtODQgNjcgLTE4MnoiLz4KPC9nPgo8L3N2Zz4K);
            background-repeat: no-repeat;
            background-position-y: bottom;
        }
    `;
};

const buttonStyles = (props) => {
    const theme: IMThemeVariables = props.theme;
    return css`
        font-size: ${theme?.typography.sizes.display3};
    `;
};

// global styles
export { globalStyles as Global };
// Button component styles
export { buttonStyles as Button };
