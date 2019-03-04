var textFadeTime = 0.25;

var canvas = document.getElementById("canvas");

var gameCodeText = document.getElementById("gamecode-text");
var textingCode = document.getElementById("texting-code");
var textingNumber = document.getElementById("texting-number");

// var attractItems = document.getElementsByClassName("attract-state");

var initAttractLoad = true;
var attractIsAnimating = false;
function UIAttractAnimateIn()
{
    AnimateLights($('#right-lights .small-light'), .5, 'left');
    AnimateLights($('#right-lights .large-light'), .5, 'right');
    AnimateLights($('#left-lights .large-light'), .5, 'left');
    AnimateLights($('#left-lights .small-light'), .5, 'right');
    PulseScaling($('#gameplay-flavortext'), 1, 1.1);

    if(!attractIsAnimating)
    {
        turnOnAttract();
        attractIsAnimating = true;
        console.log("UIATTRACTANIMATEIN");
        //onComplete:animatingOff;
        animatingOff();
    }

}

function UIAttractAnimateOut()
{
    //onComplete: turnOffAttract
    turnOffAttract();
    turnOffAnimations();
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
