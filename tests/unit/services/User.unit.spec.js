describe('services/User Unit', function () {

  'use strict';

  var core = require('wunderbits.core');
  var WBDeferred = core.WBDeferred;

  var UserClass = require('services/User');

  var ApplicationState = require('models/ApplicationState');
  var config = require('../../config');

  var user, appState, options;
  beforeEach(function () {

    appState = new ApplicationState(config);

    options = {
      'appState': appState
    };

    appState.set({
      'clientID': 'abc',
      'accessToken': 'efg'
    });

    user = new UserClass(options);
  });

  describe('#changeEmail', function () {

    it ('should patch correct url with correct data for changing email', function () {

      user.patch = sinon.stub().returns(new WBDeferred());

      var email = 'foo@bar.net';
      var password = '123';
      var requestID = '12039812l3k1j';

      user.changeEmail(email, password, requestID);

      expect(user.patch).to.have.been.calledOnce;
      var args = user.patch.firstCall.args;
      expect(args[0]).to.equal(user.baseUrl + '/email');
      expect(args[1].email).to.equal(email);
      expect(args[1].password).to.equal(password);
      expect(args[2]).to.equal(requestID);
    });
  });

  describe('#changePassword', function () {

    it ('should patch correct url with correct data for changing password', function () {

      user.patch = sinon.stub().returns(new WBDeferred());

      var newPassword = '123';
      var oldPassword = '456';
      var requestID = '12039812l3k1j';

      user.changePassword(newPassword, oldPassword, requestID);

      expect(user.patch).to.have.been.calledOnce;
      var args = user.patch.firstCall.args;
      expect(args[0]).to.equal(user.baseUrl + '/password');
      expect(args[1].password).to.equal(newPassword);
      expect(args[1].old_password).to.equal(oldPassword);
      expect(args[2]).to.equal(requestID);
    });
  });

  describe('#deleteSelf', function () {

    it ('should send delete to correct url with correct params for deleting account', function () {

      user['delete'] = sinon.stub().returns(new WBDeferred());

      var password = '123';
      var requestID = '12039812l3k1j';

      user.deleteSelf(password, requestID);

      expect(user['delete']).to.have.been.calledOnce;
      var args = user['delete'].firstCall.args;
      expect(args[0]).to.equal(user.baseUrl);
      expect(args[1].password).to.equal(password);
      expect(args[2]).to.equal(requestID);
    });
  });
});