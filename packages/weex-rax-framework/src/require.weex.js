/**
 * Special require function
 * require sequence User Defined > Version > APPGlobal
 * @param  {[type]} modules    [description]
 * @param  {[type]} appRequire [description]
 * @param  {[type]} appModules [description]
 * @return {[type]}            [description]
 */
module.exports = function(modules, appRequire, appModules, versionRequire, versionModules) {



  function require(name) {
    var mod = modules[name];
    let req = require;

    if (mod && mod.isInitialized) {
      return mod.module.exports;
    }

    if (!mod) {
            if(versionRequire && versionModules[name]) {
                mod = versionModules[name];
                req =  versionRequire;
                if (mod.isInitialized) {
                  return mod.module.exports;
                }
            }else if(appRequire && appModules[name] ) {
                mod = appModules[name];
                req =  appRequire;
                if (mod.isInitialized) {
                  return mod.module.exports;
                }
            }
            else {
                throw new Error(
                  'Requiring unknown module "' + name + '"'
                );
            }
    }

    if (mod.hasError) {
      throw new Error(
        'Requiring module "' + name + '" which threw an exception'
      );
    }

    try {
      mod.isInitialized = true;
      mod.factory(req, mod.module.exports, mod.module);
    } catch (e) {
      mod.hasError = true;
      mod.isInitialized = false;
      throw e;
    }

    return mod.module.exports;
  }

  return require;
};
