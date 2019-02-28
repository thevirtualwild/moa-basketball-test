function changeVisibility(className, visibilityDesired){
    var elements = document.getElementsByClassName(className)

    for (var i = 0; i < elements.length; i++){
        elements[i].style.visibility = visibilityDesired;
    }
}
function changeDisplay(className, displayDesired){
    var elements = document.getElementsByClassName(className)

    for (var i = 0; i < elements.length; i++){
        elements[i].style.display = displayDesired;
    }
}
