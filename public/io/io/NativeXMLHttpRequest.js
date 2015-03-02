'use strict';

/**
  * Returns browser XMLHttpRequest reference, or node.js xmlhttprequest reference
  * @module io/io/NativeXMLHttpRequest
  */

module.exports = global.XMLHttpRequest || require('xmlhttprequest').XMLHttpRequest;
