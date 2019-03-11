var textFadeTime = 0.5;

var canvas = document.getElementById("canvas");

var gameCodeText = $("#gamecode-text");
var textingCode = $("#texting-code");
var textingNumber = $("#texting-number");
var attractTextContainer = $('.attract-state .text-container');
var info_layer = $('.info-layer');

// var attractItems = document.getElementsByClassName("attract-state");

var attractTweens = [];

var initAttractLoad = true;
var attractIsAnimating = false;
function UIAttractAnimateIn()
{
    // attractAnimations();

    if(!attractIsAnimating)
    {
      // resetAnimations();
      turnOffResults();
      turnOnAttract();
      attractIsAnimating = true;
      console.log("UIATTRACTANIMATEIN");
      //onComplete:animatingOff;
      animatingOff();
    }

    animateLeftFromX(attractTextContainer, '-500px', textFadeTime, textFadeTime, attractAnimations);
    animateLeftFromX(gameCodeText, '-500px', textFadeTime, textFadeTime);
    TweenMax.to(info_layer, textFadeTime, {opacity:1, delay: textFadeTime, ease:Sine.easeInOut});
}

function UIAttractAnimateOut()
{
    //onComplete: turnOffAttract
    animateLeftToX(gameCodeText, '-500px', textFadeTime/2, textFadeTime/2);
    animateLeftToX(attractTextContainer, '-500px', textFadeTime/2, textFadeTime/2, turnOffAttract);
    TweenMax.to(info_layer, textFadeTime/2, {opacity:0, delay: textFadeTime/2, ease:Sine.easeInOut});
}

function turnOnAttract()
{
    changeVisibility('attract-state', 'visible');
    changeDisplay('attract-state', 'block');
    turnOnAnimations();
    restartAnimations(attractTweens);
    // attractAnimations();
}

function turnOffAttract()
{
    changeVisibility('attract-state', 'hidden');
    changeDisplay('attract-state', 'none');
    turnOffAnimations();
    // pauseAnimations(attractTweens);

    UIWaitingAnimateIn();
}

function UIAttractUpdateCourtName(name)
{
    gameCodeText.html(name);

    UIAttractUpdateTextingInfo(texting_code, texting_number);
}
function UIAttractUpdateTextingInfo(text_code, text_num)
{
    textingCode.html(text_code);
    textingNumber.html(text_num);
}

function animatingOff()
{
    attractIsAnimating = false;
}


createLights();

var playnowTween = PulseScaling($('#gameplay-flavortext'), 1, 1.2);
attractTweens.push(playnowTween);

function attractAnimations() {
  turnOnAnimations();
  restartAnimations(attractTweens);
}
function createLights() {
  var light1 = createLight($('#right-lights .small-light'), '1000px', .5, 'down', 1);
  var light2 = createLight($('#right-lights .large-light'), '-700px', .5, 'up',2);
  var light3 = createLight($('#left-lights .large-light'), '0', .5, 'down',1.5);
  var light4 = createLight($('#left-lights .small-light'), '320px' , .5, 'up', .75);

  attractTweens.push(light1);
  attractTweens.push(light2);
  attractTweens.push(light3);
  attractTweens.push(light4);

  // resetAnimations();
}


function resetAnimations() {
  restartAnimations(lightTweens);
  // resetAnimation($('#gameplay-flavortext'));
}
