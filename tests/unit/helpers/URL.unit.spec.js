describe('helpers/URL Unit', function () {

  'use strict';

  var URLHelper = require('helpers/URL');

  describe('#generateURI', function () {

    it('it should generate a URI using a URL + params', function () {

      var host = 'http://www.example.com/path';
      var params = {
        'foo': 'bar',
        'bar': 'foo'
      };

      var uri = URLHelper.generateURI(host, params);
      expect(uri).to.equal('http://www.example.com/path?foo=bar&bar=foo');
    });
  });
});