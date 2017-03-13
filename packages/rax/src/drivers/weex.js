/**
 * Weex driver
 **/
import Host from '../vdom/host';
import setNativeProps from '../setNativeProps';
import {convertUnit, setRem} from '../style/unit';

const STYLE = 'style';
const ID = 'id';
const TEXT = 'text';
const FULL_WIDTH_REM = 750;
const nodeMaps = {};
/* global __weex_document__ */
const document = typeof __weex_document__ === 'object' ?
  __weex_document__ : typeof document === 'object' ?
    document : null;

const Driver = {
  getElementById(id) {
    return nodeMaps[id];
  },

  getParentNode(node) {
    return node.parentNode;
  },

  createBody() {
    if (document.body) {
      return document.body;
    }

    let documentElement = document.documentElement;
    let body = document.createBody();
    documentElement.appendChild(body);

    return body;
  },

  createComment(content) {
    return document.createComment(content);
  },

  createEmpty() {
    return this.createComment(' empty ');
  },

  createText(text) {
    return Driver.createElement({
      type: TEXT,
      props: {
        value: text,
      }
    });
  },

  updateText(node, content) {
    this.setAttribute(node, 'value', content);
  },

  createElement(component) {
    let props = component.props;
    let events = [];
    let style = {};
    let originStyle = props[STYLE];
    for (let prop in originStyle) {
      style[prop] = convertUnit(originStyle[prop], prop);
    }

    let node = document.createElement(component.type, {
      style,
    });

    setNativeProps(node, props, true);

    return node;
  },

  appendChild(node, parent) {
    return parent.appendChild(node);
  },

  removeChild(node, parent) {
    parent = parent || node.parentNode;
    let id = node.attr && node.attr[ID];
    if (id != null) {
      nodeMaps[id] = null;
    }
    return parent.removeChild(node);
  },

  replaceChild(newChild, oldChild, parent) {
    parent = parent || oldChild.parentNode;
    let previousSibling = oldChild.previousSibling;
    let nextSibling = oldChild.nextSibling;
    this.removeChild(oldChild, parent);

    if (previousSibling) {
      this.insertAfter(newChild, previousSibling, parent);
    } else if (nextSibling) {
      this.insertBefore(newChild, nextSibling, parent);
    } else {
      this.appendChild(newChild, parent);
    }
  },

  insertAfter(node, after, parent) {
    parent = parent || after.parentNode;
    return parent.insertAfter(node, after);
  },

  insertBefore(node, before, parent) {
    parent = parent || before.parentNode;
    return parent.insertBefore(node, before);
  },

  addEventListener(node, eventName, eventHandler) {
    return node.addEvent(eventName, eventHandler);
  },

  removeEventListener(node, eventName, eventHandler) {
    return node.removeEvent(eventName, eventHandler);
  },

  removeAllEventListeners(node) {
    // Noop
  },

  removeAttribute(node, propKey, propValue) {
    if (propKey == ID) {
      nodeMaps[propValue] = null;
    }
    // Weex native will crash when pass null value
    return node.setAttr(propKey, undefined, false);
  },

  setAttribute(node, propKey, propValue) {
    if (propKey == ID) {
      nodeMaps[propValue] = node;
    }

    return node.setAttr(propKey, propValue, false);
  },

  setStyles(node, styles) {
    // TODO if more then one style update, call setStyles will be better performance
    for (let key in styles) {
      let val = styles[key];
      val = convertUnit(val, key);
      node.setStyle(key, val);
    }
  },

  beforeRender() {
    // Turn off batched updates
    document.open();

    // Init rem unit
    setRem(this.getWindowWidth() / FULL_WIDTH_REM);
  },

  afterRender() {
    if (document.listener && document.listener.createFinish) {
      document.listener.createFinish();
    }

    // Turn on batched updates
    document.close();
  },

  getWindowWidth() {
    return FULL_WIDTH_REM;
  },
};

export default Driver;
