(function (global) {

  'use strict';

  var wunderlistSDK;
  var $lists, $tasks, $details;

  // When document loaded
  $(function () {

    $lists = $('.stack.lists');
    $tasks = $('.stack.tasks');
    $details = $('.stack.details');

    var SDK = global.wunderlist.sdk;
    wunderlistSDK = new SDK({

      'accessToken': global.underlistConfig.authToken,
      'clientID': global.underlistConfig.clientID
    });

    wunderlistSDK.initialized.then(start);
  });

  function start () {

    loadLists();
  }

  function loadLists () {

    wunderlistSDK.http.lists.all().done(displayLists);
  }

  function loadTasks (listID) {

    wunderlistSDK.http.tasks.forList(listID).done(displayTasks);
  }

  function loadTaskDetails (taskID) {

    wunderlistSDK.http.tasks.getID(taskID).done(displayTaskDetails);
  }

  function displayLists (listData) {

    var $ul = $lists.find('ul');
    var frag = document.createDocumentFragment();
    listData.forEach(function (list) {

      var $li = $('<li><a rel="' + list.id + '" href="#list-' + list.id +'">' + list.title + '</a></li>');
      frag.appendChild($li[0]);
    });
    $ul.html(frag);
    bindToLists();
  }

  function displayTasks (taskData) {

    var $ul = $tasks.find('ul');
    var frag = document.createDocumentFragment();
    taskData.forEach(function (task) {

      var $li = $('<li><a rel="' + task.id + '" href="#task-' + task.id+ ' ">' + task.title + '</a></li>');
      frag.appendChild($li[0]);
    });
    $ul.html(frag);
    bindToTasks();
  }

  function displayTaskDetails (details) {

    console.log(details);

    var $table = $details.find('table');
    var frag = document.createDocumentFragment();

    var tr, key, value;
    for (var attribute in details) {

      tr = document.createElement('tr');
      key = document.createElement('td');
      key.textContent = attribute;
      value = document.createElement('td');
      value.textContent = details[attribute];

      tr.appendChild(key);
      tr.appendChild(value);

      frag.appendChild(tr);
    }
    $table.html(frag);
  }

  function bindToLists () {

    $lists.find('a').on('click', function (ev) {

      var listID = $(ev.currentTarget).attr('rel');
      listID && loadTasks(listID);
    });
  }

  function bindToTasks () {

    $tasks.find('a').on('click', function (ev) {

      var taskID = $(ev.currentTarget).attr('rel');
      taskID && loadTaskDetails(taskID);
    });
  }
})(this);