angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope, $interval,$ionicPopup ) {
  $scope.data = {
    listFile : []
  }
  $scope.file = '';
  $scope.time = 0;

  $scope.settings = {
    enableFriends: true
  };

  $scope.record = function(){
    $scope.myInterval = undefined;

    $scope.isRecording = 1;
    window.plugins.audioRecorderAPI.record(function(msg) {
      // complete
      $scope.file = msg;
      $scope.recordSuccess();
    }, function(msg) {
      // failed
      $scope.recordError();
    }, 30);

    $scope.myInterval = $interval(function(){
      $scope.time++;
    }, 1000);
  }

  $scope.stop = function(){
    window.plugins.audioRecorderAPI.stop(function(msg) {
      // success
      $scope.file = msg;
      $scope.recordSuccess();
    }, function(msg) {
      // failed
      $scope.recordError();
    });
  }

  $scope.recordSuccess = function(){
    $scope.isRecording = 0;
    $scope.time = 0;
    $interval.cancel($scope.myInterval);
    $scope.myInterval = undefined;
    var myPopup = $ionicPopup.show({
      title: 'Confirm',
      subTitle: 'Kirim ap egk',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Send</b>',
          type: 'button-positive',
          onTap: function(e) {
            $scope.data.listFile.push($scope.file);
          }
        }
      ]
    });
  }

  $scope.recordError = function(){
    $scope.isRecording = 0;
    $scope.time = 0;
    $interval.cancel($scope.myInterval);
    $scope.myInterval = undefined;
    $scope.$apply();
  }

  $scope.toMMSS = function (param) {
    var sec_num = parseInt(param, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = minutes+':'+seconds;
    return time;
  }
})
// Chat audio player
.directive('cap', function($interval) {
  var file = '';
  return {
    restrict: 'E',
    scope: true,
    controller: function ($scope) {
      $scope.file = '';
      $scope.media = '';
      $scope.position = 0;
      $scope.maxDuration = 0;
      $scope.intervalPosition = null;
      $scope.isRunning = false;

      this.play = function () { 
        console.log("play musik : "+$scope.file);
        $scope.media.play();
      };
      this.pause = function () { 
        console.log("pause musik : "+$scope.file);
        $scope.media.pause();
      };
      this.update = function (val) { 
        console.log("set musik : "+val);
        $scope.media.play();
        $scope.media.pause();
        $scope.media.seekTo(val * 100);
      };
    },
    link: function($scope, elem, attrs) {
      console.log(attrs);
      $scope.file = attrs.file;    

      $scope.media = new Media($scope.file,undefined,undefined,function(status){
        console.log("change status : ");
        console.log(status);
        if(status == Media.MEDIA_RUNNING){
          $scope.isRunning = true;
          console.log($scope.intervalPosition);
          if($scope.intervalPosition !== null){
            $interval.cancel($scope.intervalPosition);
          }
          $scope.intervalPosition = $interval(function() {
            $scope.media.getCurrentPosition(
              // success callback
              function (position) {
                  if (position > -1 || position !== -0.001) {
                    $scope.position = position * 10;
                    console.log("position : "+position);
                  }
              },
              // error callback
              function (e) {
                  console.log("Error getting pos=" + e);
              }
            );
          }, 100);
        }

        if(status == Media.MEDIA_PAUSED || status == Media.MEDIA_STOPPED){
          $scope.isRunning = false;
          console.log($scope.intervalPosition);
          $interval.cancel($scope.intervalPosition);
          console.log($scope.intervalPosition);
        }
        $scope.$apply();
      });

      /* load datae aneh */
      $scope.media.setVolume(0);
      $scope.media.play();
      $scope.media.stop();
      $scope.media.setVolume(1);
      $scope.media.seekTo(0);

      // Get duration
      var counter = 0;
      var timerDur = setInterval(function() {
        counter = counter + 100;
        if (counter > 2000) {
          clearInterval(timerDur);
        }
        var dur = $scope.media.getDuration();
        if (dur > 0) {
          clearInterval(timerDur);
          $scope.maxDuration = dur * 10;
          $scope.$apply();
          console.log( (dur) + " sec" );
        }
      }, 100);
    }
  };
})
.directive('capButtonPlay', function($compile) {
  return {
    restrict: 'A',
    require: '^cap',
    scope: true,
    compile: function(element, attrs) {
      element.attr('ng-show', '!isRunning');
      element.removeAttr("cap-button-play");

      return {
        pre: function(scope, iElement, iAttrs, controller) { },
        post: function(scope, iElement, iAttrs, capCtrl) { 
          scope.position = 0;
          iElement.bind('click', function() {
            capCtrl.play();
          });
          $compile(iElement)(scope);
        }
      }
    }
  };
})
.directive('capButtonPause', function($compile) {
  return {
    restrict: 'A',
    require: '^cap',
    scope: true,
    compile: function(element, attrs) {
      element.attr('ng-show', 'isRunning');
      element.removeAttr("cap-button-pause");

      return {
        pre: function(scope, iElement, iAttrs, controller) { },
        post: function(scope, iElement, iAttrs, capCtrl) { 
          iElement.bind('click', function() {
            capCtrl.pause();
          });
          $compile(iElement)(scope);
        }
      }
    }
  };
})
.directive('capInputProgress', function($compile) {
  return {
    restrict: 'A',
    require: '^cap',
    // scope: true,
    compile: function(element, attrs) {
      element.attr('ng-model', 'position');
      element.removeAttr("cap-input-progress");
      return {
        pre: function(scope, iElement, iAttrs, controller) { },
        post: function(scope, iElement, iAttrs, capCtrl) { 
          iElement.bind('change', function() {
            capCtrl.update(iElement[0].value);
          });
          scope.$watch('maxDuration', function() {  
            iElement.attr("max", parseInt(scope.maxDuration, 10));
          });

          $compile(iElement)(scope);
        }
      }
    }
  };
});