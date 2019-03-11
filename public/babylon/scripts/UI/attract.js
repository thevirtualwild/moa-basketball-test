var textFadeTime = 0.5;

var canvas = document.getElementById("canvas");

var gameCodeText = $("#gamecode-text");
var textingCode = $("#texting-code");
var textingNumber = $("#texting-number");
var attractTextContainer = $('.attract-state .text-container');
var info_layer = $('.info-layer');

// var attractItems = document.getElementsByClassName("attract-state");

var initAttractLoad = true;
var attractIsAnimating = false;
function UIAttractAnimateIn()
{
    attractAnimations();

    if(!attractIsAnimating)
    {
      turnOnAnimations()
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
    attractAnimations();
}

function turnOffAttract()
{
    changeVisibility('attract-state', 'hidden');
    changeDisplay('attract-state', 'none');
    turnOffAnimations();

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


function attractAnimations() {
  turnOnAnimations();
  AnimateLights($('#right-lights .small-light'), '1000px', .5, 'down', 1);
  AnimateLights($('#right-lights .large-light'), '-700px', .5, 'up',2);
  AnimateLights($('#left-lights .large-light'), '0', .5, 'down',1.5);
  AnimateLights($('#left-lights .small-light'), '320px' , .5, 'up', .75);
  PulseScaling($('#gameplay-flavortext'), 1, 1.2);
}
