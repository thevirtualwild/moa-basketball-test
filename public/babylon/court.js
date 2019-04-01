///////////////////////////////////////////////////////////////////////
//- Variables

var socket              = io();

var canvas              = document.getElementById("canvas");
var attractLabel        = document.getElementById("attractLabel");
var scoreLabel          = document.getElementById("scoreLabel");

var engine              = new BABYLON.Engine(canvas, true, null, false);
var useCannon           = true;

var gameStates          = Object.freeze({"ATTRACT": 0, "WAITING": 1, "GAMEPLAY": 2, "RESULTS": 3, "INACTIVE": 4});
var currentGameState    = gameStates.ATTRACT;

var netStates           = Object.freeze({"FREE": 0, "WAITING": 1, "LERPING": 2});
var currentNetState     = netStates.FREE;

var cameraNames         = Object.freeze({"freeThrow": 0, "quarterFar": 1, "close": 2});
var selectedCameraType  = cameraNames.freeThrow;


var m_BasketballCount   = 6;

// var basketballStates    = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var basketballStates    = [];
basketballStates.length = m_BasketballCount;


var FPSArray            = [];
var pulseAmbientColor   = false;

var add1Point           = false;

var sceneLoaded         = false;

var netPhysicsDisabled  = false;

var hasCourt            = false;

var readyToSync         = false;
var masterData;
//Game Variables?
var totalTime = 0;
var netSpheres = [];
var netVisiblePositions = [];
var cameraSettings = [];

var worldtime = 0;
var currentWaitTime = initWaitTime;
var currentGameTime = initGameTime;
var currentResultsTime = initResultsTime;
var shotIndex = 0;
var attractIndex = 0;
var currentNetLerpDelayTime = 2;
var initNetLerpDelayTime = 2;
var currentNetLerpTime = 0.25;
var initNetLerpTime = 0.25;
var ComboIsBroken = false;
var StreakIsBroken = false;
var initEmitTime = 0.01;
var currentEmitTime = 0.01;

var loadScreenHasAnimatedOut = false;


var gameReady = false;

var currentCameraIndex = 0;
var currentTextureIndex = 0;

var prevAnimation;

var playerData;

var score = 0;
var combo = 0;
var highestStreak = 0;
var shotsMade = 0;
var combopts = 0;
var scoremodifier = 1;
var newBasketballs = [];
//var newBasketballOutlines = [];

var lowEndDevice = false;

var initRun = true;

//socket data to send
var hasconnected  = false;
var reconnecting  = false;
var isconnected   = false;
var hasloaded     = false;

  ///////////////////////////////////////////////////////////////////////

var $window           = $(window);
var $pages            = $('.pages'); // Input for roomname
var $passcodeInput    = $('.passcodeInput'); // Input for roomname
var shotInfo;
var dragging          = false;
var thrown            = true;
var countdownStarted  = true;

var thisRoom          = '';
var courtName         = '';
// var gameName          = '';
var hasplayer         = false;
var lobbyStarted      = false;

var myIP;
var m_thisDeviceIP;

//- END Variables?
///////////////////////////////////////////////////////////////////////

//wait to start until document ready (*using jQuery*)

createCameraTypes();

var scene = createScene();

// starts the engine
engine.runRenderLoop(function()
{
    if(!isconnected) {
      console.log('tried to run engine but !isconnected');
      return;
    }

    //

    scene.render();

    var fpsLabel        = document.getElementById("fpsLabel");
    fpsLabel.innerHTML  = engine.getFps().toFixed()+ " fps";

    FPSArray.push(parseInt(engine.getFps().toFixed()));

    if(FPSArray.length == 50)
    {
        var average = 0;
        for(var i = 0; i < 50; i++)
        {
            average += FPSArray[i];
        }

        average /= 50;
        if(average < 45)
        {
            lowEndDevice = true;
            scene.getPhysicsEngine().setTimeStep(1/(20 * .6));
        }
        else
        {
            lowEndDevice = false;
            scene.getPhysicsEngine().setTimeStep(1/(40 * .6));
        }

        FPSArray = [];
        scene.actionManager.processTrigger(scene.actionManager.actions[4].trigger, {additionalData: "updatePhysics"});
    }

    if(!hasloaded)
    {
       $(document).ready( function()
       {
          updateUI();
          hasloaded = true;
       });
     }

    // if(ISMASTER)
    // {
    //     fpsLabel.style.background = "red";
    //     fpsLabel.style.height = "100%";
    // }
});

///////////////////////////////////////////////////////////////////////
//           ******Browser Based Functions (Global)******            //

//- Court Initial Device Setup
function getMyIP() {
  window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;//compatibility for Firefox and chrome
  var pc = new RTCPeerConnection({iceServers:[]}), noop = function(){};
  pc.createDataChannel('');//create a bogus data channel
  pc.createOffer(pc.setLocalDescription.bind(pc), noop);// create offer and set local description
  pc.onicecandidate = function(ice)
  {
    if (ice && ice.candidate && ice.candidate.candidate)
    {
      var thisDeviceIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];

      console.log('This Court Device IP: ', thisDeviceIP);



      //DAVID TEST: for testing only
      thisDeviceIP = randomCode(8);
      //END TEST





      showCourt(thisDeviceIP);

      pc.onicecandidate = noop;

      m_thisDeviceIP = thisDeviceIP;
      return thisDeviceIP;
    }
  };
}
// do we need this function of should getMyIP just call checkMyDeviceInfo?
function showCourt(_someDeviceIP) {
  checkMyDeviceInfo(_someDeviceIP);
}

function checkMyDeviceInfo(_someIP)
{
    console.log('court ready for setup: ip-' + _someIP);

    var data = {
      hasconnected: hasconnected,
      reconnecting: reconnecting,
      deviceIP: _someIP,
      hascourt: hasCourt,
      courtname: courtName,
      roomname: thisRoom
    }

    socket.emit('court connected', data);
}

function createScene()
{
    var scene                   = new BABYLON.Scene(engine);
    var shotClockTextures       = [10];

    engine.enableOfflineSupport = false;
    scene.clearColor            = BABYLON.Color3.Black();

    scene.fogMode               = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogStart              = 30;
    scene.fogEnd                = 100;
    scene.fogColor              = BABYLON.Color3.Black();

    var initCameraPos;
    var initCameraFocus;

    if(useCannon)
    {
      var physicsPlugin         = new BABYLON.CannonJSPlugin(false, 1);
      physicsPlugin.allowSleep  = false;
    }
    else
    {
      var physicsPlugin         = new BABYLON.OimoJSPlugin(5);
      physicsPlugin.allowSleep  = true;
    }

    var gravityVector = new BABYLON.Vector3(0,-15.81, 0);
    scene.enablePhysics(gravityVector, physicsPlugin);
    scene.getPhysicsEngine().setTimeStep(1/(20 * .6));
    var camera = new BABYLON.FreeCamera("camera1", initCameraPos, scene);

    camera.attachControl(canvas, true);

    camera.position = cameraSettings[currentCameraIndex].initPos;

    camera.setTarget(cameraSettings[currentCameraIndex].initFocus);
    //camera.maxZ = 50;
    //camera.minZ = 1;

    /* BEGIN BACKBOARD SHOTCLOCK */

    var shotClockTens =  BABYLON.Mesh.CreatePlane("shotClock", 1.0, scene);
    var shotClockOnes =  BABYLON.Mesh.CreatePlane("shotClock", 1.0, scene);

    var firstDigit;
    var secondDigit;

    shotClockTens.position = new BABYLON.Vector3(-1.3, +3.5, 12);
    shotClockTens.scaling = new BABYLON.Vector3(2.5, 5, .1);

    shotClockOnes.position = new BABYLON.Vector3(1.3, +3.5, 12);
    shotClockOnes.scaling = new BABYLON.Vector3(2.5, 5, .1);

    var myMaterialTens = new BABYLON.StandardMaterial("myMaterial", scene);
    var myMaterialOnes = new BABYLON.StandardMaterial("myMaterial", scene);

    shotClockTens.material = myMaterialTens;
    shotClockOnes.material = myMaterialOnes;

    resetClock();

    for(var i = 0; i < 10; i++)
    {
        shotClockTextures[i] = new BABYLON.Texture("./assets/ShotClock/Alphas/Texture" + i + ".png", scene, false, false, 1, function()
        {
            if(shotClockTextures[0].hasAlpha == false)
            {
                updateClock();
            }
        });
    }

    /* END BACKBOARD SHOTCLOCK */

    //
    //DAVID: this wasn't clock issue
    changeGameState(gameStates.ATTRACT);

    function changeGameState(gameState)
    {
        switch(gameState)
        {
            case gameStates.ATTRACT:

                currentGameState    = gameState;
                currentCameraIndex  = 0;
                gameReady           = false;
                //console.log("Aspect Ratio: " + canvas.width/canvas.height);
                lobbyStarted        = false;

                scoremodifier = 1;
                combopts = 0;

                resetBallColor();

                if(ISMASTER)
                {
                  animateCamera();
                }

                updateUI();
                combo               = 0;
                changeBallFX(false);

                break;

            case gameStates.WAITING:

                currentGameState    = gameState;
                currentCameraIndex  = 1;
                shotIndex           = 0;

                if(ISMASTER)
                {
                    animateCamera();
                }

                updateUI();

                break;

            case gameStates.GAMEPLAY:

                currentGameState    = gameState;
                currentCameraIndex  = 1;
                lobbyStarted        = false;

                updateUI();

                updateBallColor();

                break;

            case gameStates.RESULTS:

                currentGameState    = gameState;
                currentCameraIndex  = 1;

                // gameOver();

                initRun             = false;

                break;

            case gameStates.INACTIVE:

                currentGameState    = gameState;

                updateUI();

                break;

            default:

                currentGameState = gameStates.ATTRACT;
        }
    }

    ///////////////////////////////////////////////////////////////////////

    function animateCamera()
    {
        var initPosition;
        var finalPosition;



        if(currentGameState == gameStates.ATTRACT)
        {
            initPosition = camera.position;

            finalPosition = new BABYLON.Vector3(
                cameraSettings[currentCameraIndex].initPos.x,
                cameraSettings[currentCameraIndex].initPos.y,
                cameraSettings[currentCameraIndex].initPos.z);

            if(initPosition.y == finalPosition.y)
            finalPosition.x = -initPosition.x;

            var keys = [];
            keys.push({
                    frame: 0,
                    value: initPosition});
            keys.push(
                {frame: 300,
                    value: finalPosition});

            var dataType        = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
            var cameraAnimation = new BABYLON.Animation("attractAnimation", "position", 30, dataType, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

            var ease = new BABYLON.QuadraticEase();
            ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
            cameraAnimation.setKeys(keys);
            cameraAnimation.setEasingFunction(ease);
            camera.animations = [];
            camera.animations.push(cameraAnimation);
            scene.beginAnimation(camera, 0, 300, false, 1, animateCamera);
        }
        else if(currentGameState == gameStates.WAITING)
        {
            initPosition = camera.position;
            finalPosition = cameraSettings[currentCameraIndex].initPos;

            var keys = [];
            keys.push({
                frame: 0,
                value: initPosition});
            keys.push(
                {frame: 240,
                    value: finalPosition});

            var dataType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
            var animation = new BABYLON.Animation("freeThrowAnimation", "position", 240, dataType, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

            var ease = new BABYLON.QuadraticEase();
            ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
            animation.setKeys(keys);
            animation.setEasingFunction(ease);
            camera.animations = [];
            camera.animations.push(animation);
            scene.beginAnimation(camera, 0, 600, false, 1);
        }
    }

    var scaleFactor = canvas.height / 1080;
    camera.fov = 1;
    if(canvas.height > 2200)
    {
        camera.fov = 1.4;
    }
    else if(canvas.height > 1100)
    {
        camera.fov = 1.2;
    }
    else {
        camera.fov = 1;
    }

    scene.registerBeforeRender(function()
    {
      var i         = 0;

      var newPos    = new BABYLON.Vector3(0,0,0);
      newPos.x      = torus.position.x + 0;
      newPos.y      = torus.position.y + 0;
      newPos.z      = torus.position.z - 0;
      camera.setTarget(newPos);

      if(currentGameState == gameStates.WAITING || lobbyStarted) //ToREMOVE
      {
          // currentWaitTime -= (engine.getDeltaTime() / 1000);

          UIWaitingUpdateClock(currentWaitTime);
      }
      else if(currentGameState == gameStates.GAMEPLAY)
      {
          // currentGameTime -= (engine.getDeltaTime() / 1000);
          if(combopts > 1)
          {
            combopts -= ( (scoremodifier + (scoremodifier/(scoremodifier+1)) ) * (engine.getDeltaTime() / 10000) ); //change for combo dropoff
            updateScoreModifier();
          }

          var time                = currentGameTime.toFixed(2); // do we need this?
          attractLabel.innerHTML  =  "";

          if(currentGameTime <= 0)
          {
              changeGameState(gameStates.RESULTS);
              currentGameTime = 0;
          }

          updateClock();
      }
      else if(currentGameState == gameStates.RESULTS)
      {
          // currentResultsTime -= (engine.getDeltaTime() / 1000);

          if(currentResultsTime <= -2)
          {
              resetClock();
              updateClock();
              UIResultsAnimateOut();
          }
          else if(currentResultsTime <= 0)
          {
              UIResultsAnimateOut();
              resetClock();
              updateClock();
          }
      }

      if(currentNetState == netStates.FREE)
      {
          currentNetLerpDelayTime = initNetLerpDelayTime;
          currentNetLerpTime = initNetLerpTime;
      }
      else if(currentNetState == netStates.WAITING)
      {
          currentNetLerpTime = initNetLerpTime;
          currentNetLerpDelayTime -= (engine.getDeltaTime() / 1000);
          if(currentNetLerpDelayTime <= 0)
          {
              currentNetState = netStates.FREE;
          }
      }
      else if(currentNetState == netStates.LERPING)
      {
          currentNetLerpTime -= (engine.getDeltaTime() / 1000);
          if(currentNetLerpTime <= 0)
          {
              currentNetState = netStates.FREE;
          }
      }

      totalTime += engine.getDeltaTime()/50;

      if(pulseAmbientColor)
      {
          scene.ambientColor = new BABYLON.Color3(
              Math.abs(Math.sin(totalTime)),
              Math.abs(Math.sin(totalTime)),
              Math.abs(Math.sin(totalTime)));
      }
    });

    var torus = BABYLON.Mesh.CreateTorus("torus", 4.3, 0.2, 50, scene);
    torus.position = new BABYLON.Vector3(0, -4.75, 8.9);
    /* START JAY JAY */
    var greenMat                = new BABYLON.StandardMaterial("greenMat", scene);
    greenMat.emissiveColor      = new BABYLON.Color3(0, 1, 0);
    scene.meshes.pop(torus);

    torus.material = greenMat;

    /* END JAY JAY */

    var basketballs = [];

    var basketball;
    for(var i = 0; i < m_BasketballCount; i++)
    {
        basketball            = BABYLON.Mesh.CreateSphere("basketball", 16, 3.1, scene);
        var myMaterial        = new BABYLON.StandardMaterial("myMaterial", scene);
        myMaterial.alpha      = 0;
        basketball.material   = myMaterial;
        basketball.position   = torus.position;
        var newPos            = new BABYLON.Vector3(0,0,0);
        newPos.x              = basketball.position.x + i*3;
        newPos.y              = basketball.position.y - 100;
        newPos.z              = basketball.position.z + 5;
        basketball.position   = newPos;
        basketball.name       = i;
        basketball.scaling    = new BABYLON.Vector3(1,1,1);
        basketballs.push(basketball);
    }

    scene.ambientColor                  = new BABYLON.Color3(1,1,1);

    BABYLON.SceneLoader.ImportMesh("", "./assets/BBall_V2/", "BBall_V2.babylon", scene, function (mesh)
    {
        //console.log("BBall_V2");
        //JAY happens 1 time;

        var baseMaterial                = new BABYLON.StandardMaterial("baseMaterial", scene);
        baseMaterial.emissiveTexture    = new BABYLON.Texture("./assets/BBall_V2/BBall_noLogo-v2.png", scene);
        baseMaterial.diffuseTexture     = new BABYLON.Texture("./assets/BBall_V2/BBall_noLogo-v2.png", scene);
        baseMaterial.diffuseTexture.hasAlpha = true;

        var overlayMaterial             = new BABYLON.StandardMaterial("overlayMaterial", scene);
        overlayMaterial.ambientColor    = defaultColor3;

        var multimat                    = new BABYLON.MultiMaterial("multi", scene);
        multimat.subMaterials.push(baseMaterial);
        multimat.subMaterials.push(overlayMaterial);

        var newBasketball               = mesh[0];
        scene.meshes.pop(mesh[0]);

        for (var i = 0; i < basketballs.length; i++) //creation of Basketballs
        {
            basketballs[i].physicsImpostor = new BABYLON.PhysicsImpostor(basketballs[i], BABYLON.PhysicsImpostor.SphereImpostor, {
                mass: 1,
                friction: 0.1,
                ignoreParent: true
              });

            basketballs[i].material.alpha   = 0;

            var newBasketball               = mesh[0].clone("index: " + i);
            newBasketball.scaling           = new BABYLON.Vector3(1.6, 1.6, 1.6);
            newBasketball.material          = multimat;

            newBasketballs.push(newBasketball);
        }

        //

        scene.registerBeforeRender(function()
        {
            worldtime += engine.getDeltaTime() / 1000;

            if(readyToSync && sceneLoaded)
            {
                if(masterData === undefined) return;

                worldtime = 0;

                  // console.log("masterData");
                  // console.dir(masterData);

                for(var i = 0; i < basketballs.length; i++)
                {
                    var newPos                  = new BABYLON.Vector3(masterData.basketballs[i].posx,
                                                                      masterData.basketballs[i].posy,
                                                                      masterData.basketballs[i].posz);

                    var newRot                  = new BABYLON.Quaternion(masterData.basketballs[i].rotx,
                                                                         masterData.basketballs[i].roty,
                                                                         masterData.basketballs[i].rotz,
                                                                         masterData.basketballs[i].rotw);

                    newBasketballs[i].position  = BABYLON.Vector3.Lerp(newBasketballs[i].position, newPos, 0.9552999999999884);
                    newBasketballs[i].rotation  = newRot.toEulerAngles();
                }

                if(masterData.score == true)
                {
                    madeAShot();
                    addScore();

                    masterData.score    = false;
                }

                if(masterData.comboIsBroken == true)
                {
                    UIGameplayAnimateBadgeOff();
                    changeBallFX(false);

                    ComboIsBroken       = false;
                    StreakIsBroken      = false;
                    combo               = 0;
                }

                //

                //if(!ISMASTER){
                    for(var i = 0; i < 30; i++)
                    {
                        var newPos = new BABYLON.Vector3(masterData.netvertexes[i].posx,masterData.netvertexes[i].posy, masterData.netvertexes[i].posz);

                        netVisiblePositions[i+10].position = newPos;
                    }
                //}

                readyToSync = false;
            }
        });

        //

        scene.registerAfterRender(function()
        {
            for(var i = 0 ; i < basketballs.length; i++)
            {
                if(ISMASTER)
                {
                    if(basketballs[0].position.y < -85)
                    {
                        if(currentGameState == gameStates.ATTRACT)
                        {
                            // console.log('SCENELOADER TAKESHOTS DURING ATTRACT');
                            shotIndex       = 0;
                            takeShot();
                        }
                    }
                }

                if(currentGameState == gameStates.GAMEPLAY || currentGameState == gameStates.RESULTS)
                {
                    if(basketballs[i].position.y < -30 && basketballStates[i] == 1)
                    {
                        combo               = 0;
                        //UIGameplayAnimateBadgeOff();
                        //changeBallFX(false);
                        basketballStates[i] = 0;
                        console.log('Missed a Shot - combo just broke');
                        ComboIsBroken       = true;
                        StreakIsBroken      = true;
                    }
                }
            }

            //

            currentEmitTime -= (engine.getDeltaTime() / 1000);
            currentLoadTime -= (engine.getDeltaTime() / 1000);

            //loadScreenAnimateOut
            if(currentLoadTime <= 0)
            {
                sceneLoaded = true;

                if(!loadScreenHasAnimatedOut)
                {
                  loadScreenAnimateOut();
                  loadScreenHasAnimatedOut = true;
                }
            }

            //
            if(currentEmitTime <= 0)
            {
                currentEmitTime = initEmitTime;

                if(ISMASTER)
                {
                    if(myIP === undefined)
                    {
                      if(m_thisDeviceIP) {
                        myIP = m_thisDeviceIP;
                      }
                      console.log("IP IS UNDEFINED");
                      return;
                    }

                    //

                    var syncData = {
                        deviceIP: myIP,
                        cameraPosition: camera.position,
                        gameTime: currentGameTime,
                        waitTime: currentWaitTime,
                        resultsTime: currentResultsTime,
                        worldTime: worldtime,
                        score: add1Point,
                        combo: combo,
                        comboIsBroken: ComboIsBroken,
                        streakIsBroken: StreakIsBroken,
                        basketballs: [],
                        netvertexes: [],
                        shotindex: shotIndex,
                        states: []
                    }

                    for(var i = 0; i < basketballs.length; i++)
                    {
                        var newbasketballvar =
                        {
                            posx: basketballs[i].position.x,
                            posy: basketballs[i].position.y,
                            posz: basketballs[i].position.z,
                            rotx: basketballs[i].rotationQuaternion.x,
                            roty: basketballs[i].rotationQuaternion.y,
                            rotz: basketballs[i].rotationQuaternion.z,
                            rotw: basketballs[i].rotationQuaternion.w
                        }

                        syncData['basketballs'].push(newbasketballvar);

                        var state = basketballStates[i];
                        syncData['states'].push(state);
                    }

                    //

                    for(var i = sphereAmount; i < 40; i++)
                    {
                        var newNetPosition = {
                            posx: netSpheres[i].position.x,
                            posy: netSpheres[i].position.y,
                            posz: netSpheres[i].position.z
                        }

                        //console.log(newNetPosition);
                        syncData['netvertexes'].push(newNetPosition);
                    }

                    //

                  if(hasCourt)
                  {
                      // sync sockets
                      // if(USEMASTERSLAVEMODE)
                      // {
                      //     socket.emit("sync screens", syncData);
                      // }

                      fakeSyncData(syncData);

                      if(add1Point == true)
                      {
                          console.log(syncData.score);
                          console.log("SENT BASKET MADE")
                          add1Point = false;
                      }
                  }
              }
          }
      });
    });

    BABYLON.SceneLoader.ImportMesh("", "./assets/BBall/", "Bball_Outline.babylon", scene, function (mesh) {

        var baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);

        baseMaterial.ambientColor = new BABYLON.Color3(1, 0, 0);
        baseMaterial.alpha = 0;
        scene.meshes.pop(mesh[0]);

        /*
        for (var i= 0; i< basketballs.length; i++)
        {
            var newBasketballOutline = mesh[0].clone("index: " + i);

            newBasketballOutline.scaling = new BABYLON.Vector3(1.1, 1.1, 1.1);
            newBasketballOutline.material = baseMaterial;

            newBasketballOutlines.push(newBasketballOutline);
        }

        scene.registerBeforeRender(function()
        {
            for(var i = 0 ; i < basketballs.length; i++)
            {
                newBasketballOutlines[i].parent = newBasketballs[i];
            }
        });
        */
    });

    BABYLON.SceneLoader.ImportMesh("Goal_Backboard", "./assets/Layout/", "Goal.babylon", scene, function (mesh) {

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        var mesh = mesh[0];

        myMaterial.emissiveTexture = new BABYLON.Texture("./assets/Colors.png", scene);

        var newPos = new BABYLON.Vector3(0, 0, 0);
        newPos.x = mesh.position.x + 0;
        newPos.y = mesh.position.y + -35.75;
        newPos.z = mesh.position.z - 60;
        mesh.position = newPos;
        mesh.material = myMaterial;
        mesh.freezeWorldMatrix();

        var h1 = new BABYLON.HighlightLayer("hl1", scene);
    });

    BABYLON.SceneLoader.ImportMesh("Goal_Lights_Backboard", "./assets/Layout/", "Goal.babylon", scene, function (mesh) {

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        var mesh = mesh[0];

        myMaterial.emissiveTexture = new BABYLON.Texture("./assets/Alpha Textures/LightGradient_Red.png", scene);
        myMaterial.diffuseTexture = new BABYLON.Texture("./assets/Alpha Textures/LightGradient_Red.png", scene);
        myMaterial.opacityTexture = new BABYLON.Texture("./assets/Alpha Textures/LightGradient_Red.png", scene);

        myMaterial.diffuseTexture.hasAlpha = true;

        myMaterial.alpha = 0;
        var newPos = new BABYLON.Vector3(0, 0, 0);
        newPos.x = mesh.position.x + 0;
        newPos.y = mesh.position.y + -35.75;
        newPos.z = mesh.position.z - 60;
        mesh.position = newPos;
        mesh.material = myMaterial;
        //scene.meshes.pop(mesh);
        scene.registerBeforeRender(function()
        {
            if(currentGameState == gameStates.RESULTS)
            {
                myMaterial.alpha = 1;
            }
            else
            {
                myMaterial.alpha = 0;
            }
        })
    });

    BABYLON.SceneLoader.ImportMesh("Goal_Rim", "./assets/Layout/", "Goal.babylon", scene, function (mesh) {

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
        var mesh = mesh[0];
        myMaterial.emissiveTexture = new BABYLON.Texture("./assets/Colors.png", scene);
        var newPos = new BABYLON.Vector3(0, 0, 0);
        newPos.x = mesh.position.x + 0;
        newPos.y = mesh.position.y + -35.75;
        newPos.z = mesh.position.z - 70;
        mesh.position = newPos;
        mesh.scaling = new BABYLON.Vector3(1.1, 1, 1.1);
        mesh.material = myMaterial;
        mesh.freezeWorldMatrix();

    });

    BABYLON.SceneLoader.ImportMesh("Goal_Base", "./assets/Layout/", "Goal.babylon", scene, function (mesh) {

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        var mesh = mesh[0];

        myMaterial.emissiveTexture = new BABYLON.Texture("./assets/Colors.png", scene);

        var newPos = new BABYLON.Vector3(0, 0, 0);
        newPos.x = mesh.position.x + 0;
        newPos.y = mesh.position.y + -35.75;
        newPos.z = mesh.position.z - 60;
        mesh.position = newPos;
        mesh.material = myMaterial;
        mesh.freezeWorldMatrix();

    });

    BABYLON.SceneLoader.ImportMesh("", "./assets/Layout/", "Seating_Close.babylon", scene, function (meshes) {

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        for (var i = 0; i < meshes.length; i++) {

            if (meshes[i].name != "ArenaLights_Large" &&
                meshes[i].name != "ArenaLights_Small" &&
                meshes[i].name != "Floor") {

                myMaterial.emissiveTexture = new BABYLON.Texture("./assets/Colors.png", scene);

                var newPos = new BABYLON.Vector3(0, 0, 0);
                newPos.x = meshes[i].position.x + 0;
                newPos.y = meshes[i].position.y + -36;
                newPos.z = meshes[i].position.z - 60;
                meshes[i].position = newPos
                meshes[i].material = myMaterial;
                meshes[i].freezeWorldMatrix();
            }
            else {
                scene.meshes.pop(meshes[i]);
            }
        }
    });

    BABYLON.SceneLoader.ImportMesh("ArenaLights_Small", "./assets/Layout/", "ArenaLights.babylon", scene, function (mesh) {

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        var mesh = mesh[0];

        myMaterial.emissiveTexture = new BABYLON.Texture("./assets/Alpha Textures/ArenaLights_Small.png", scene);
        myMaterial.diffuseTexture = new BABYLON.Texture("./assets/Alpha Textures/ArenaLights_Small.png", scene);
        myMaterial.opacityTexture = new BABYLON.Texture("./assets/Alpha Textures/ArenaLights_Small.png", scene);
        myMaterial.diffuseTexture.hasAlpha = true;

        var newPos = new BABYLON.Vector3(0, 0, 0);
        newPos.x = mesh.position.x + 0;
        newPos.y = mesh.position.y + -35.75;
        newPos.z = mesh.position.z - 60;
        mesh.position = newPos;
        mesh.material = myMaterial;
    });

    BABYLON.SceneLoader.ImportMesh("ArenaLights_Large", "./assets/Layout/", "ArenaLights.babylon", scene, function (mesh) {

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        var mesh = mesh[0];

        myMaterial.emissiveTexture = new BABYLON.Texture("./assets/Alpha Textures/ArenaLights_Large.png", scene);
        myMaterial.diffuseTexture = new BABYLON.Texture("./assets/Alpha Textures/ArenaLights_Large.png", scene);
        myMaterial.opacityTexture = new BABYLON.Texture("./assets/Alpha Textures/ArenaLights_Large.png", scene);
        myMaterial.diffuseTexture.hasAlpha = true;

        var newPos = new BABYLON.Vector3(0, 0, 0);
        newPos.x = mesh.position.x + 0;
        newPos.y = mesh.position.y + -35.75;
        newPos.z = mesh.position.z - 60;
        mesh.position = newPos;
        mesh.material = myMaterial;
    });

    var particleSystem = new BABYLON.ParticleSystem("particles", 200, scene);

    particleSystem.particleTexture = new BABYLON.Texture("./assets/Alpha Textures/LenseFlash_01.png", scene);

    var fountain = BABYLON.Mesh.CreateBox("fountain", 1.0, scene);
    fountain.scaling = new BABYLON.Vector3(800, 120, 1);
    var newPos = new BABYLON.Vector3(0,0,0);
    newPos.x = fountain.position.x + 0;
    newPos.y = fountain.position.y + 25;
    newPos.z = fountain.position.z + 170;
    fountain.position = newPos;
    fountain.rotation = new BABYLON.Vector3(45, 0, 0);
    particleSystem.emitter = fountain; // the starting object, the emitter
    particleSystem.minEmitBox = new BABYLON.Vector3(-1, -1, 0); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 0); // To...
    particleSystem.minSize = 6;
    particleSystem.maxSize = 8;
    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.3;
    particleSystem.emitRate = 1000;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
    particleSystem.minAngularSpeed = Math.PI * -1;
    particleSystem.maxAngularSpeed = Math.PI;
    particleSystem.minEmitPower = 0;
    particleSystem.maxEmitPower = 0;
    particleSystem.updateSpeed = 0.003;
    scene.meshes.pop(fountain);
    particleSystem.start();

    //CREATE CIRCLE OF SPHERE COLLIDERS
    var sphereAmount = 10;
    var rimRadius = 3.5;
    var sphereDiameter = 1;
    var centerPos = torus.position;
    centerPos.y += 0.4;
    /* START JAY JAY */
    var redMat                = new BABYLON.StandardMaterial("redMat", scene);
  	redMat.emissiveColor      = new BABYLON.Color3(1, 0, 0);
    /* END JAY JAY */
    for(var i = 0; i < sphereAmount; i++)
    {
        /* START JAY JAY */
        var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: sphereDiameter}, scene);
        sphere.material = redMat;
        /* END JAY JAY */
        sphere.position = new BABYLON.Vector3(
            centerPos.x + Math.sin(i*Math.PI * 2/sphereAmount) * rimRadius,
            centerPos.y + 0,
            centerPos.z + Math.cos(i*Math.PI * 2/sphereAmount) * rimRadius
        );

        sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0,
            friction: 1,
            restitution:4} )
        scene.meshes.pop(sphere);
    }

    centerPos.y -= 0.5;

    //CREATE BACKBOARD COLLIDER
    var backboard = BABYLON.Mesh.CreateBox("backboard", 1 , scene);

    backboard.position = new BABYLON.Vector3(0, 2.5, 12.75);
    backboard.scaling = new BABYLON.Vector3(17.5, 14, 1);
    backboard.physicsImpostor = new BABYLON.PhysicsImpostor(backboard, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0,
    friction: 1,
    restitution: .8} );
    scene.meshes.pop(backboard);

    //CREATE COLLIDERS FOR NET
    var sphereAmount      = 10;
    var netRadius            = 3.3;
    var sphereDiameter    = .5;
    var centerPos         = torus.position;
    var registered        = false;
    centerPos.y -= 4;
    var height            = 4;

    for(var j = 0; j < height; j++)
    {
        for (var i = 0; i < sphereAmount; i++)
        {
          /* START JAY JAY */
          var sphere1       = BABYLON.MeshBuilder.CreateSphere("sphere1", {diameter: sphereDiameter}, scene);
          sphere1.material  = redMat;
          //var sphere1 = BABYLON.Mesh.CreateSphere("sphere1", 10, sphereDiameter, scene);
          /* END JAY JAY */
            sphere1.position = new BABYLON.Vector3(
                centerPos.x + Math.sin(i * Math.PI * 2 / sphereAmount) * netRadius * (1- (j/2/height)),
                centerPos.y + height - j,
                centerPos.z + Math.cos(i * Math.PI * 2 / sphereAmount) * netRadius * (1- (j/2/height))
            );

            var currentMass;
            var currentRestitution;

            //console.log("useCannon = " + useCannon + " / lowEndDevice = " + lowEndDevice);

            if(useCannon)
            {
                if(lowEndDevice)
                {
                    //currentMass = .4 - j*.1;
                    currentMass = .15;

                    if(j == 0)
                    {
                        currentRestitution = 15;
                    }
                    else if(j ==1)
                    {
                        currentRestitution = 10;
                    }
                    else if(j ==2)
                    {
                        currentRestitution = .5;
                    }
                    else
                    {
                        currentRestitution = 0.5;
                    }
                }
                else
                {
                    //currentMass = .4 - j*.1;
                    currentMass = .15;

                    if(j == 0)
                    {
                        currentRestitution = 8;
                        //currentRestitution = 10;
                    }
                    else if(j == 1)
                    {
                        currentRestitution = 8;
                        // currentRestitution = 9;
                    }
                    else if(j == 2)
                    {
                        currentRestitution = 6;
                    }
                    else
                    {
                        currentRestitution = 4;
                        // currentRestitution = 3;
                    }
                }
            }
            else
            {
                currentMass = 15000 - j * 4000;
            }

            if(j == 0)//top row
            {
                currentMass = 0;
            }

            /* START JAY JAY */
            //var sphere2     = BABYLON.Mesh.CreateSphere("sphere1", 10, sphereDiameter, scene);
            var sphere2       = BABYLON.MeshBuilder.CreateSphere("sphere2", {diameter: sphereDiameter}, scene);
            sphere2.material  = redMat;
            /* END JAY JAY */

            sphere2.position = new BABYLON.Vector3(
                centerPos.x + Math.sin(i * Math.PI * 2 / sphereAmount) * netRadius * (1- (j/2/height)),
                centerPos.y + height - j,
                centerPos.z + Math.cos(i * Math.PI * 2 / sphereAmount) * netRadius * (1- (j/2/height))
            );

            /* START JAY JAY */
            sphere2.material = redMat;
            scene.meshes.pop(sphere2);
            /* END JAY JAY */

            netVisiblePositions.push(sphere2);

            sphere1.physicsImpostor = new BABYLON.PhysicsImpostor(sphere1, BABYLON.PhysicsImpostor.SphereImpostor, {
                mass: currentMass,
                restitution: currentRestitution
            });

            netSpheres.push(sphere1);

            if(!registered)
            {
                netSpheres[0].physicsImpostor.registerAfterPhysicsStep(function ()
                {
                    if(currentNetState == netStates.FREE)
                    {
                        for(var k = 0; k < netSpheres.length; k++)
                        {
                            if(netSpheres[k].physicsImpostor)
                            {
                                currentSphereVel = netSpheres[k].physicsImpostor.getLinearVelocity();
                                currentSphereVel.x *= .999;//.997;
                                currentSphereVel.y *= .999;//.997;
                                currentSphereVel.z *= .999;//.997;
                                netSpheres[k].physicsImpostor.setLinearVelocity(currentSphereVel);
                            }
                        }
                        registered = true;
                    }
                });
            }
        }
    }

    netSpheres.forEach(function(point, idx)
    {
        if (idx >= sphereAmount)
        {
            var vertDistance  = 1.75 - .1 * Math.floor(idx/sphereAmount);

            var row           = Math.floor(idx/sphereAmount);
            var horiDistance  = .65 * 3 - .4 * row;

            if(row == 0)
            {
                horiDistance = 1.6;
            }
            else if(row == 1)
            {
                horiDistance = 1.3;
                vertDistance = 2.25;
            }
            else if(row == 2)
            {
                horiDistance = 1.1;
                vertDistance = 1.5
            }
            else if(row == 3)
            {
                horiDistance = 1;
                vertDistance = 1.5
            }

            if (idx >= sphereAmount)
            {
                createJoint(point.physicsImpostor, netSpheres[idx - sphereAmount].physicsImpostor, vertDistance);
            }

            if (idx % sphereAmount > 0)
            {
                createJoint(point.physicsImpostor, netSpheres[idx - 1].physicsImpostor, horiDistance);
            }
            else if(idx % sphereAmount == 0)
            {
                createJoint(point.physicsImpostor, netSpheres[idx + sphereAmount - 1].physicsImpostor, horiDistance);
            }
        }

        scene.meshes.pop(netSpheres[i]);
    });

    // var scoreTrigger = new BABYLON.Mesh.CreateBox("scoreTrigger", 5, scene); //was 3

    // var scoreTrigger = BABYLON.MeshBuilder.CreatePlane("scoreTrigger", {width: 5, height: 2}, scene);

    var scoreTrigger = BABYLON.MeshBuilder.CreateCylinder("scoreTrigger", {diameterTop: 5, height: 5, diameterBottom:5, tessellation: 6}, scene);
    scoreTrigger.position = torus.position;
    scoreTrigger.position.y += .2; //was .75


    var greenMat                = new BABYLON.StandardMaterial("greenMat", scene);
    greenMat.emissiveColor      = new BABYLON.Color3(0, 1, 0);
    greenMat.alpha              = 0;
    scoreTrigger.material = greenMat;

    var clearMat = new BABYLON.StandardMaterial("myMaterial", scene);
    clearMat.alpha = .8; //change alpha here to change scorebox //DAVID
    // scoreTrigger.material = clearMat;
    score = 0;
    highestStreak = 0;

    var manager = new BABYLON.ActionManager(scene);
    scoreTrigger.actionManager = manager;

    var test;

    for(var i = 0; i < basketballs.length; i++) {
        scoreTrigger.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: basketballs[i]
                },
                function () {
                    if(currentGameState == gameStates.GAMEPLAY || currentGameState == gameStates.RESULTS)
                    {
                        var idx = shotIndex-1;
                        if(idx < 0) idx = 9;

                        //DAVID: point scored, shot made, boolean set, addScore
                        if(basketballStates[idx] == 1) {
                            basketballStates[idx] = 0;
                            add1Point = true;

                            scoreTriggerHit();
                            //addScore();

                            /*
                            if(combo >= 2)
                            {
                                UIGameplayAnimateBadgeOn(combo);
                            }

                            if(combo >= 3)
                            {
                                changeBallFX(true);
                            }
                            */
                        }
                    }
                }
            )
        );
    }


    var clothMat = new BABYLON.StandardMaterial("netMat", scene);
    clothMat.diffuseTexture = new BABYLON.Texture("./assets/Layout/Net.png", scene);
    clothMat.emissiveTexture = new BABYLON.Texture("./assets/Layout/Net.png", scene);
    clothMat.diffuseTexture.vScale = 4;
    clothMat.diffuseTexture.uScale = 4;
    clothMat.backFaceCulling = false;
    clothMat.diffuseTexture.hasAlpha = true;

    var net = BABYLON.Mesh.CreateGround("ground1", 1, 1, sphereAmount, scene, true);

    var positions = net.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    net.material = clothMat;

    var indices = net.getIndices();
    //524
    indices.splice(182, indices.length);

    net.setIndices(indices, indices.length);

    var debugPos = [];
    var currentSphereVel;
    net.registerBeforeRender(function ()
    {
        var positions = [];

        netVisiblePositions.forEach(function (s, idx)
        {
            positions.push(netVisiblePositions[idx].position.x, netVisiblePositions[idx].position.y, netVisiblePositions[idx].position.z);

            if((idx % sphereAmount) == (sphereAmount - 1))
            {
                positions.push(netVisiblePositions[idx - sphereAmount + 1].position.x, netVisiblePositions[idx - sphereAmount + 1].position.y, netVisiblePositions[idx - sphereAmount + 1].position.z);
            }
        });

        net.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        net.refreshBoundingInfo();
    });

    scene.actionManager = new BABYLON.ActionManager(scene);

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                additionalData: "takeShot"
            },

            function()
            {
                if(currentGameState == gameStates.GAMEPLAY)
                {
                    takeShot();
                }
            }
        )
    );

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                additionalData: "changeGameStateAttract"
            },

            function()
            {
                changeGameState(gameStates.ATTRACT);
                console.log("Change game state to attract from reset game");
            }
        )
    );

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                additionalData: "changeGameStateWaiting"
            },

            function()
            {
                changeGameState(gameStates.WAITING);
            }
        )
    );

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                additionalData: "animateaction"
            },

            function()
            {
                animateCamera();
                console.log("ANIMATING");
            }
        )
    );

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                additionalData: "updatePhysics"
            },

            function()
            {
                if(ISMASTER) updatePhysics();
            }
        )
    );

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                additionalData: "changeGameStateGameplay"
            },

            function()
            {
                changeGameState(gameStates.GAMEPLAY);
                console.log("Change game state to gameplay");
            }
        )
    );

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                additionalData: "changeGameStateResults"
            },

            function()
            {
                changeGameState(gameStates.RESULTS);
            }
        )
    );

    ///////////////////////////////////////////////////////////////////////
     var scoretriggernum = 0;
    function scoreTriggerHit() {
      scoretriggernum++;
      console.log('score trigger hit - ' + scoretriggernum);
    }

    ////////

    function updateClock()
    {
        if ( Math.ceil(parseInt((currentGameTime).toFixed(2))) >= 10) {
            var firstDigit = Math.ceil(parseInt((currentGameTime).toFixed(2).substr(0, 1)));
            var secondDigit = Math.ceil(parseInt((currentGameTime).toFixed(2).substr(1, 1)));
        }
        else {
            firstDigit = 0;
            secondDigit = parseInt((currentGameTime).toFixed(2).substr(0, 1));
        }

        // console.log("UPDATECLOCK: current combopts - " + combopts + ' - ' + scoremodifier);

        if(currentGameTime == 30)
        {
            secondDigit = 0;
        }
        else if(currentGameTime == 0)
        {
            secondDigit = 0;
        }

        myMaterialTens.emissiveTexture = shotClockTextures[firstDigit];
        myMaterialTens.diffuseTexture = shotClockTextures[firstDigit];
        myMaterialTens.opacityTexture = shotClockTextures[firstDigit];
        myMaterialTens.emissiveTexture.vScale = -1;

        myMaterialOnes.emissiveTexture = shotClockTextures[secondDigit];
        myMaterialOnes.diffuseTexture = shotClockTextures[secondDigit];
        myMaterialOnes.opacityTexture = shotClockTextures[secondDigit];
        myMaterialOnes.emissiveTexture.vScale = -1;
    }

    ///////////////////////////////////////////////////////////////////////

    function createJoint(imp1, imp2, distance)
    {
        var joint = new BABYLON.DistanceJoint({
            maxDistance: distance,
            nativeParams:{
                collision:false
            }
        })

        imp1.addJoint(imp2, joint);
    }

    ///////////////////////////////////////////////////////////////////////

    function changeBallFX(toggle)
    {
        if(toggle == true)
        {
            pulseAmbientColor   = true;
            /*
            for(var i = 0; i < newBasketballOutlines.length; i++)
            {
                newBasketballOutlines[i].material.alpha = 1;
            }
            */
        }
        else
        {
            pulseAmbientColor   = false;
            scene.ambientColor  = new BABYLON.Color3(1,1,1);
            /*
            for(var i = 0; i < newBasketballOutlines.length; i++)
            {
                newBasketballOutlines[i].material.alpha = 0;
            }
            */
        }
    }

    ///////////////////////////////////////////////////////////////////////

    function takeShot()
    {
        if(currentGameState == gameStates.ATTRACT)
        {
            basketballs[shotIndex].position = new BABYLON.Vector3(0, -9, -14);

            basketballs[shotIndex].physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
            basketballs[shotIndex].physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
            basketballs[shotIndex].physicsImpostor.applyImpulse(new BABYLON.Vector3(attractShots[attractIndex], 20, 11), basketballs[shotIndex].getAbsolutePosition());
        }
        else if(currentGameState == gameStates.GAMEPLAY)
        {
            if(ISMASTER)
            {
                basketballs[shotIndex].position = new BABYLON.Vector3(0, -9, -14);

                basketballs[shotIndex].physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
                basketballs[shotIndex].physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
                basketballs[shotIndex].physicsImpostor.applyImpulse(new BABYLON.Vector3(shotInfo.xSpeed, 18, 12), basketballs[shotIndex].getAbsolutePosition());

                basketballStates[shotIndex] = 1;
            }
        }

        var convertedRot    = new BABYLON.Vector3(0,0,0);
        var velocity        = basketballs[shotIndex].physicsImpostor.getLinearVelocity();
        convertedRot.x      = -velocity.z / 5;
        convertedRot.z      = -velocity.x;

        basketballs[shotIndex].physicsImpostor.setAngularVelocity(convertedRot);

        //

        shotIndex++;
        if(shotIndex >= basketballs.length) shotIndex = 0;

        //

        attractIndex++;
        if(attractIndex >= attractShots.length) attractIndex = 0;
    }

    ///////////////////////////////////////////////////////////////////////

    function updateBallColor() //only used if ISTEAMGAME
    {
        for(var i = 0; i < basketballs.length; i++)
        {
            newBasketballs[i].material.subMaterials[1].ambientColor = defaultColor3;

            //newBasketballOutlines[i].material.ambientColor = playerData.team.colorRGB;
        }
    }

    ///////////////////////////////////////////////////////////////////////

    function resetBallColor() //only used if ISTEAMGAME
    {
        if(basketballs === undefined) return;
        for(var i = 0; i < basketballs.length; i++)
        {
            newBasketballs[i].material.subMaterials[1].ambientColor = defaultColor3;
            //newBasketballOutlines[i].material.ambientColor = new BABYLON.Color3(1,.4,.2);
        }
    }

    ///////////////////////////////////////////////////////////////////////

    function updatePhysics()
    {
        if(lowEndDevice)
        {
            scene.getPhysicsEngine().getPhysicsPlugin().world.solver.iterations = 1;
        }
        else
        {
            scene.getPhysicsEngine().getPhysicsPlugin().world.solver.iterations = 2;
        }

        for(var j = 0; j < height; j++)
        {
            for (var i = 0; i < sphereAmount; i++)
            {
                var currentMass;
                var currentRestitution;

                if(useCannon)
                {
                    if(lowEndDevice)
                    {
                        //currentMass = .4 - j*.1;
                        currentMass = .15;

                        if(j == 0)
                        {
                            currentRestitution = 15;
                        }
                        else if(j ==1)
                        {
                            currentRestitution = 10;
                        }
                        else if(j ==2)
                        {
                            currentRestitution = .5;
                        }
                        else
                        {
                            currentRestitution = 0.5;
                        }
                    }
                    else
                    {
                        //currentMass = .4 - j*.1;
                        currentMass = .15;

                        if(j == 0)
                        {
                            currentRestitution = 8;
                        }
                        else if(j ==1)
                        {
                            currentRestitution = 6;
                        }
                        else if(j ==2)
                        {
                            currentRestitution = 1;
                        }
                        else
                        {
                            currentRestitution = 0.5;
                        }
                    }
                }
                else
                {
                    currentMass = 15000 - j * 4000;
                }

                if(j == 0)//top row
                {
                    currentMass = 0;
                }

                //

                //currentRestitution = 0;
                netSpheres[j * 10 + i].physicsImpostor.mass         = currentMass;
                netSpheres[j * 10 + i].physicsImpostor.restitution  = currentRestitution;
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////

    function changeCamera()
    {
        currentCameraIndex++;
    }

    ///////////////////////////////////////////////////////////////////////

    return scene;
}

///////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////

function courtReconnection(courtinfofromserver)
{
    if (courtinfofromserver.hascourt)
    {
      console.log('court setup: '+ courtinfofromserver.courtname);
    }
    else
    {
      console.log('we need to set up court')
    }
}

///////////////////////////////////////////////////////////////////////

function haveCourtJoinRoom(courtname, roomnametojoin)
{
  var data = {
    courtname: courtname,
    roomname: roomnametojoin
  }

  thisRoom = data.roomname;
  courtName = data.courtname;

  socket.emit('join room', data);

  console.log("HAVE COURT TO JOIN");
  initRun = false;
  updateUI();
}

///////////////////////////////////////////////////////////////////////

function randomCode(howLong)
{
  var randomname = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (var i = 0; i < howLong; i++)
    randomname += possible.charAt(Math.floor(Math.random() * possible.length));

  return randomname;
}

///////////////////////////////////////////////////////////////////////

function randomRange (min, max)
{
    var number = (Math.random() * (min - max) + max);
    return number;
}

///////////////////////////////////////////////////////////////////////

function checkCurrentLevel(newModifier, pointsNeeded) {
  if (scoremodifier == newModifier) {
    console.log('Too long to score.');

  } else {
    combopts = pointsNeeded + 1;
    scoremodifier = newModifier;
    UIGameplayAnimateBadgeOn(scoremodifier);
    UIComboLevelChange(scoremodifier);
  }
}

function updateScoreModifier()
{
  // console.log('updateScoreMod - ' + combopts);
    if (combopts >= 92) {
      checkCurrentLevel(10, 92);
    } else if (combopts >= 74) {
      checkCurrentLevel(9, 74);
    } else if (combopts >= 58) {
      checkCurrentLevel(8, 58);
    } else if (combopts >= 44) {
      checkCurrentLevel(7, 44);
    } else if (combopts >= 32) {
      checkCurrentLevel(6, 32);
    } else if (combopts >= 22) {
      checkCurrentLevel(5, 22);
    } else if (combopts >= 14) {
      checkCurrentLevel(4, 14);
    } else if (combopts >= 8) {
      checkCurrentLevel(3, 8);
    } else if (combopts >= 4) {
      checkCurrentLevel(2, 4);
    } else {
      scoremodifier = 1;
      // comboIsBroken = true;

      UIGameplayAnimateBadgeOff();
    }
}

///////////////////////////////////////////////////////////////////////

function madeAShot()
{
    console.log("BASKET MADE RECEIVED");

    var scoreToAdd = scoremodifier * 2;

    score = score + scoreToAdd;

    combopts = combopts + 1 + (scoreToAdd);
    console.log("MADEASHOT: combopts - " + combopts);
    updateScoreModifier(); //was combo
    // changeBallFX(true);
}

///////////////////////////////////////////////////////////////////////

function addScore()
{
    currentNetState = netStates.WAITING;
    currentNetLerpDelayTime = initNetLerpDelayTime;

    if(currentGameState != gameStates.GAMEPLAY && currentGameState != gameStates.RESULTS) return;
    //console.log("SCORE ADDED");
    //score++;
    UIGameplayUpdateScore(score);
    UIResultsUpdateScore(score);
    var scoreLabel = document.getElementById("scoreLabel");
    scoreLabel.innerHTML = "Score: " + score;
    playerData.score = score;

    combo++;
    shotsMade++;

    console.log('Combo+ ' + combo);

    if (combo > highestStreak)
    {
      console.log('highestStreak+ ' + highestStreak)
      highestStreak = combo;
      console.log("Highest Streak: " + highestStreak);
    }

    console.log("Combo: " + combo);
}

///////////////////////////////////////////////////////////////////////

function updateUI()
{
  $(document).ready( function()
  {
    switch(currentGameState)
    {
        case gameStates.ATTRACT:
            score = 0;
            highestStreak = 0;
            currentWaitTime = initWaitTime; //TODO: probably should get rid of this
            hasplayer = false;
            scoreLabel.innerHTML = "";
            //attractLabel.innerHTML = "COURT CODE: <br /> " + courtName;
            UIAttractUpdateCourtName(courtName);
            // attractLabel.innerHTML = "";
            resetClock();
            UIGameplayUpdateScore(0);
            if(!initRun){
              console.log("uianimatein inside of updateui");
              UIAttractAnimateIn();
            }
            break;
        case gameStates.WAITING:
            // scoreLabel.innerHTML = "COURT CODE: " + courtName;
            // attractLabel.innerHTML = "";
            UIAttractAnimateOut();
            break;
        case gameStates.GAMEPLAY:
            scoreLabel.innerHTML = "Score: " + score;
            //attractLabel.innerHTML = initGameTime.toString();
            break;
        case gameStates.RESULTS:
            UIGameplayAnimateOut();
            scoreLabel.innerHTML = "";
            //attractLabel.innerHTML = "Score: " + score;
            currentResultsTime = initResultsTime;
            break;
        case gameStates.INACTIVE:
            scoreLabel.innerHTML = "";
            //attractLabel.innerHTML = "Please Wait, Game In Progress";
            currentResultsTime = initResultsTime;
            break;
        default:
            attractLabel.innerHTML = "";
            scoreLabel.innerHTML = "";
    }
  });
}

///////////////////////////////////////////////////////////////////////

function createCameraTypes()
{
    var cameraType = {
        cameraNames: cameraNames.quarterFar,
        //initPos: new BABYLON.Vector3(20, 0, -15),
        initPos: new BABYLON.Vector3(0, -7, -18),
        //initPos: new BABYLON.Vector3(0, 5, -10),
        initFocus: new BABYLON.Vector3(0, -2.6, 11.75)
        //initFocus: new BABYLON.Vector3(0, -10, -30)
    }
    cameraSettings.push(cameraType);

    var cameraType = {
        cameraNames: cameraNames.freeThrow,
        initPos: new BABYLON.Vector3(0, -7, -18),
        initFocus: new BABYLON.Vector3(0, -12, 11.75),
    }
    cameraSettings.push(cameraType);

    var cameraType = {
        cameraNames: cameraNames.close,
        initPos: new BABYLON.Vector3(-1, -6, -1),
        initFocus: new BABYLON.Vector3(0, -2.6, 11.75),
    }
    cameraSettings.push(cameraType);
}

///////////////////////////////////////////////////////////////////////

function resetClock()
{
  currentGameTime = initGameTime;
}

///////////////////////////////////////////////////////////////////////

function gameOver()
{
  // the game is finished, submit the score and do stuff

  var playerScoreData = {
    score: score,
    combo: combo,
    highestStreak: highestStreak,
    shotsMade: shotsMade
  }

  var courtdata = {
    playerInfoData: playerData,
    playerScoreData: playerScoreData//,
    // gameName: gameName
  }

  var gamedata = {
    player: playerData,
    score: score,
    combo: combo,
    highestStreak: highestStreak,
    shotsMade: shotsMade//,
    // gamename: gameName
  }

  console.log('GAMEOVER: gamedata - ');
  console.dir(gamedata);
  console.log('GAMEOVER: courtdata - ');
  console.log(courtdata);

  if(playerData)
  {
    if(ISMASTER)
    {
      //MAYBE CHECK IF HAS PLAYER
      socket.emit('send game data', gamedata, courtdata);
    }
  }
}

///////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////
function roomReset() {
    if(ISMASTER)
    {
        socket.emit('room reset');
    }
}
///////////////////////////////////////////////////////////////////////

function fakeSyncData(_syncData)
{
    masterData        = _syncData;
    readyToSync       = true;

    if(!ISMASTER)
    {
        //console.log("SYNC WITH MASTER");

        if(netPhysicsDisabled == false)
        {
            for(var i = 0; i < netSpheres.length; i++)
            {
                netSpheres[i].physicsImpostor.dispose();
            }

            netPhysicsDisabled = true;
        }
    }
}

///////////////////////////////////////////////////////////////////////
//              *********** Socket Listeners ***********             //

socket.on('game almost ready', function(_data)
{
   socket.emit('update game', _data.game);
   console.log('GAMEALMOSTREADY: ' + _data.game);

   gameStarted();
});

socket.on('update wait time', function(_data) {
  if (_data.room.name == thisRoom) {
    currentWaitTime = _data.time;
    console.log('Update Wait Time - ' + currentWaitTime);
  } else {
    console.log('|another room| Update Wait Time');
  }
});
socket.on('update game time', function(_data) {
  if (_data.room.name == thisRoom) {
    currentGameTime = _data.time;
    console.log('Update Game Time - ' + currentGameTime);
  } else {
    console.log('|another room| Update Game Time');
  }
});
socket.on('update results time', function (_data) {
  if (_data.room.name == thisRoom) {
    currentResultsTime = _data.time;
    console.log('Update Results Time - ' + currentResultsTime);
  } else {
    console.log('|another room| Update Results Time');
  }
});

///////////////////////////////////////////////////////////////////////

socket.on('device knows court', function(data)
{
  // do something with the data
  console.log('device knows court');
});

///////////////////////////////////////////////////////////////////////

socket.on('device needs court', function()
{
  // find something out
  console.log('Device doesnt know court');
});

///////////////////////////////////////////////////////////////////////

socket.on('join this room', function(data)
{
    var courtname   = data.court.name;
    var roomname    = data.room.name;

    haveCourtJoinRoom(courtname,roomname);
});

///////////////////////////////////////////////////////////////////////

socket.on('court joined room', function(data)
{
    //console.log('Congrats ' + courtName +'(' + data.courtname + ')' + ', you joined room: ' + data.roomname);
    hasCourt = true;
});

///////////////////////////////////////////////////////////////////////

socket.on('change hasplayer', function(userdata) {
  console.log('this courtname - ' + courtName);
  console.dir(userdata);
  if(userdata.court == courtName)
  {
    console.log('Player ' + userdata.username + ' - Joined Your Court - ' + userdata.court);
    UIGameplayUpdateName(userdata.username);
    UIResultsUpdateName(userdata.username);

    playerData  = userdata;
    hasplayer   = true;
  }
});

socket.on('player joined court', function(userdata)
{
  console.log('this courtname - ' + courtName);
  console.dir(userdata);
  if(userdata.court == courtName)
  {
    console.log('Player ' + userdata.username + ' - Joined Your Court - ' + userdata.court);
    UIGameplayUpdateName(userdata.username);
    UIResultsUpdateName(userdata.username);

    playerData  = userdata;
    hasplayer   = true;

    if (!lobbyStarted) {
      socket.emit('start lobby', userdata);
    } else {
      socket.emit('add player to game', userdata);
    }

    callWaitingTrigger();
  }
  else
  {
    //IS THIS WHERE LOBBY IS STARTED??
    //DAVID: To Add "Waiting Countdown for attract screen (should be a new state) add it here"
    lobbyStarted = true;
    console.log('Player ' + userdata.username + ' - Joined Sister Court - ' + userdata.court);
  }
});

function callAttractTrigger() {
  scene.actionManager.processTrigger(scene.actionManager.actions[1].trigger, {additionalData: "changeGameStateAttract"});
}
function callWaitingTrigger() {
  scene.actionManager.processTrigger(scene.actionManager.actions[2].trigger, {additionalData: "changeGameStateWaiting"});
}
function callGameplayTrigger() {
  scene.actionManager.processTrigger(scene.actionManager.actions[5].trigger, {additionalData: "changeGameStateGameplay"});
}
function callResultsTrigger() {
  scene.actionManager.processTrigger(scene.actionManager.actions[6].trigger, {additionalData: "changeGameStateResults"});
}

function gameStarted() {
  console.log(hasplayer);
  callGameplayTrigger();
}

function showResults() {
  console.log('Show Results Called');
  callResultsTrigger();
}

//-- Game State UPDATE
socket.on('update game state', function(_someRoom) {
  if (thisRoom == _someRoom.name) {
    var newgamestate = _someRoom.state
    console.log('Update Game State called - ' + newgamestate);

    if (newgamestate == g_gameStates.ATTRACT) {
      callAttractTrigger();
    } else if (newgamestate == g_gameStates.WAITING) {
      // callWaitingTrigger();
    } else if (newgamestate == g_gameStates.GAMEPLAY) {
      if(hasplayer){
        callGameplayTrigger();
      }
    } else if (newgamestate == g_gameStates.RESULTS) {
      if (hasplayer) {
        callResultsTrigger();
      }
    }
  }
});
//-- END
///////////////////////////////////////////////////////////////////////

socket.on('player changed name', function(data)
{
    //console.log(data);
    //console.log(data.dir);
    if(courtName == data.newplayer.court)
    {
      console.log('Player ' + playerData.username + ' - Change Name - ' + data.newplayer.username);

      playerData = data.newplayer;

      UIGameplayUpdateName(data.newplayer.username);
      UIResultsUpdateName(data.newplayer.username);
    }
    else
    {
      console.log('Player ' + data.username + ' - Change Name - ' + data.newplayer.username);
    }
});

///////////////////////////////////////////////////////////////////////

socket.on('take shot', function(data)
{
  var shotmadeincourt = data.court;
  shotInfo            = data.shotInfo;

  if(shotmadeincourt == courtName)
  {
    //var trigger = scene.actionManager.actions[0].trigger;
    console.log(shotInfo);
    takeShotTrigger();
  }
  else
  {
    console.log('shot made in a sister court - ' + shotmadeincourt);
  }
});

function takeShotTrigger() {
  var ae = BABYLON.ActionEvent.CreateNewFromScene(scene, {additionalData: "takeShot"});
  //console.log(ae);
  scene.actionManager.processTrigger(scene.actionManager.actions[0].trigger,  ae);
}

///////////////////////////////////////////////////////////////////////

socket.on('shot sent', function()
{
  // console.log('We got a message back!');
});

///////////////////////////////////////////////////////////////////////

socket.on('end all games', function(_someRoom)
{
  if (hasplayer) {
    if (_someRoom.name == thisRoom) {
      console.log('End all games in - ' + _someRoom.name);
      showResults();

      if(ISMASTER)
      {
          TweenMax.delayedCall(2,gameOver);

          updateUI();
          // TweenMax.delayedCall(3,updateUI);

          //DAVID: This should really be called at the end of results. Not sure exactly how or when
          // TweenMax.delayedCall(initResultsTime + 2,roomReset);
      }
    } else {
      console.log('|another room| end all games called');
    }
  }
});

///////////////////////////////////////////////////////////////////////

socket.on('show results', function(_gamedata)
{
  console.log('-Court.js- Show Results!');
  console.dir(_gamedata);

  if(hasplayer)
  {
    var playerScoreData = {
      score: score,
      combo: combo,
      highestStreak: highestStreak,
      shotsMade: shotsMade
    }
    UIResultsSetData(_gamedata, playerScoreData);
  }
});

///////////////////////////////////////////////////////////////////////

socket.on('reset game', function(_someRoom)
{
  // callAttractTrigger();

  console.log('court should be reset here');
  currentResultsTime = initResultsTime;
  socket.emit('court reset', courtName);
});

///////////////////////////////////////////////////////////////////////

socket.on('change player name', function(data)
{
    UIGameplayUpdateName(data.name);
    console.log("CHANGE PLAYER NAME");
    console.log(data);
});

///////////////////////////////////////////////////////////////////////
//
// socket.on('update game name', function(newgamename)
// {
//   gameName = newgamename;
// });

///////////////////////////////////////////////////////////////////////

socket.on('connect', function()
{
  isconnected = true;
  myIP = getMyIP();
});

///////////////////////////////////////////////////////////////////////

socket.on('court reconnected', function(courtinfo) {
  courtReconnection(courtinfo);
});

///////////////////////////////////////////////////////////////////////

socket.on('reconnect', function() {
  isconnected = true;
  console.log('reconnect');
});

///////////////////////////////////////////////////////////////////////

socket.on('reconnecting', function() {
  console.log('reconnecting');
});

///////////////////////////////////////////////////////////////////////

socket.on('reconnect_failed', function() {
  console.log('reconnect failed');
});

///////////////////////////////////////////////////////////////////////

socket.on('disconnect', function() {
  isconnected = false;
});




///

socket.on('set master', function()
{
    ISMASTER  = true;

    console.log("SET MASTER " + ISMASTER);
    console.log("ON SETMASTER: animateaction");
    animateTrigger();
});

function animateTrigger() {
  scene.actionManager.processTrigger(scene.actionManager.actions[3].trigger, {additionalData: "animateaction"});
}

///

socket.on('force room reset', function() {
  console.log('force room reset called from server')
  roomReset();
});

///

//             *********** END Socket Listeners ***********          //
///////////////////////////////////////////////////////////////////////
