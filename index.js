var request = require('request');
var cheerio = require('cheerio');

var steamDomain = 'https://steamcommunity.com';

module.exports = function getAPIKey (options, callback) {
  var cookieJar = request.jar();
  var _request = request.defaults({ jar: cookieJar });

  options.webCookie.forEach(function (name) {
    cookieJar.setCookie(request.cookie(name), steamDomain);
  });

  _request.get({
    uri: steamDomain + '/dev/apikey'
  }, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      return callback(error || new Error(response.statusCode));
    }

    var $ = cheerio.load(body);

    if ($('#mainContents h2').text() === 'Access Denied') {
      return callback(new Error('Access Denied'));
    }

    if ($('#bodyContents_ex h2').text() === 'Your Steam Web API Key') {
      var key = $('#bodyContents_ex p')
        .eq(0)
        .text()
        .split(' ')[1];
      return callback(null, key);
    }

    _request.post({
      uri: steamDomain + '/dev/registerkey',
      form: {
        domain: options.domain || 'localhost',
        agreeToTerms: 'agreed',
        sessionid: options.sessionID,
        submit: 'Register'
      }
    }, function () {
      getAPIKey(options, callback);
    });
  });
};
