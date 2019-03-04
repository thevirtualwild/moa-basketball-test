var $el = $("#screen-wrapper");
var elHeight = $el.outerHeight();
var elWidth = $el.outerWidth();

var $wrapper = $("#resizeable-wrapper");

$wrapper.resizable({
  resize: doResize
});

function doResize(event, ui) {

  var scale, origin;

  scale = Math.min(
    ui.size.width / elWidth,
    ui.size.height / elHeight
  );

  $el.css({
    transform: "scale(" + scale + ")" // + "translate(-50%, -50%) "
  });

}

var starterData = {
  size: {
    width: $wrapper.width(),
    height: $wrapper.height()
  }
}
doResize(null, starterData);
