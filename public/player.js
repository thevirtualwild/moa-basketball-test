////////////////////////////////////////////////////////

var socket = io();

var canvas = document.getElementById("canvas");
var engine = new BABYLON.Engine(canvas, true, null, false);

var $window = $(window);
var $pages = $('.pages'); // Input for roomname
var $passcodeInput = $('.passcodeInput'); // Input for roomname
var $passcodePage = $('.passcode.page'); // The roomchange page

var shotInfo;

var basketball;
var dragging = false;
var shot = false;
var thrown = true;
var countdownStarted = true;

var p_username;
var p_team;
var p_userdata;

var initCameraPos;

var ballStates = Object.freeze({"WAITING": 0, "DRAGGABLE": 1, "DRAGGING": 2, "SHOT": 3});
var currentBallState = ballStates.WAITING;
var targetX = 0;
var targetY = 0;
var g_overlayMaterial;

// Create Scene
var scene = createScene();
var pageScaleFactorX;
var pageScaleFactorY;
var mouseDownPos;
var mouseUpPos;

// Necessary Variables
var thisRoom = '';
////////////////////////////////////////////////////////

//- Helper Functions
function cleanInput(input) {
  return $('<div/>').text(input).html();
}
function randomRange (min, max) {
    var number = (Math.random() * (min - max) + max);
    return number;
}
function setTeamColor(_someColor3) {
  g_overlayMaterial.ambientColor = _someColor3;
}
function sendErrorMessage(_someMessage) {
  UIInputErrorMessage(_someMessage);
}
//- END Helper Functions

//- Player Connection Functions
function submitGameCode() {
  var courtname = cleanInput($passcodeInput.val().trim());

  attemptToJoinCourt(courtname);
}
function attemptToJoinCourt(_someCourtName) {
  p_userdata = initializePlayer(_someCourtName);

  console.log('JOINCOURT: Court name - ' + _someCourtName + ' p_userdata:');
  console.dir(p_userdata);
  // Tell the server your new room to connect to
  socket.emit('player wants to join court', p_userdata);
}
function initializePlayer(_someCourtName) {
  // calls functions from /babylon/scrips/playerInfo.js (generate Functions)
  p_username = generateName();
  p_team = generateTeam();

  if (_someCourtName) {
      _someCourtName = _someCourtName.toUpperCase();
  } else {
      _someCourtName = 'GAME';
  }

  setTeamColor(defaultColor3);

  var userdata = {
      'username': p_username,
      'team': p_team,
      'court': _someCourtName
  };

  return userdata;
}
//- END Player Connection Functions

//- Gameplay Related functions
function startGameplay(_gamedata) {
  console.log('START Gameplay - gamedata');
  console.dir(_gamedata);

  var startgameplay_event = BABYLON.ActionEvent.CreateNewFromScene(scene, {additionalData: "start gameplay"});
  // console.log("STARTGAMEPLAY called - " + _gamedata.name);
  scene.actionManager.processTrigger(scene.actionManager.actions[0].trigger,  startgameplay_event);
}
//- END Gameplay Related functions

//- Game Engine (Scene and Engine Loop)
function createScene() {
  var scene = new BABYLON.Scene(engine);
  engine.enableOfflineSupport = false;

  var physicsPlugin = new BABYLON.OimoJSPlugin(1);
  var gravityVector = new BABYLON.Vector3(0, 0, 0);
  scene.enablePhysics(gravityVector, physicsPlugin);

  initCameraPos = new BABYLON.Vector3(0,10,0);
  initCameraFocus = new BABYLON.Vector3(0,0,0);
  var camera = new BABYLON.FreeCamera("camera1", initCameraPos, scene);
  //camera.attachControl(canvas, true);

  camera.setTarget(initCameraFocus);
  scene.clearColor = new BABYLON.Color4(0,0,0,0);

  var targetVec;
  var targetVecNorm;
  var initVec;

  var distVec;

  var ground = BABYLON.Mesh.CreateGround("ground1", 35, 35, 1, scene);
  var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
  myMaterial.emissiveTexture = new BABYLON.Texture("/babylon/assets/FillrateTexture.png", scene);
  myMaterial.alpha = 0;
  ground.material = myMaterial;

  var basketball;

  scene.ambientColor = new BABYLON.Color3(1,1,1);

  BABYLON.SceneLoader.ImportMesh("", "/babylon/assets/BBall_V2/", "BBall_V2.babylon", scene, function (mesh) {
    var baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
    g_overlayMaterial = new BABYLON.StandardMaterial("overlayMaterial", scene);
    var multimat = new BABYLON.MultiMaterial("multi", scene);

    baseMaterial.emissiveTexture = new BABYLON.Texture("babylon/assets/BBall_V2/BBall_noLogo-v2.png", scene);
    baseMaterial.diffuseTexture = new BABYLON.Texture("babylon/assets/BBall_V2/BBall_noLogo-v2.png", scene);
    baseMaterial.diffuseTexture.hasAlpha = true;

    g_overlayMaterial.ambientColor = new BABYLON.Color3(1,.4,.2);

    multimat.subMaterials.push(baseMaterial);
    multimat.subMaterials.push(g_overlayMaterial);

    basketball = mesh[0];
    basketball.material = multimat;

    basketball.position = new BABYLON.Vector3(-10, 0, 0);
    basketball.isPickable = false;
    basketball.physicsImpostor = new BABYLON.PhysicsImpostor(basketball, BABYLON.PhysicsImpostor.SphereImpostor,
    {
      mass: 1,
      friction:0.1,
      ignoreParent: true
    });

    //- Touch Event Listeners (Doesn't need to be in the ball), should be its own function | TODO: David
    document.addEventListener('mousedown', function(ev) {
      if(currentBallState == ballStates.DRAGGABLE) {
            currentBallState = ballStates.DRAGGING;
            targetX = ev.pageX;
            targetY = ev.pageY;
            mouseDownPos = new BABYLON.Vector2(ev.pageX, ev.pageY);
        }
    });
    document.addEventListener('mouseup', function(ev) {
      if(currentBallState == ballStates.DRAGGING) {
          mouseUpPos = new BABYLON.Vector2(ev.pageX, ev.pageY);
            console.log(mouseDownPos);
            console.log(mouseUpPos);
          if (Math.abs(mouseUpPos.y - mouseDownPos.y) > 10 && basketball.physicsImpostor.getLinearVelocity().z > 5)
          {
              takeShot();
          }
          else
          {
              currentBallState = ballStates.DRAGGABLE;
          }
      }
    });
    document.addEventListener('mousemove', function(ev) {
      if(currentBallState != ballStates.DRAGGING) return;
      targetX = ev.pageX;
      targetY = ev.pageY;
    });
    document.addEventListener('touchstart', function(ev) {
      if(currentBallState == ballStates.DRAGGABLE) {
            currentBallState = ballStates.DRAGGING;
            targetX = ev.targetTouches[0].clientX;
            targetY = ev.targetTouches[0].clientY;
            //mouseDownPos = new BABYLON.Vector2(ev.targetTouches[0].clientX, ev.targetTouches[0].clientY);
        }
    });
    document.addEventListener('touchmove', function(ev) {
      if(currentBallState != ballStates.DRAGGING) return;
      targetX = ev.targetTouches[0].clientX;
      targetY = ev.targetTouches[0].clientY;
    });
    document.addEventListener('touchend', function(ev){
      if(currentBallState == ballStates.DRAGGING) {
        //     console.log("orig " + ev);
        //     console.log("touches " + ev.targetTouches);
        //     console.log("LENGTH " + ev.targetTouches.length);
        //     console.log("DOWN " + mouseDownPos.y);
        //     console.log("UP " + mouseUpPos.y);
        //     mouseUpPos = new BABYLON.Vector2(ev.targetTouches[ev.targetTouches.length - 1].clientX, ev.targetTouches[ev.targetTouches - 1].clientY);

            if (/*Math.abs(mouseUpPos.y - mouseDownPos.y) > 10 && */basketball.physicsImpostor.getLinearVelocity().z > 5)
            {
                takeShot();
            }
            else
            {
                currentBallState = ballStates.DRAGGABLE;
            }
        }
    });
    //- Listeners

    scene.registerBeforeRender( function() {
      if(currentBallState == ballStates.DRAGGABLE)
      {
          var vel = basketball.physicsImpostor.getLinearVelocity();
          vel.x*= .96;
          vel.y*= .96;
          vel.z*= .96;
          basketball.physicsImpostor.setLinearVelocity(vel);
          var convertedRot = new BABYLON.Vector3(0,0,0);
          var velocity = basketball.physicsImpostor.getLinearVelocity();
          convertedRot.x = velocity.z;
          convertedRot.z = -velocity.x;
          basketball.physicsImpostor.setAngularVelocity(convertedRot);
      }
      else if(currentBallState == ballStates.DRAGGING)
      {
          //console.log(info.pickInfo);
          basketball.position.y = 0;
          var objectPicked = scene.pick(targetX, targetY);
          var pickedPoint = objectPicked.pickedPoint;
          if (objectPicked.pickedMesh == ground) {

              targetVec = pickedPoint;
              initVec = basketball.position.clone();

              distVec = BABYLON.Vector3.Distance(targetVec, initVec);
              if(distVec < .5)
              {
                  basketball.physicsImpostor.setLinearVelocity(
                      basketball.physicsImpostor.getLinearVelocity.x/2,
                      0,
                      basketball.physicsImpostor.setLinearVelocity.z/2);

                  basketball.physicsImpostor.setAngularVelocity(
                      basketball.physicsImpostor.getLinearVelocity.x/2,
                      0,
                      basketball.physicsImpostor.setLinearVelocity.z/2);
                  return;
              }
              targetVec = targetVec.subtract(initVec);
              targetVecNorm = BABYLON.Vector3.Normalize(targetVec);
              basketball.physicsImpostor.setLinearVelocity(0,0,0);
              targetVecNorm.x *=10;
              targetVecNorm.z *=10;
              var convertedRot = new BABYLON.Vector3(0,0,0);
              var pushPos = basketball.position;
              basketball.applyImpulse(targetVecNorm, pushPos);
              var velocity = basketball.physicsImpostor.getLinearVelocity();
              convertedRot.x = velocity.z;
              convertedRot.z = -velocity.x;
              basketball.physicsImpostor.setAngularVelocity(convertedRot);
          }

      }
      else if(currentBallState == ballStates.SHOT) {
        if(basketball.position.z > 6) {
          shotInfo = {
                   xSpeed:basketball.physicsImpostor.getLinearVelocity().x,
                   ySpeed:basketball.physicsImpostor.getLinearVelocity().z,
                   deviceWidth:canvas.width,
                   deviceHeight:canvas.height
               };
          socket.emit("throw ball", shotInfo);

          resetBall();
        }
      }
      else if(currentBallState == ballStates.WAITING) {
          //console.log("CHECKING FOR DRAGGABLE");
          if(basketball.position.x > -4 && basketball.position.x < 4) {
              currentBallState = ballStates.DRAGGABLE;
          }
      }
    });

  });

  function takeShot()   { // Ball gets thrown by the player (after finger is released while dragging)
      currentBallState = ballStates.SHOT;
      var vel = basketball.physicsImpostor.getLinearVelocity();
      vel.z *= 2;
      vel.y = 10;
      basketball.physicsImpostor.setLinearVelocity(vel);
      vel.x = -30;
      vel.y = 0;
      vel.z = 0;
      basketball.physicsImpostor.setAngularVelocity(vel);
  }
  function resetBall()  { // This is actually where the ball is rolled out and waiting to be thrown
      currentBallState = ballStates.WAITING;

      basketball.physicsImpostor.setAngularVelocity(0,0,0);
      basketball.physicsImpostor.setLinearVelocity(0,0,0);
      var left = true;
      if(randomRange(0, 1) < .5)
      {
          basketball.position = new BABYLON.Vector3(-10, 0, 0);
          basketball.physicsImpostor.applyImpulse(new BABYLON.Vector3(randomRange(9, 11), 0, randomRange(-1,1)), basketball.position);
      }
      else
      {
          basketball.position = new BABYLON.Vector3(10, 0, 0);
          basketball.physicsImpostor.applyImpulse(new BABYLON.Vector3(randomRange(-9, -11), 0, randomRange(-1,1)), basketball.position);
      }

      var convertedRot = new BABYLON.Vector3(0,0,0);
      var velocity = basketball.physicsImpostor.getLinearVelocity();
      convertedRot.x = velocity.z;
      convertedRot.z = -velocity.x;
      basketball.physicsImpostor.setAngularVelocity(convertedRot);
  }
  function resetGame()  { // Ball is reset to off stage, not seen until it is rolled onto the screen with "resetBall"
    currentBallState = ballStates.WAITING;
    console.log("RESET");
    basketball.position = new BABYLON.Vector3(-10, 0, 0);
    basketball.physicsImpostor.setAngularVelocity(0,0,0);
    basketball.physicsImpostor.setLinearVelocity(0,0,0);
  }

  ////////////////////////////////////////////////////////
  //           **** Scene Action Manger  ****           //

  scene.actionManager = new BABYLON.ActionManager(scene);
  //Start Gameplay Trigger
  scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          {
              trigger: BABYLON.ActionManager.OnKeyUpTrigger,
              additionalData: "start gameplay"
          },

          function ()
          {
              resetBall();
              UICustomizeAnimateOut();
          }
      )
  );
  //Reset Game Trigger
  scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          {
              trigger: BABYLON.ActionManager.OnKeyUpTrigger,
              additionalData: "reset game trigger"
          },

          function ()
          {
              resetGame();
          }
      )
  );

  //         **** END Scene Action Manager ****         //
  ////////////////////////////////////////////////////////

  return scene;
}

engine.runRenderLoop(function(){ // babylon game engine starts running here

  scene.render();

  // Loading Screen Out
  $( document ).ready( function() {
    UILoadingAnimateOut();
  });
});
//- END Game Engine

////////////////////////////////////////////////////////

//- Listener Events
$(document).ready(function(){
    $("#submit-gamecode").on('click', function () {
      submitGameCode();
      $passcodeInput.blur();
    });

    $(document).keydown(function (event) {
      // When the client hits ENTER on their keyboard
      if (event.which === 13) {
        submitGameCode();
        $passcodeInput.blur();
      }
    });
});
//- END Listener Events

////////////////////////////////////////////////////////
//       *********** Socket Listeners ***********     //

//-- Player Connection Response:
socket.on('you joined court', function(_data) {
  thisRoom = _data.roomname;
  UIInputErrorMessage('Joining Court...')
  UIInputAnimateOut(); //from input.js (then customize.js)
});
// socket.on('player can join court', function(_data) {
//   if ( (_data.court.name == p_userdata.court) && (_data.player.username == p_username) ) {
//     console.log('Player Can Join Court');
//   }
// });

socket.on('court not found', function() {
    sendErrorMessage("Invalid Game Code");
});
socket.on('someone already playing', function() {
    sendErrorMessage("someone already playing");
});
socket.on('game already running', function() {
  sendErrorMessage("game already started, please wait");
});
//-- END Player Connection Response

//-- Game State UPDATE
socket.on('update game state', function(_someGameState) {
  console.log('Update Game State called - ' + _someGameState);
});
//-- END

//-- Game Starting
socket.on('game almost ready', function(_data) {
  console.log('GAME ALMOST READY:');
  console.dir(_data);
  console.log(thisRoom);

  if (_data.room.name == thisRoom) {
    startGameplay(_data.game);
  } else {
    console.log('|another room| game almost ready');
  }
});
//-- END Game Starting

//-- Game Ending
socket.on('end all games', function(_someRoom) {
  if (_someRoom.name == thisRoom) {
    console.log('Games Ended, look at results screen');
    //show this players score
    // $gameover.fadeIn();
    var resetgame_event = BABYLON.ActionEvent.CreateNewFromScene(scene, {additionalData: "reset game trigger"});
    //console.log(ae);
    scene.actionManager.processTrigger(scene.actionManager.actions[1].trigger,  resetgame_event);

    UIGameplayAnimateOut();
    console.log("GAMES ENDED");
  } else {
    console.log('|another room| end all games called');
  }
});
socket.on('show results', function(resultsdata) {

  console.log('Results:');
  console.dir(resultsdata);
  redirectNormal(resultsdata);
});

socket.on('reset game', function(){
    // UIGameoverAnimateOut();
    console.log("PLAYER: reset game requested from server");
});
//-- END Game Ending

//     *********** END Socket Listeners ***********    //
////////////////////////////////////////////////////////
