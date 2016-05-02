var tinder = require('tinder')
var client = new tinder.TinderClient()
var remote = require('remote')

// if a token returned from tinder is in localstorage, set that token and skip auth
if (localStorage.tinderToken) {
  client.setAuthToken(localStorage.tinderToken)
}

module.exports = require('angular')
  .module('api', [])
  .factory('API', API)
  .name

function API ($q, $location) {
  var likesRemaining = null;
  var apiObj = {};

  var handleError = function (err, callbackFn) {
    console.log('ERROR!!!!')
    console.log(err)

    // Tinder API token is not valid.
    if (err.status === 401 && localStorage.getItem('fbTokenExpiresAt') != null) {
      if(Date.parse(localStorage.fbTokenExpiresAt) > new Date()) {
        // Facebook token is still good. Get a new Tinder token.
        apiObj.login(localStorage.fbUserId, localStorage.fbToken);
      } else {
        // Facebook token expired. Get a new Facebook token.
        $location.path('/login');
      }
    } else {
      // Something's gone horribly wrong. Log the user out.
      apiObj.logout();
    }
    (callbackFn || angular.noop)(err);
  };

  apiObj.getHistory = function () {
    return $q(function (resolve, reject) {
      client.getHistory(function(err, res, data) {
        if (!!err) {
          handleError(err, reject);
          return;
        }
        // console.log(JSON.stringify(res));
        resolve(res);
      });
    });
  };

  apiObj.logout = function () {
    var win = remote.getCurrentWindow();

    // Retain settings on logout.
    var removeArr = [];
    for (var i = 0; i < localStorage.length; i++){
      if (localStorage.key(i) != 'settings') {
        removeArr.push(localStorage.key(i));
      }
    }

    for (var i = 0; i < removeArr.length; i++) {
      localStorage.removeItem(removeArr[i]);
    }

    // Clear cache and cookies.
    win.webContents.session.clearCache(function(){
      win.webContents.session.clearStorageData({storages: ["cookies"]}, function(){
        win.webContents.reloadIgnoringCache();
      });
    });
  };

  apiObj.login = function (id, token) {
    client.authorize(token, id, function(err, res, data) {
      if (!!err) {
        handleError(err);
        return;
      }
      // console.log(JSON.stringify(res));
      localStorage.tinderToken = client.getAuthToken();
      localStorage.name = res.user.full_name;
      localStorage.userId = res.user._id;
      if (window.loginWindow) {
        window.loginWindow.close(true);
      }
      window.location.reload();
    });
  };

  apiObj.userInfo = function (userId) {
    return $q(function (resolve, reject) {
      client.getUser(userId, function(err, res, data) {
        if (!!err) {
          handleError(err, reject)
          return
        }
        if (res === null) {
          handleError('userInfo result is null', reject)
          return
        }
        // console.log(JSON.stringify(res));
        resolve(res.results)
      });
    });
  };

  apiObj.getAccount = function () {
    return $q(function (resolve, reject) {
      client.getAccount(function(err, res, data) {
        if (!!err) {
          handleError(err, reject)
          return
        }
        if (res === null) {
          handleError('userInfo result is null', reject)
          return
        }

        resolve(res)
      });
    });
  };

  apiObj.sendMessage = function (matchId, message) {
    return $q(function (resolve, reject) {
      client.sendMessage(matchId, message, function(err, res, data) {
        if (!!err) {
          handleError(err, reject)
          return
        }
        // console.log(JSON.stringify(res));
        resolve(res)
      });
    });
  };

  apiObj.unmatch = function (matchId, message) {
    return $q(function (resolve, reject) {
      client.unmatch(matchId, function(err, res, data) {
        if (!!err) {
          handleError(err, reject)
          return
        }
        console.log(JSON.stringify(res))
        resolve(res)
      });
    });
  };


  apiObj.getUpdates = function () {
    return $q(function (resolve, reject) {
      client.getUpdates(function(err, res, data) {
        if (!!err) {
          handleError(err, reject)
          return
        }
        resolve(res)
      })
    })
  }

  apiObj.getLastActivity = function () {
    return client.lastActivity
  }

  apiObj.setLastActivity = function(activityDate) {
    client.lastActivity = activityDate
  }

  return apiObj;
}
