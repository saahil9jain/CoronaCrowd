var dragItem = document.querySelector("#avatar-me");
var container = document.querySelector("#container");

var active = false;
var currentX;
var currentY;
var initialX;
var initialY;
var xOffset = 0;
var yOffset = 0;

// for key control
var xKeyOffset = 0;
var yKeyOffset = 0;


container.addEventListener("touchstart", dragStart, false);
container.addEventListener("touchend", dragEnd, false);
container.addEventListener("touchmove", drag, false);

container.addEventListener("mousedown", dragStart, false);
container.addEventListener("mouseup", dragEnd, false);
container.addEventListener("mousemove", drag, false);

// add event listeners for keydown (to prevent default scrolling behavior) and keyup (to update my position)
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

function handleKeyDown(e) {
  console.group('Keydown occured!')

  const key = e.keyCode
  const arrow_keys = [38, 40, 37, 39]

  // prevent page scroll
  if (arrow_keys.includes(key)) {
    e.preventDefault()
    console.log('arrow key was pressed! stopping document from scrolling')
  }

  console.groupEnd()
}

function handleKeyUp(e) {
  // check which arrow keys
  console.group('Keyup occured!')
  switch(e.keyCode) {
    case 38:
      // up
      console.log('up')

      // move
      var yTranslate = yKeyOffset - 50
      setTranslate(xKeyOffset, yTranslate, dragItem);

      // increment
      yKeyOffset = yTranslate

      break;
    case 40:
      // down
      console.log('down')

      // move
      var yTranslate = yKeyOffset + 50
      setTranslate(xKeyOffset, yTranslate, dragItem);

      // increment
      yKeyOffset = yTranslate

      break;
    case 37:
      // left
      console.log('left')

      // move
      var xTranslate = xKeyOffset - 50
      setTranslate(xTranslate, yKeyOffset, dragItem);

      // increment
      xKeyOffset = xTranslate

      break;
    case 39:
      // right
      console.log('right')

      // move
      var xTranslate = xKeyOffset + 50
      setTranslate(xTranslate, yKeyOffset, dragItem);

      // increment
      xKeyOffset = xTranslate

      break;
  }
  console.groupEnd()

  // calculate position with offset
  const newPos = calculateMyNewPos(xKeyOffset, yKeyOffset)

  // update for drag
  initialX = xKeyOffset
  initialY = yKeyOffset

  // update firebase with new position
  app.pushMovement(newPos)
}


function dragStart(e) {
  if (e.type === "touchstart") {
    initialX = e.touches[0].clientX - xOffset;
    initialY = e.touches[0].clientY - yOffset;
  } else {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
  }

  if (e.target === dragItem) {
    active = true;
  }
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;

  active = false;

  // calculate position with offset
  const newPos = calculateMyNewPos(currentX, currentY)

  // update firebase with new position
  app.pushMovement(newPos)
}

function calculateMyNewPos(translatedX, translatedY) {
  // calculate position: currentX is relative to center, not left and top
  var actualX = _DB.my_location[0] + translatedX
  var actualY = _DB.my_location[1] + translatedY

  var newPos = [actualX, actualY]

  return newPos
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
