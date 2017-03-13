'use strict';

import {ModuleFactories} from './builtin';
import EventEmitter from './emitter';

let NativeComponents = {};
let NativeModules = {};

let Document;
let Element;
let Comment;

const MODULE_NAME_PREFIX = '@weex-module/';
const MODAL_MODULE = MODULE_NAME_PREFIX + 'modal';
const NAVIGATOR_MODULE = MODULE_NAME_PREFIX + 'navigator';
// Instance hub
const instances = {};

function dispatchEventToInstance(event, targetOrigin) {
  var instance;
  for (var i in instances) {
    if (instances.hasOwnProperty(i)) {
      instance = instances[i];
      if (targetOrigin === '*' || targetOrigin === instance.origin) {
        event.target = instance.window;
        // FIXME: Need async?
        instance.window.dispatchEvent(event);
      }
    }
  }
}

function updateFinish(doc) {
  doc.taskCenter.send('dom', { action: 'updateFinish' }, []);
}

export function getInstance(instanceId) {
  const instance = instances[instanceId];
  if (!instance) {
    throw new Error(`Invalid instance id "${instanceId}"`);
  }
  return instance;
}

export function init(config) {
  Document = config.Document;
  Element = config.Element;
  Comment = config.Comment;
}

/**
 * register the name of each native component
 * @param  {array} components array of name
 */
export function registerComponents(components) {
  if (Array.isArray(components)) {
    components.forEach(function register(name) {
      /* istanbul ignore if */
      if (!name) {
        return;
      }
      if (typeof name === 'string') {
        NativeComponents[name] = true;
      } else if (typeof name === 'object' && typeof name.type === 'string') {
        NativeComponents[name.type] = name;
      }
    });
  }
}

/**
 * register the name and methods of each api
 * @param  {object} apis a object of apis
 */
export function registerMethods(apis) {
  // Noop
}

/**
 * register the name and methods of each module
 * @param  {object} modules a object of modules
 */
export function registerModules(newModules) {
  if (typeof newModules === 'object') {
    for (var name in newModules) {
      if (Object.prototype.hasOwnProperty.call(newModules, name)) {
        NativeModules[name] = newModules[name];
      }
    }
  }
}

function genBuiltinModules(modules, moduleFactories, context) {
  for (let moduleName in moduleFactories) {
    modules[moduleName] = {
      factory: moduleFactories[moduleName].bind(context),
      module: {exports: {}},
      isInitialized: false,
    };
  }
  return modules;
}

function genNativeModules(modules, document) {
  if (typeof NativeModules === 'object') {
    for (let name in NativeModules) {

      let moduleName = MODULE_NAME_PREFIX + name;
      modules[moduleName] = {
        module: {exports: {}},
        isInitialized: true,
      };

      NativeModules[name].forEach(method => {
        if (typeof method === 'string') {
          method = {
            name: method
          };
        }
        const methodName = method.name;

        modules[moduleName].module.exports[methodName] = (...args) => {
          // https://github.com/alibaba/weex/issues/1677
          return document.taskCenter.send('module', {
            module: name,
            method: methodName
          }, args);
        };
      });
    }
  }

  return modules;
}


/**
 * create a Weex instance
 *
 * @param  {string} instanceId
 * @param  {string} __weex_code__
 * @param  {object} [__weex_options__] {bundleUrl, debug}
 */
let requireMap = {};
let appModules = {};

let requireVersionMap = {};
let versionModules = {};

function genBuiltinAppModule(moduleFactories) {
    for (let moduleName in moduleFactories) {
      if(appModules[moduleName]) {
          return;
      }
      appModules[moduleName] = {
        factory: moduleFactories[moduleName],
        module: {exports: {}},
        isInitialized: false,
      };
    }
    return appModules;
}

function genSDKModule(moduleFactories, sdkVersion, context) {


    for (let moduleName in moduleFactories) {

        /*
      if(versionModules[sdkVersion][moduleName]) {
          return;
      }
      */

      //console.log('gening SDK Module:::' + moduleName + sdkVersion);
      versionModules[sdkVersion][moduleName] = {
        factory: moduleFactories[moduleName].bind(context),
        module: {exports: {}},
        isInitialized: false,
      };
    }
    return versionModules[sdkVersion];
}

export function createInstance(instanceId, __weex_code__, __weex_options__, __weex_data__, __weex_config__) {
  let instance = instances[instanceId];


  //===============================
  //增加app require的模块
  let appKey = __weex_options__['appKey'];
  let sdkVersion = __weex_options__['sdkVersion'] || '1.0.0';


  let appRequire = requireMap[appKey];
  let versionRequire =  requireVersionMap[sdkVersion];

  if(!appRequire) {
      appRequire =  require('./require.weex')(appModules);
      requireMap[appKey] = appRequire;
  }



  if(sdkVersion && !versionRequire) {
      versionModules[sdkVersion] = {};
      versionRequire = require('./require.weex')(versionModules[sdkVersion]);
      requireVersionMap[sdkVersion] =  versionRequire;
  }
  //================================


  if (instance == undefined) {
    // Mark start time
    const responseEnd = Date.now();
    const __weex_env__ = typeof WXEnvironment === 'object' && WXEnvironment || {};

    const Promise = require('fastpromise');

    // For better performance use built-in promise first

    const URL = require('runtime-shared/dist/url.function')();
    const URLSearchParams = require('runtime-shared/dist/url-search-params.function')();
    const FontFace = require('runtime-shared/dist/fontface.function')();
    const matchMedia = require('runtime-shared/dist/matchMedia.function')();


    const document = new Document(instanceId, __weex_options__.bundleUrl);

    const location = new URL(__weex_options__.bundleUrl);
    const modules = {};


    //Promise._setImmediateFn(function(fn){ fn() });

    instance = instances[instanceId] = {
      document,
      instanceId,
      modules,
      origin: location.origin,
      uid: 0
    };

    // Generate native modules map at instance init
    genNativeModules(modules, document);
    const __weex_define__ = require('./define.weex')(modules);
    // add appKey for special use.
    const __weex_require__ = require('./require.weex')(modules, appRequire, appModules, versionRequire, versionModules[sdkVersion]);
    const __weex_downgrade__ = require('./downgrade.weex')(__weex_require__);
    // Extend document
    require('./document.weex')(__weex_require__, document);

    const {
      fetch,
      Headers,
      Request,
      Response
    } = require('./fetch.weex')(__weex_require__, Promise);

    const {
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      requestAnimationFrame,
      cancelAnimationFrame
    } = require('./timer.weex')(__weex_require__);

    const {
      atob,
      btoa
    } = require('./base64.weex')();

    const performance = require('./performance.weex')(responseEnd);

    const windowEmitter = new EventEmitter();

    const window = {
      // ES
      Promise,
      // W3C: https://www.w3.org/TR/html5/browsers.html#browsing-context-name
      name: '',
      // This read-only property indicates whether the referenced window is closed or not.
      closed: false,
      atob,
      btoa,
      performance,
      // W3C
      document,
      location,
      // https://www.w3.org/TR/2009/WD-html5-20090423/browsers.html#dom-navigator
      navigator: {
        product: 'Weex',
        platform: __weex_env__.platform,
        appName: __weex_env__.appName,
        appVersion: __weex_env__.appVersion,
        // weexVersion: __weex_env__.weexVersion,
        // osVersion: __weex_env__.osVersion,
        // userAgent
      },
      // https://drafts.csswg.org/cssom-view/#the-screen-interface
      screen: {
        width: __weex_env__.deviceWidth,
        height: __weex_env__.deviceHeight,
        availWidth: __weex_env__.deviceWidth,
        availHeight: __weex_env__.deviceHeight,
        colorDepth: 24,
        pixelDepth: 24,
      },
      devicePixelRatio: __weex_env__.scale,
      fetch,
      Headers,
      Response,
      Request,
      URL,
      URLSearchParams,
      FontFace,
      matchMedia,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      requestAnimationFrame,
      cancelAnimationFrame,
      alert: (message) => {
        const modal = __weex_require__(MODAL_MODULE);
        modal.alert({
          message
        }, function() {});
      },
      open: (url) => {
        const weexNavigator = __weex_require__(NAVIGATOR_MODULE);
        weexNavigator.push({
          url,
          animated: 'true',
        }, function(e) {
          // noop
        });
      },
      postMessage: (message, targetOrigin) => {
        var event = {
          origin: location.origin,
          data: JSON.parse(JSON.stringify(message)),
          type: 'message',
          source: window, // FIXME: maybe not export window
        };
        dispatchEventToInstance(event, targetOrigin);
      },
      addEventListener: (type, listener) => {
        windowEmitter.on(type, listener);
      },
      removeEventListener: (type, listener) => {
        windowEmitter.off(type, listener);
      },
      dispatchEvent: (e) => {
        windowEmitter.emit(e.type, e);
      },
      // ModuleJS
      define: __weex_define__,
      require: __weex_require__,
      // Weex
      __weex_document__: document,
      __weex_define__,
      __weex_require__,
      __weex_downgrade__,
      __weex_env__,
      __weex_code__,
      __weex_options__,
      __weex_data__
    };

    instance.window = window.self = window.window = window;

    let builtinGlobals = {};
    let builtinModules = {};
    let builtInApps = {};
    try {
        builtinGlobals = __weex_config__.services.builtinGlobals;

        builtInApps =  __weex_config__.services.globalService;

        builtinModules = __weex_config__.services.moduleService;
    } catch (e) {}



    Object.assign(window, builtinGlobals);

    //const moduleFactories = {...ModuleFactories};
    const appModuleFac = {...builtInApps};
    const versionModulesFactories = {...ModuleFactories, ...builtinModules};



    genBuiltinModules(
      modules,
      versionModulesFactories,
      window
    );



    //genSDKModule(versionModulesFactories, sdkVersion, window)
    genBuiltinAppModule(appModuleFac);



    if (__weex_env__.platform !== 'Web') {
      let timing = performance.timing;
      timing.domLoading = Date.now();

      let init = new Function(
        'with(this){(function(){"use strict";\n' + __weex_code__ + '\n}).call(this)}'
      );

      init.call(
        // Context is window
        window,
      );

      timing.domInteractive = timing.domComplete = timing.domInteractive = Date.now();
    } else {
      let init = new Function(
        '"use strict";\n' + __weex_code__
      );

      init.call(
        window
      );
    }
  } else {
    throw new Error(`Instance id "${instanceId}" existed when create instance`);
  }
}

/**
 * refresh a Weex instance
 *
 * @param  {string} instanceId
 * @param  {object} data
 */
export function refreshInstance(instanceId, data) {
  let instance = getInstance(instanceId);
  let document = instance.document;
  document.documentElement.fireEvent('refresh', {
    timestamp: Date.now(),
    data,
  });
  document.taskCenter.send('dom', { action: 'refreshFinish' }, []);
}

/**
 * destroy a Weex instance
 * @param  {string} instanceId
 */
export function destroyInstance(instanceId) {
  let instance = getInstance(instanceId);
  instance.window.closed = true;
  let document = instance.document;
  document.documentElement.fireEvent('destory', {
    timestamp: Date.now()
  });

  if (document.destroy) {
    document.destroy();
  }

  if (document.taskCenter && document.taskCenter.destroyCallback) {
    document.taskCenter.destroyCallback();
  }

  delete instances[instanceId];
}

/**
 * get a whole element tree of an instance
 * for debugging
 * @param  {string} instanceId
 * @return {object} a virtual dom tree
 */
export function getRoot(instanceId) {
  let instance = getInstance(instanceId);
  let document = instance.document;
  return document.toJSON ? document.toJSON() : {};
}

function fireEvent(doc, ref, type, e, domChanges) {
  if (Array.isArray(ref)) {
    ref.some((ref) => {
      return fireEvent(doc, ref, type, e) !== false;
    });
    return;
  }

  const el = doc.getRef(ref);

  if (el) {
    const result = doc.fireEvent(el, type, e, domChanges);
    updateFinish(doc);
    return result;
  }

  return new Error(`Invalid element reference "${ref}"`);
}

/**
 * accept calls from native (event or callback)
 *
 * @param  {string} instanceId
 * @param  {array} tasks list with `method` and `args`
 */
export function receiveTasks(instanceId, tasks) {
  const instance = getInstance(instanceId);
  if (Array.isArray(tasks)) {
    const {document} = instance;
    const results = [];
    tasks.forEach(task => {
      let result;
      if (task.method === 'fireEvent') {
        let [nodeId, type, data, domChanges] = task.args;
        result = fireEvent(document, nodeId, type, data, domChanges);
      } else if (task.method === 'callback') {
        let [uid, data, ifKeepAlive] = task.args;
        result = document.taskCenter.callback(uid, data, ifKeepAlive);
        updateFinish(document);
      }
      results.push(result);
    });
    return results;
  }
}

// FIXME: Hack for rollup build "import Rax from 'weex-rax-framework'", in rollup if `module.exports` has `__esModule` key must return by export default
export default exports;
