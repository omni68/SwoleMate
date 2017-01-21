// Ionic Starter App
angular.module('starter', ['ionic','ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    // $cordovaOauth.google("285481032439-s1fpp699l4g8guk80orekrq16p2p085a.apps.googleusercontent.com", ["https://www.googleapis.com/auth/userinfo.profile"]).then(function(result) {
    //         // results
    //         console.log('success:',result);
    //     }, function(error) {
    //         // error
    //         console.log('error:',error);
    //     });
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('profile', {
      url: "/profile",
      templateUrl: "templates/profile.html",
      controller: 'ProfileCtrl'
    })
    .state('basicInfo', {
      url: "/basicInfo",
      templateUrl: "templates/basicInfo.html",
      controller: 'BasicInfoCtrl'
    })
    .state('login', {
      url: "/login",
      templateUrl: "templates/login.html",
      controller: 'LoginCtrl'
    })
    .state('gym', {
      url: "/gym",
      templateUrl: "templates/gym.html",
      controller: 'GymCtrl'
    })
    .state('workouts', {
      url: "/workouts",
      templateUrl: "templates/workouts.html",
      controller: 'WorkoutsCtrl'
    })
    .state('schedule', {
      url: "/schedule",
      templateUrl: "templates/schedule.html",
      controller: 'ScheduleCtrl'
    })
    .state('matching', {
      url: "/",
      templateUrl: "templates/matching.html",
      controller: 'MatchingCtrl'
    })
    .state('profileImage', {
      url: "/profile-image",
      templateUrl: "templates/profile-image.html",
      controller: 'ProfileImageCtrl'
    });


   $urlRouterProvider.otherwise("/");

})
.factory('ProfileSvc', function($http,$cordovaFile){
  var profile = {
      profile: {},
      staticData: {
          types: [],
          schedules: []
      },
      getAllProfiles: getAllProfiles,
      saveProfile: saveProfile
  };

  function saveProfile(){
    var profiles = getAllProfiles();
    if(profile.profile.id){
        // find it and update it
        for(var i in profiles){
            if(profiles[i].id == profile.profile.id){
                angular.extend(profiles[i], profile.profile);
                break;
            }
        }
    }
    else {
        // add a new one
        var id = Math.max.apply(Math, profiles.map(function(o){return o.id;}));
        profile.profile.id = id + 1;
        profiles.push(profile.profile);
    } 
    window.localStorage.setItem('profiles', angular.toJson(profiles));
  }

  function getAllWorkoutTypes(){
    return angular.fromJson(window.localStorage.getItem('types')); //$http.get('/types.json');
  }
  function getAllWorkoutSchedules(){
    return angular.fromJson(window.localStorage.getItem('schedules')); //$http.get('/schedules.json');
  }
  function getAllProfiles(){
    return angular.fromJson(window.localStorage.getItem('profiles')); //$http.get('/profiles.json');
  }
  function setWorkoutTypes(result){
    //if(result.status == 200){
      profile.staticData.types = result;
    // }
    // else {
    //   console.log('error');
    // }
  }
  function setWorkoutSchedules(result){
    //if(result.status == 200){
      profile.staticData.schedules = result;
    // }
    // else {
    //   console.log('error');
    // }
  }

  //getAllWorkoutTypes().then(setWorkoutTypes);
  //getAllWorkoutSchedules().then(setWorkoutSchedules);

  var types = getAllWorkoutTypes();
  setWorkoutTypes(types);
  var schedules = getAllWorkoutSchedules();
  setWorkoutSchedules(schedules);

  return profile;
})
.controller('BasicInfoCtrl', function($scope, ProfileSvc) {
  $scope.profile = ProfileSvc.profile;
  $scope.setGender = function(gender) {
      if($scope.profile.gender && $scope.profile.gender == gender){
        $scope.profile.gender = null;
      }
      else {
        $scope.profile.gender = gender;
      }
  };
  $scope.hasProfile = ProfileSvc.hasProfile;
})
.controller('LoginCtrl', function($scope, $cordovaOauth, $location) {
  $scope.facebookLogin = function() {
        $cordovaOauth.facebook("646181242148278", ["email"]).then(function(result) {
            $scope.message = 'fb token: ' + result.access_token;
            $location.path('/basicInfo');
        }, function(error) {
            // error
            $scope.message = 'fb auth error: ' + error;
        });
    }
})
.controller('GymCtrl', function($scope, ProfileSvc, $ionicPlatform, $cordovaGeolocation, $timeout, $ionicPopup) {
  $scope.search = {};
  $scope.profile = ProfileSvc.profile;

  $scope.getGyms = getGyms;
  $scope.initializeMap = initializeMap;
  $scope.callback = callback;
  $scope.addRemoveGym = function(gym){
    if($scope.isGymAdded(gym)){
      $scope.removeGym(gym);
    }
    else {
      $scope.addGym(gym);
    }
  };
  $scope.addGym = function(gym){
    if(!angular.isArray($scope.profile.gyms)){
      $scope.profile.gyms = [];
    }
    $scope.profile.gyms.push(gym);
  };
  $scope.removeGym = function(gym){
    angular.forEach($scope.profile.gyms, function(gymX, i){
        if(gymX.id == gym.id){
          $scope.profile.gyms.splice(i, 1);
        }
    });
  };
  $scope.isGymAdded = function(gym){
    var isGymAdded = false;
    for(var i in $scope.profile.gyms){
      if($scope.profile.gyms[i].id == gym.id){
         isGymAdded = true;
         break;
      }
    }
    return isGymAdded;
  };

  function getGyms(searchCriteria){
    if($scope.searchTimer) {
      $timeout.cancel($scope.searchTimer);
    }
    $scope.searchTimer = $timeout(function(){
      if(searchCriteria && searchCriteria.length >= 5){
        $ionicPlatform.ready(function() {
          var posOptions = {timeout: 5000, enableHighAccuracy: true};
          $cordovaGeolocation
            .getCurrentPosition(posOptions)
            .then(function (position) {
              var lat  = position.coords.latitude
              var long = position.coords.longitude
              $scope.initializeMap(lat, long, searchCriteria);
            }, function(err) {
              // error
              $ionicPopup.alert({
                 title: 'Geolocation error',
                 template: 'Please make sure location services are enabled for this app'
               });
            });
        });
      }
    }, 600);
  }

  function initializeMap(lat, long, searchCriteria) {
    var pyrmont = new google.maps.LatLng(lat,long);
    var map;
    var service;

    map = new google.maps.Map(document.getElementById('map'), {
        center: pyrmont,
        zoom: 15
      });

    var request = {
      //radius: $scope.distanceInMiles * 0.000621371,
      //location: pyrmont,
      types: ['gym'],
      query: searchCriteria
    };

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
  }

  function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      $scope.gymResults = results;
      $scope.$$phase || $scope.$apply();
    }
  }
})
.controller('WorkoutsCtrl', function($scope, ProfileSvc) {
  $scope.profile = ProfileSvc.profile;
  $scope.staticData = ProfileSvc.staticData;
})
.controller('ProfileCtrl', function($scope, ProfileSvc, $cordovaCamera, $cordovaImagePicker, $location) {
  $scope.profile = ProfileSvc.profile;
  $scope.primaryGym = { id: $scope.profile.primaryGymId }; // set primary gym from data on init
  $scope.$watch('profile.primaryGymId', updateProfile, true);
  $scope.$watch('profile.gender', updateProfile, true);
  $scope.$watch('profile.name', updateProfile, true);
  $scope.$watch('profile.age', updateProfile, true);

  $scope.updateProfile = updateProfile;
  $scope.getPhoto = getPhoto;
 // $scope.selectPhoto = selectPhoto;
 $scope.goToFullProfileImg = goToFullProfileImg;

 function goToFullProfileImg(){
    $location.path('/profile-image');
 }

  function updateProfile(newValue, oldValue){
      // update profile
      if(newValue){
          ProfileSvc.saveProfile();
      }
  }

  function getPhoto(){
      var options = {
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 210,
        targetHeight: 210,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false
      };

      $cordovaCamera.getPicture(options).then(function(imageData) {
        var image = document.getElementById('prof-img');
        image.src = "data:image/jpeg;base64," + imageData;
        $scope.profile.imageUri = "data:image/jpeg;base64," + imageData;
        ProfileSvc.saveProfile();
      }, function(err) {
        // error
      });
  }

  // function selectPhoto(){
  //     var options = {
  //      maximumImagesCount: 10,
  //      width: 800,
  //      height: 800,
  //      quality: 80
  //     };

  //     $cordovaImagePicker.getPictures(options)
  //       .then(function (results) {
  //         for (var i = 0; i < results.length; i++) {
  //           console.log('Image URI: ' + results[i]);
  //         }
  //       }, function(error) {
  //         // error getting photos
  //       });
  // }
})
.controller('ScheduleCtrl', function($scope, ProfileSvc, $location) {
  $scope.profile = ProfileSvc.profile;
  $scope.staticData = ProfileSvc.staticData;
  $scope.saveProfile = saveProfile;

  function saveProfile(){
      ProfileSvc.saveProfile();
      $location.path('/profile');
  }
})
.controller('MatchingCtrl', function($scope, ProfileSvc){
  $scope.activeMatchingProfile = {};
  $scope.profile = ProfileSvc.profile;
  $scope.loadFirstProfile = loadFirstProfile;

  function loadFirstProfile(result){
    //if(result.status == 200 && angular.isArray(result.data) && result.data.length > 0){
      $scope.activeMatchingProfile = result[0];
    // }
    // else {
    //   console.log('error');
    // }
  }

  //ProfileSvc.getAllProfiles().then($scope.loadFirstProfile);
  $scope.profileMatches = ProfileSvc.getAllProfiles();
  //$scope.loadFirstProfile(profiles);
})
.controller('ProfileImageCtrl', function($scope, ProfileSvc){
    $scope.profile = ProfileSvc.profile;
});