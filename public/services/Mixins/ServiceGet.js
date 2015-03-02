'use strict';

/**
  * Provides convenience methods for working with Wunderlist API endpoints.
  * @module services/Mixin/ServiceGet
  * @requires module:wunderbits/WBMixin
  * @extends module:wunderbits/WBMixin
  */

var core = require('wunderbits.core');
var WBMixin = core.WBMixin;

module.exports = WBMixin.extend({

  /**
    * Performs a GET using the id as part of the URI
    * @param {number} id - the id being fetched
    * @param {string} [requestID] - Client supplied request ID
    */
  'getID': function (id, requestID) {

    var self = this;
    return self.get(self.baseUrl + '/' + id, undefined, requestID);
  },

  /**
    * Performs a GET using an arbitrary attribute and its id as params (?attribute=id)
    * @param {string} url
    * @param {string} attribute - the attribute
    * @param {number|string} value - the attribute value
    * @param {string} [requestID] - Client supplied request ID
    */
  'getItemsForAttribute': function (url, attribute, value, requestID) {

    var self = this;
    var data = {};

    data[attribute] = value;

    return self.get(url, data, requestID).promise();
  },

  /**
    * Performs a GET for a user ID on the resource.
    * @param {number} userId - The user id.
    * @param {string} [requestID] - Client supplied request ID
    */
  'forUser': function (userId, requestID) {

    var self = this;
    return self.getItemsForAttribute(self.baseUrl, 'user_id', userId, requestID);
  },

  /**
    * Performs a GET for a task ID on the resource.
    * @param {number} taskId - The task ID.
    * @param {string} [requestID] - Client supplied request ID
    */
  'forTask': function (taskId, requestID) {

    var self = this;
    return self.getItemsForAttribute(self.baseUrl, 'task_id', taskId, requestID);
  },

  /**
    * Performs a GET for a list ID on the resource.
    * @param {number} listId - The list ID.
    * @param {string} [requestID] - Client supplied request ID
    */
  'forList': function (listId, requestID) {

    var self = this;
    return self.getItemsForAttribute(self.baseUrl, 'list_id', listId, requestID);
  },

  /**
    * Perform a GET for all data for a resource without any params.
    * @param {string} [requestID] - Client supplied request ID
    */
  'all': function (requestID) {

    var self = this;
    return self.get(self.baseUrl, undefined, requestID).promise();
  },

  /**
    * Perform a GET for all data for a resource for all lists
    * @param {string} [requestID] - Client supplied request ID
    */
  'forAllLists': function (requestID) {

    var self = this;
    return self.get(self.baseUrl + '/lists', undefined, requestID);
  },

  /**
    * Perform a GET for all data for a resource for all tasks scoped to a list id
    * @param {number} listId - The list ID.
    * @param {string} [requestID] - Client supplied request ID
    */
  'forAllTasksForList': function (listId, requestID) {

    var self = this;
    return self.getItemsForAttribute(self.baseUrl + '/tasks', 'list_id', listId, requestID);
  }
});
