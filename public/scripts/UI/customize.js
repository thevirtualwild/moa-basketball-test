var customizeFadeTime = 0.5;

var canvas = document.getElementById("canvas");
var inputForm = document.getElementsByClassName("form")[0];
var customizeForm = document.getElementsByClassName("form")[1];
var gameoverForm = document.getElementsByClassName("form")[2];
var refreshLogo = document.getElementById("refreshLogo");
var refreshImg = document.getElementById("refresh");
var inputPage = document.getElementsByClassName("passcode page")[0];
var customizePage = document.getElementsByClassName("player page")[0];
var gameoverPage = document.getElementsByClassName("gameover page")[0];

var firstName = customizeForm.getElementsByClassName("firstName")[0];
var lastName = customizeForm.getElementsByClassName("lastName")[0];

//UIInputAnimateOut();
var name;
var animating;
refreshLogo.addEventListener('click', function (e) {
    changeName();
});

var body = document.body,
    html = document.documentElement;

var height = Math.max( body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight );

function UICustomizeAnimateIn()
{
  turnOnCustomize();
    inputPage.style.display = "none";
    customizePage.style.display = "block";
    gameoverPage.style.display = "none";

    customizeForm.style.top = (.5 * height).toString() + "px";
    customizeForm.style.opacity =1;
    firstName.style.opacity = 0;
    lastName.style.opacity = 0;
    refreshLogo.style.opacity = 0;

    name = userdata.username;
    firstName.innerHTML = name.substr(0, name.indexOf(' '));
    lastName.innerHTML = name.substr(name.indexOf(' ') + 1);

    firstName.style.marginLeft=  "-300px";
    lastName.style.marginRight=  "-300px";

    TweenMax.to(firstName, customizeFadeTime, {delay:customizeFadeTime, opacity:1, marginLeft:0});
    TweenMax.to(lastName, customizeFadeTime, {delay:customizeFadeTime*2, opacity:1, marginRight:0});

    TweenMax.to(refreshLogo, customizeFadeTime, {delay:customizeFadeTime*6, opacity:1});
}

function UICustomizeAnimateOut()
{
    TweenMax.to(customizeForm, customizeFadeTime*1.5, {opacity:0, onComplete:UIGameplayAnimateIn});
    TweenMax.to(refreshLogo, customizeFadeTime*1.5, {opacity:0});
    TweenMax.to(customizeForm, customizeFadeTime*1, {top:0, ease:Back.easeIn});
    turnOffCustomize();
}

function changeName()
{
    if(animating) return;

    TweenMax.to(firstName, customizeFadeTime, {opacity: 0});
    TweenMax.to(lastName, customizeFadeTime, {opacity: 0, onComplete: getName});

    TweenMax.to(refreshImg, customizeFadeTime/5, {scaleX: 1.1, scaleY: 1.1, repeat:1, yoyo:true});

    animating = true;
}

function getName()
{
    name = generateName();

    firstName.innerHTML = name.substr(0, name.indexOf(' '));
    lastName.innerHTML = name.substr(name.indexOf(' ') + 1);

    firstName.style.marginLeft=  "-300px";
    lastName.style.marginRight=  "-300px";

    TweenMax.to(firstName, customizeFadeTime, {opacity: 1, marginLeft: 0});
    TweenMax.to(lastName, customizeFadeTime, {opacity: 1, marginRight: 0, onComplete: stopAnimating});

    userdata.username = name;

    socket.emit("change player name", userdata);

}

function turnOnCustomize()
{
    // changeVisibility('waiting-state', 'visible');
    // changeDisplay('waiting-state', 'block');

    // waitingLeft.style.display = "inline";
    // waitingRight.style.display = "inline"
    // countdown.style.opacity = 1;
    // textWaiting.style.opacity = 1;
    // textWaiting.style.left = "9%";
}
function turnOffCustomize()
{
  // changeVisibility('waiting-state','hidden');
  // changeDisplay('waiting-state', 'none');
}

function stopAnimating()
{
    animating = false;
}
