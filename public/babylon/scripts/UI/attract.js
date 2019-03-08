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
    AnimateLights($('#right-lights .small-light'), .5, 'down', 1);
    AnimateLights($('#right-lights .large-light'), .5, 'up',2);
    AnimateLights($('#left-lights .large-light'), .5, 'down',1.5);
    AnimateLights($('#left-lights .small-light'), .5, 'up', .75);
    PulseScaling($('#gameplay-flavortext'), 1, 1.2);

    if(!attractIsAnimating)
    {
        turnOnAttract();
        attractIsAnimating = true;
        console.log("UIATTRACTANIMATEIN");
        //onComplete:animatingOff;
        animatingOff();
    }

    animateLeftFromX(attractTextContainer, '-500px', textFadeTime, textFadeTime);
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
