function createLight(element, initialX, speed, direction, delay)
{
  // var toX = (modX * 64);
  // var toY = (modY * 200);
  element.css({left:initialX});

  var timeoftransition = 1 - (speed /(speed +1));
  var toY = 2200;

  var newLightTween = TweenMax.to(element, timeoftransition, { y:(toY), repeat: -1, delay: delay, repeatDelay:delay/2, ease: Circ.easeInOut});
  newLightTween.play();

  return newLightTween;
}
function pauseAnimations(tweenArray) {
  for (let animation of tweenArray) {
    animation.pause();
  }
}
function restartAnimations(tweenArray) {
  for (let animation of tweenArray) {
    animation.restart(true);
  }
}

function PulseScaling(element, speed, scaleamount) {
  var delay = 0;

  var newPulseScaleTween = TweenMax.to(element, speed, { scale: scaleamount, repeat: -1, delay: delay, ease: Sine.easeInOut, yoyo:true});

  newPulseScaleTween.play();

  return newPulseScaleTween;
}


function turnOnAnimations() {
  $('#animation-container').css({visibility:'visible' });
}
function turnOffAnimations() {
  $('#animation-container').css({visibility:'hidden' });
}

function resetAnimation(element) {
  element.css({'animation-play-state': 'initial'});
}



function animateLeftFromX(element, xamount, time, delay, _oncomplete) {
  // var endX = element.position.left;

  element.css({'margin-left': xamount });
  TweenMax.to(element, time, { opacity:1, delay: delay, ease:Sine.easeOut});
  TweenMax.to(element, time, { marginLeft: 0, delay: delay, ease: Sine.easeOut });
}
function animateLeftToX(element, xamount, time, delay, _oncomplete) {
  // var endX = element.position.left;

  TweenMax.to(element, time, { opacity:0, delay: delay, ease:Sine.easeIn, onComplete: _oncomplete});
  TweenMax.to(element, time, { marginLeft: xamount, delay: delay, ease: Sine.easeIn, onComplete: _oncomplete });
}
