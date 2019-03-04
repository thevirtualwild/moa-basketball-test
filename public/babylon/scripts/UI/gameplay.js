
var textFadeTime = .5;

var canvas = document.getElementById("canvas");

var comboBadge = $("#score-bonus");
var comboNumText = $("#bonus-num");
console.log('comboNumText');
console.dir(comboNumText);

var infobarContent = document.getElementById("infobar-content");

var scoreText = document.getElementById("current-score");
// var scoreLabel = gameplayLeft.getElementsByClassName("textScoreLabel")[0];
var firstName = infobarContent.getElementsByClassName("firstname")[0];
var lastName = infobarContent.getElementsByClassName("lastname")[0];

function UIGameplayAnimateIn()
{
  turnOnGameplay();

  firstName.style.opacity = 0;
  lastName.style.opacity = 0;
  scoreText.style.opacity = 0;
  comboBadge.css({opacity:0});
  comboNumText.text("1");

  TweenMax.to(scoreText, textFadeTime, {opacity:1, delay: textFadeTime});

  TweenMax.to(firstName, textFadeTime, {opacity:1, delay: textFadeTime});
  TweenMax.to(lastName, textFadeTime, {opacity:1, delay: textFadeTime});
}

function UIGameplayAnimateOut()
{
  turnOffGameplay();
}

function UIGameplayUpdateScore(scoreInput)
{
  scoreText.innerHTML = scoreInput.toString();
  TweenMax.to(scoreText, 0.1, {scaleX:1.2, scaleY:1.2, repeat: 1, yoyo:true});
}

function UIGameplayUpdateName(name)
{
  firstName.innerHTML = name.substr(0, name.indexOf(' '));
  lastName.innerHTML = name.substr(name.indexOf(' ') + 1);
}

function UIGameplayAnimateBadgeOn(comboNum)
{
  // TODO: not ready to start animating combos
  console.log('BADGEON: combonum - ' + comboNum);

  if(comboNum <= 2)
  {
    TweenMax.to(comboNumText, 0.1, {opacity: 1});
    TweenMax.to(comboBadge, 0.1, {opacity: 1});
  }
  comboNumText.text(comboNum.toString());
  turnOnAnimations();
  TweenMax.to(comboNumText, 0.1, {scaleX:1.2, scaleY:1.2, repeat: 1, yoyo:true});
}

function UIGameplayAnimateBadgeOff()
{
  // TODO: not ready to start animating combos
  TweenMax.to(comboBadge, 0.1, {opacity: 0});
  turnOffAnimations();
}

function turnOnGameplay()
{
  changeVisibility('gameplay-state', 'visible');
  changeDisplay('gameplay-state', 'block');
}
function turnOffGameplay()
{
  changeVisibility('gameplay-state','hidden');
  changeDisplay('gameplay-state', 'none');
  UIResultsAnimateIn();
}
