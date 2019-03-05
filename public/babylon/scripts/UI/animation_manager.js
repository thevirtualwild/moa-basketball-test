// function AnimateLights(element, speed) {
//   TweenMax.to(element, speed, {rotation:-72deg, translateX:-500, translateY:-192, delay: speed});
//
//       // TweenMax.to(firstName, textFadeTime, {opacity:1, delay: textFadeTime});
//       // TweenMax.to(lastName, textFadeTime, {opacity:1, delay: textFadeTime});
// }



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
