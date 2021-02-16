module.exports = {
  process(src, fileName) {
    if(/setup\-jest\.js$/.test(fileName)){
      return src;
    }

    var systemjsFix = `
      const { System } = require("systemjs");

      function _export(m) {
        module.exports = m;
      }

      System.register = (deps, declare) => {
        const depModules = deps.map(d => {
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
    `;
    return systemjsFix + src;
  },
};