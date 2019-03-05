var textFadeTime = 2;

var canvas = document.getElementById("canvas");
var transitioned = false;
//
// var footerLeft = document.getElementById("footerLeft");
// var footerCenter = document.getElementById("footerCenter");
// var playNow= document.getElementById("playNow");
// var comboBadge= document.getElementById("comboBadge");
//
// //var waitingLeft = document.getElementById("footerLeft").getElementsByClassName("waitingLeft")[0];
// //var waitingRight = document.getElementById("footerCenter").getElementsByClassName("waitingRight")[0];
var countdown = $("#waiting-timer");
var countdown_num = $('#waiting-timer .countdown-num');
var textWaiting = $("#infobar-content .waiting-state .text-container");

var waiting_timer = document.getElementById("waiting-timer");

var initWaitingLeftTextPos;

function UIWaitingAnimateIn()
{
    //initWaitingLeftTextPos = textWaiting.style.left;
    // console.log(initWaitingLeftTextPos);
    transitioned = false;
    turnOnWaiting();

    //textWaiting.style.left = footerWidth + "px";
    TweenMax.to(countdown, textFadeTime, {opacity:1, delay: textFadeTime,ease:Sine.easeInOut});
    TweenMax.to(textWaiting, textFadeTime, {opacity:1, delay: textFadeTime, ease:Sine.easeInOut});
}

function turnOnWaiting()
{
    changeVisibility('waiting-state', 'visible');
    changeDisplay('waiting-state', 'block');

    // waitingLeft.style.display = "inline";
    // waitingRight.style.display = "inline"
    // countdown.style.opacity = 1;
    // textWaiting.style.opacity = 1;
    // textWaiting.style.left = "9%";
}
function turnOffWaiting()
{
  changeVisibility('waiting-state','hidden');
  changeDisplay('waiting-state', 'none');
}

function UIWaitingAnimateOut()
{
    TweenMax.to(countdown, textFadeTime, {opacity:0, delay: textFadeTime, onComplete: UIGameplayAnimateIn});
    TweenMax.to(textWaiting, textFadeTime, {opacity:0, delay: textFadeTime, onComplete: turnOffWaiting});
    // TweenMax.to(textWaiting, textFadeTime, {left: initWaitingLeftWidth + 300 , delay: textFadeTime})
}

function UIWaitingUpdateClock(time)
{
    countdown_num.text((Math.ceil(time.toFixed(2)) + 1).toString());

    if(time+1 <= 0 && transitioned == false)
    {
        transitioned = true;
        countdown_num.text("0");
        if(hasplayer)
        UIWaitingAnimateOut();
    }
    else if(time+1<0)
    {
        countdown_num.text("0");
    }
}
