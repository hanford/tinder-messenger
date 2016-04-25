module.exports = require('angular')
  .module('messages', [
    require('angular-sanitize'),
    require('./api'),
    require('angular-image-reveal')
  ])
  .controller('MessagesController', MessagesController)
  .directive('shortTimeAgo', shortTimeAgo)
  .directive('scrollToLast', scrollToLast)
  .filter('orderObjectBy', orderObjectBy)
  .name

function MessagesController ($scope, API) {
  $scope.conversations = API.conversations
  $scope.conversationCount = Object.keys($scope.conversations).length
  var ENTER = 13

  $scope.open = function(matchId) {
    $scope.currentMatch = matchId
    $scope.conversation = $scope.conversations[matchId];
    API.userInfo($scope.conversations[matchId].userId).then(function (user) {
      $scope.user = user
      console.log(user)
      $scope.selectedPhoto = user.photos[0].url
    })
  };

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
      var lastMessage = match.messages[match.messages.length - 1];
      if (lastMessage.fromMe) {
        if (moment(match.userPingTime).isAfter(lastMessage.sentDate)) {
          return 'last-me-pass';
        } else {
          return 'last-me-rest';
        }
      } else {
        return 'last-them';
      }
    }
    return '';
  };

  $scope.keypress = function(event) {
    if (event.which == ENTER) {
      event.preventDefault();
      if ($scope.message.length > 0) {
        API.sendMessage($scope.conversation.matchId, $scope.message);
        // Show pending message
        $scope.conversation.pending = $scope.conversation.pending || [];
        $scope.conversation.pending.push($scope.message);
        // Reset
        $scope.message = '';
      }
    }
  };
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
      var minutes = moment().diff(scope.shortTimeAgo, 'minutes');
      minutes = isNaN(minutes) ? 0 : minutes;
      element.text(minutesToShortTime(minutes));
    }

    stopTime = $interval(refreshTime, 30000);
    observeFn = attrs.$observe('shortTimeAgo', refreshTime);

    element.on('$destroy', function() {
      $interval.cancel(stopTime);
      observeFn();
    });
  }

  function minutesToShortTime (minutes) {
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(minutes / 1440);
    if (minutes < 60)
      return minutes + 'm';
    else if (hours < 24)
      return hours + 'h';
    return days + 'd';
  }
}

function scrollToLast () {
  return function(scope, element, attrs) {
    if(scope.$last) {
      // console.log("Scrolling", scope);
      setTimeout(function(){
        angular.element(element)[0].scrollIntoView();
      });
    }
  }
}
