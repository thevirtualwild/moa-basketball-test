var screenOverlay = document.getElementById("screen-overlay");



function loadScreenAnimateOut() {
  console.log('fadeout loading screen');
  TweenMax.to(screenOverlay, loadScreenFadeTime, {opacity:0, delay: loadScreenFadeTime});
}
