require('angular')
  .module('tinder-messenger', [
    require('angular-route'),
    require('angular-image-reveal'),
    require('./login'),
    require('./messages'),
    require('./controls')
  ])
    .config(function($routeProvider) {
        $routeProvider.when('/login', {
          templateUrl: 'templates/login.html',
          controller: 'LoginController'
        })

        $routeProvider.when('/messages', {
          templateUrl: 'templates/messages.html',
          controller: 'MessagesController'
        })

    })
    .run(function($location, Controls) {
      $location.path(localStorage.tinderToken ? '/messages' : '/login')
      Controls.init()
    })
