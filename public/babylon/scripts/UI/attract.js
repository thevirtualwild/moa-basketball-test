var textFadeTime = 0.5;

var canvas = document.getElementById("canvas");

var gameCodeText = document.getElementById("gamecode-text");
var textingCode = document.getElementById("texting-code");
var textingNumber = document.getElementById("texting-number");
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
    PulseScaling($('#gameplay-flavortext'), 1, 1.1);

    if(!attractIsAnimating)
    {
        turnOnAttract();
        attractIsAnimating = true;
        console.log("UIATTRACTANIMATEIN");
        //onComplete:animatingOff;
        animatingOff();
    }

    TweenMax.to(attractTextContainer, textFadeTime, {opacity:1});
    TweenMax.to(gameCodeText, textFadeTime, {opacity:1});
    TweenMax.to(info_layer, textFadeTime, {opacity:1, delay: textFadeTime, ease:Sine.easeInOut});

}

function UIAttractAnimateOut()
{
    //onComplete: turnOffAttract
    TweenMax.to(attractTextContainer, textFadeTime, {opacity:0, onComplete:turnOffAttract});
    TweenMax.to(gameCodeText, textFadeTime, {opacity:0});
    TweenMax.to(info_layer, textFadeTime, {opacity:0, delay: textFadeTime, ease:Sine.easeInOut});
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
    gameCodeText.innerHTML = name;

    UIAttractUpdateTextingInfo(texting_code, texting_number);
}
function UIAttractUpdateTextingInfo(text_code, text_num)
{
    textingCode.innerHTML = text_code;
    textingNumber.innerHTML = text_num;
}

function animatingOff()
{
    attractIsAnimating = false;
}
