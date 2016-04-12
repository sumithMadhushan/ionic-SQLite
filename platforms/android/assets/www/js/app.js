// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
//var db=null;//create an instatnt to manage SQLite;s connection and execute SQL statements


// Include dependency: ngCordova
var app= angular.module('starter', ['ionic', 'ngCordova']);

var db=null;


app.run(function($ionicPlatform, $cordovaSQLite) {
    $ionicPlatform.ready(function() {
      if(window.cordova && window.cordova.plugins.Keyboard) {
          // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
          // for form inputs)
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

          // Don't remove this line unless you know what you are doing. It stops the viewport
          // from snapping when text inputs are focused. Ionic handles this internally for
          // a much nicer keyboard experience.
          cordova.plugins.Keyboard.disableScroll(true);
        }
        if(window.StatusBar) {
          StatusBar.styleDefault();
        }
        
        db=$cordovaSQLite.openDB({name: "dbname.db",location: 1});

        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, firstname TEXT, lastname TEXT, email TEXT, phonenumber INTEGER, password TEXT)");
  
             
        
    });
});


     
app.controller('dbController', function($scope, $cordovaSQLite) {


    $scope.save = function(firstname,lastname,email,phonenumber,password) {

        var query="INSERT INTO users (firstname,lastname,email,phonenumber,password) VALUES (?, ?, ?, ?, ?)";
        // execute INSERT statement with parameter
        $cordovaSQLite.execute(db, query, [firstname, lastname, email, phonenumber, password]).then(function(result) {
                $scope.statusMessage = "data insert successfully.!";
        }, function(error) {
                $scope.statusMessage = "Error on saving: " + error.message;
        })

    }

    $scope.load = function() {


        // Execute SELECT statement to load message from database.
        $cordovaSQLite.execute(db, 'SELECT * FROM users ORDER BY id DESC').then(function(res) {

                    if (res.rows.length > 0) {
                        $scope.statusMessage = "Message loaded successful, cheers!";
                    }else{
                        $scope.statusMessage = "No data  show";
                    }
                },
                function(error) {
                    $scope.statusMessage = "Error on loading: " + error.message;
                }
            );
    }

});

