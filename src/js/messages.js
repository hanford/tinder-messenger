var moment = require('moment')

module.exports = require('angular')
  .module('messages', [
    require('angular-sanitize'),
    require('./api'),
    require('./controls'),
  ])
  .controller('MessagesController', ['$scope', 'API', MessagesController])
  .directive('shortTimeAgo', shortTimeAgo)
  .directive('scrollToLast', scrollToLast)
  .filter('orderObjectBy', orderObjectBy)
  .name

function MessagesController ($scope, API) {
  $scope.loading = true
  $scope.conversations = API.conversations

  $scope.$watch('conversations', function (nv, ov) {
    if (Object.keys(nv).length !== 0) {
      $scope.loading = false
      $scope.conversationCount = Object.keys(nv).length
    }
  }, true)

  $scope.open = function(matchId) {
    $scope.currentMatch = matchId
    $scope.conversation = $scope.conversations[matchId]
    API.userInfo($scope.conversations[matchId].userId).then(function (user) {
      $scope.user = user
      $scope.user.age = moment(user.birth_date)
        .fromNow()
        .replace('ago', 'old')

      console.log(user)
      $scope.selectedPhoto = user.photos[0].url
    })
  }

  $scope.formatDegree = function (degree) {
    if (degree === 3) {
      return '(3rd degree)'
    } else if (degree === 2) {
      return '(2nd degree)'
    } else if (degree === 1) {
      return '(1st degree)'
    }
  }

  $scope.instagramSelect = function (url) {
    $scope.selectedPhoto = url
  }

  $scope.logout = function() {
    API.logout()
  }

  $scope.unmatch = function(conversation){
    var confirm = window.confirm('Unmatch with ' + conversation.name + '?')
    if (confirm) {
      return API.unmatch(conversation.matchId)
    }
  }

  $scope.changePhoto = function (index) {
    $scope.selectedPhoto = $scope.user.photos[index].url
  }

  $scope.lastMessageClass = function (match) {
    if (match.messages.length) {
      var lastMessage = match.messages[match.messages.length - 1]
      if (lastMessage.fromMe) {
        if (moment(match.userPingTime).isAfter(lastMessage.sentDate)) {
          return 'last-me-pass'
        } else {
          return 'last-me-rest'
        }
      } else {
        return 'last-them'
      }
    }
    return ''
  }

  $scope.keypress = function (event, message) {
    if (event.which == 13) {
      event.preventDefault()
      if (message.length > 0) {
        API.sendMessage($scope.conversation.matchId, message)

        // Show pending $scope.message
        $scope.conversation.pending = $scope.conversation.pending || []
        $scope.conversation.pending.push(message)

        // Reset
        $scope.message = ''
      }
    }
  }
}

function orderObjectBy () {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    })

    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    })

    if (reverse) {
      filtered.reverse()
    }

    return filtered;
  }
}

function shortTimeAgo ($interval) {
  return {
    restrict: 'A',
    scope: {
      shortTimeAgo: '@'
    },
    link: linkFn
  };

  function linkFn (scope, element, attrs) {
    var stopTime, observeFn;

    function refreshTime() {
      var minutes = moment().diff(scope.shortTimeAgo, 'minutes')
      minutes = isNaN(minutes) ? 0 : minutes
      element.text(minutesToShortTime(minutes))
    }

    stopTime = $interval(refreshTime, 30000)
    observeFn = attrs.$observe('shortTimeAgo', refreshTime);

    element.on('$destroy', function() {
      $interval.cancel(stopTime)
      observeFn();
    });
  }

  function minutesToShortTime (minutes) {
    var hours = Math.floor(minutes / 60)
    var days = Math.floor(minutes / 1440)
    if (minutes < 60)
      return minutes + 'm';
    else if (hours < 24)
      return hours + 'h';
    return days + 'd';
  }
}

function scrollToLast () {
  return function (scope, element, attrs) {
    if(scope.$last) {
      setTimeout(function () {
        angular.element(element)[0].scrollIntoView()
      })
    }
  }
}
