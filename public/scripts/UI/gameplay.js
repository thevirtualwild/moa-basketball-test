var gameplayFadeTime = 0.5;

var pages = $(".pages");
var canvas = $("#canvas");
var inputForm = $(".form");
var customizeForm = $(".form");
var gameoverForm = $(".form");
var refreshLogo = $("#refreshLogo");
var refreshImg = $("#refresh");
// var inputPage = $("#passcodePage");
var passcodePage = $("#passcodePage");
var playerPage = $("#playerPage");

var headerInstructions = $("#headerInstructions");
var background = $("#background");

function UIGameplayAnimateIn()
{
  turnOnGameplay();
  background.css({pointerEvents:"none"});
  passcodePage.css({pointerEvents:"none"});
  playerPage.css({pointerEvents:"none"});

  TweenMax.to(headerInstructions, customizeFadeTime, {delay:customizeFadeTime, top:50});
  TweenMax.to(headerInstructions, customizeFadeTime, {delay:customizeFadeTime*2, opacity:1});
}

function UIGameplayAnimateOut()
{
  TweenMax.to(headerInstructions, customizeFadeTime, {delay:customizeFadeTime, top:50});
  TweenMax.to(headerInstructions, customizeFadeTime, {delay:customizeFadeTime, opacity:0, onComplete: UIInputAnimateIn});
  turnOffGameplay();
}

function turnOnGameplay()
{
  changeVisibility('gameplay-state', 'visible');
  changeDisplay('gameplay-state', 'block');

  // waitingLeft.style.display = "inline";
  // waitingRight.style.display = "inline"
  // countdown.style.opacity = 1;
  // textWaiting.style.opacity = 1;
  // textWaiting.style.left = "9%";
}
function turnOffGameplay()
{
  changeVisibility('gameplay-state','hidden');
  changeDisplay('gameplay-state', 'none');
  redirectNormal();
}

function redirectNormal() {
  console.log('trying to redirect');
  // console.dir(resultsdata);
  window.location.href = ("http://www.ampthink.com/");
}
