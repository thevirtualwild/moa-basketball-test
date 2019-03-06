function AnimateLights(element, speed, direction, delay) {
  // var delay = 0;
  // var modX = -10;

  if (direction == 'down') {
    // delay = 1;
    // modX = 10;
    // modY = -10;
  }

  // var toX = (modX * 64);
  // var toY = (modY * 200);
  var toY = 2200;

  var timeoftransition = 1 - (speed /(speed +1));
  // x:(toX),
  TweenMax.to(element, timeoftransition, { y:(toY), repeat: -1, delay: delay, repeatDelay:delay/2, ease: Sine.easeInOut});
}

function PulseScaling(element, speed, scaleamount) {
  var delay = 0;

  TweenMax.to(element, speed, { scale: scaleamount, repeat: -1, delay: delay, ease: Sine.easeInOut, yoyo:true});
}


function turnOnAnimations() {
  $('#animation-container').css({display:'block', visibility:'visible' });
}
function turnOffAnimations() {
  $('#animation-container').css({display:'none', visibility:'hidden' });
}



function animateLeftFromX(element, xamount, time, delay, _oncomplete) {
  // var endX = element.position.left;

  element.css({'margin-left': xamount });
  TweenMax.to(element, time, { opacity:1, delay: delay, ease:Sine.easeInOut});
  TweenMax.to(element, time, { marginLeft: 0, delay: delay, ease: Sine.easeInOut });
}
function animateLeftToX(element, xamount, time, delay, _oncomplete) {
  // var endX = element.position.left;

  TweenMax.to(element, time, { opacity:0, delay: delay, ease:Sine.easeInOut, onComplete: _oncomplete});
  TweenMax.to(element, time, { marginLeft: xamount, delay: delay, ease: Sine.easeInOut, onComplete: _oncomplete });
}
