var dragItem = document.querySelector("#avatar-me");
var container = document.querySelector("#container");

var active = false;
var currentX;
var currentY;
var initialX;
var initialY;
var xOffset = 0;
var yOffset = 0;

container.addEventListener("touchstart", dragStart, false);
container.addEventListener("touchend", dragEnd, false);
container.addEventListener("touchmove", drag, false);

container.addEventListener("mousedown", dragStart, false);
container.addEventListener("mouseup", dragEnd, false);
container.addEventListener("mousemove", drag, false);

function dragStart(e) {
  if (e.type === "touchstart") {
    initialX = e.touches[0].clientX;
    initialY = e.touches[0].clientY;
  } else {
    initialX = e.clientX;
    initialY = e.clientY;
  }

  if (e.target === dragItem) {
    active = true;
  }
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;

  active = false;

  var actualY = parseInt(dragItem.style.top, 10) + yOffset;
  var actualX = parseInt(dragItem.style.left, 10) + xOffset;

  // also update locally
  app['my_saved_location']['x'] = actualX;
  app['my_saved_location']['y'] = actualY;
  dragItem.style.transform = "none";

  // update firebase with new position
  var newPos = [actualX, actualY]
  console.group('Updating location in DB...')
  console.info(newPos)
  app.pushMovement(newPos)
  console.groupEnd()
}

function drag(e) {
  if (active) {

    e.preventDefault();

    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, dragItem);
  }
}

function setTranslate(xPos, yPos, el) {

  el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
}
