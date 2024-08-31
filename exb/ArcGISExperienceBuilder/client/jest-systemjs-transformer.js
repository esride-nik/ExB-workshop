module.exports = {
  process (src, fileName) {
    if (/setup\-jest\.js$/.test(fileName)) {
      return { code: src }
    }

    const systemjsFix = `
      const { System } = require("systemjs/dist/system-node.cjs");

      function _export(m) {
        module.exports = m;
      }

      System.register = (deps, declare) => {
        const depModules = deps.map(d => {
          if (['jimu-core/react', 'jimu-core/react-dom', 'jimu-core/react-dom/server'].includes(d)) {
            if (d === 'jimu-core/react') {
              d = 'react'
            } else if (d === 'jimu-core/react-dom') {
              d = 'react-dom'
            } else if (d === 'jimu-core/react-dom/server') {
              d = 'react-dom/server'
            }

            try {
              const m = require(d);
              m.default = {...m}
              return m;
            } catch (e) {
              console.error(e);
              return null
            }
          }

          try {
            const m = require(d);
            return m;
          } catch (e) {
            console.error(e);
          }
        });
        //systemRegister is init in setup-jest.js
        global.systemRegister(deps, declare);

        const {setters, execute} = declare(_export);
        setters && setters.forEach((setter, i) => {
            setter(depModules[i]);
        });
        execute && execute();
    };
    `
    return { code: systemjsFix + src }
  }
}
