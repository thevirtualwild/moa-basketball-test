
var textFadeTime = .5;

var comboBadge = $("#score-bonus");
var comboNumText = $("#bonus-num");
console.log('comboNumText');
console.dir(comboNumText);

var infobarContent = $("#infobar-content");
var scoreText = $("#current-score");
var score_label = $("#score-label");
var firstName = $("#infobar-content .firstname");
var lastName = $("#infobar-content .lastname");

var textGameplay = $("#infobar-content .gameplay-state .text-container");
var info_layer = $('.info-layer');

function UIGameplayAnimateIn()
{
  turnOnGameplay();

  firstName.css({opacity:0});
  lastName.css({opacity:0});
  scoreText.css({opacity:0});
  score_label.css({opacity:0});
  comboBadge.css({opacity:0});
  comboNumText.text("1");

  animateLeftFromX(firstName, '-1000px', textFadeTime, textFadeTime);
  animateLeftFromX(lastName, '-1000px', textFadeTime, (textFadeTime * 2));
  animateLeftFromX(score_label, '-500px', textFadeTime, (textFadeTime * 3));
  animateLeftFromX(scoreText, '-500px', textFadeTime, (textFadeTime * 4));
  animateLeftFromX(textGameplay, '0', .2, 0);
  animateLeftFromX(info_layer, '0', .2, 0);
  // TweenMax.to(scoreText, textFadeTime, {opacity:1, delay: textFadeTime});
  // TweenMax.to(firstName, textFadeTime, {opacity:1, delay: textFadeTime});
  // TweenMax.to(lastName, textFadeTime, {opacity:1, delay: textFadeTime});
  // TweenMax.to(textGameplay, textFadeTime, {opacity:1, delay: textFadeTime, ease:Sine.easeInOut});
  // TweenMax.to(info_layer, textFadeTime, {opacity:1, delay: textFadeTime, ease:Sine.easeInOut});
}

function UIGameplayAnimateOut()
{
  animateLeftToX(scoreText, '-500px', textFadeTime/2, textFadeTime, UIResultsAnimateIn);
  animateLeftToX(textGameplay, '0', textFadeTime/2, textFadeTime, turnOffGameplay)
  // TweenMax.to(scoreText, textFadeTime, {opacity:0, delay: textFadeTime,ease:Sine.easeInOut, onComplete: UIResultsAnimateIn});
  // TweenMax.to(textGameplay, textFadeTime, {opacity:0, delay: textFadeTime, ease:Sine.easeInOut, onComplete:turnOffGameplay});
  TweenMax.to(info_layer, textFadeTime, {opacity:0, delay: textFadeTime, ease:Sine.easeInOut});
}

function UIGameplayUpdateScore(scoreInput)
{
  scoreText.html(scoreInput.toString());
  TweenMax.to(scoreText, 0.1, {scaleX:1.2, scaleY:1.2, repeat: 1, yoyo:true});
}

function UIGameplayUpdateName(name)
{
  firstName.html(name.substr(0, name.indexOf(' ')));
  lastName.html(name.substr(name.indexOf(' ') + 1));
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
  TweenMax.to(comboNumText, 0.1, {opacity: 1});
  TweenMax.to(comboBadge, 0.1, {opacity: 1});
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

function UIComboLevelChange(newlevel) {
  console.log('Combo Level Change - ' + newlevel);

  UIGameplayAnimateBadgeOn(newlevel);
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
  // UIResultsAnimateIn();
}
