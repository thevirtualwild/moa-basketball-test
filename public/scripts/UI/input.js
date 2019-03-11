var inputFadeTime = 0.25;

var canvas = document.getElementById("canvas");
var inputForm = $(".form");
var errorMessage = $(".form .errorMessage");
var passcodeInput = $(".form .passcodeInput");
errorMessage.css({opacity:0});
var passcodePage = $("#passcodePage");
var playerPage = $("#playerPage");

var loading_overlay = $('#screen-overlay');

var initPosY;
var body = document.body,
    html = document.documentElement;

var height = Math.max( body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight );

    passcodeInput.val("");
    // passcodeInput.focus();

function UILoadingAnimateOut()
{
  TweenMax.to(loading_overlay, inputFadeTime, {delay:inputFadeTime*4, opacity:0, visibility:'hidden', onComplete: UIInputAnimateIn});
}

function UIInputAnimateIn()
{
  loading_overlay.css({display:'none!important'});

    passcodeInput.val("");
    passcodeInput.blur();
    errorMessage.css({opacity:0});
    passcodePage.css({opacity:1});
    playerPage.css({display:"none"});
    TweenMax.to(inputForm, inputFadeTime*3.5, {delay:inputFadeTime, opacity:1});
    // TweenMax.to(inputForm, inputFadeTime*3, {delay:inputFadeTime, top:height *.4, ease:Back.easeOut});
}

function UIInputAnimateOut()
{
    //console.log()
    // initPosY = parseFloat(inputForm.style.top.substr(0, inputForm.style.top.length-2));
    errorMessage.css({opacity:0});

    TweenMax.to(passcodePage, inputFadeTime*3.5, {delay:inputFadeTime, opacity:0});
    TweenMax.to(inputForm, inputFadeTime*3.5, {delay:inputFadeTime, opacity:0});
}

function UIInputErrorMessage(message)
{
    errorMessage.css({opacity:1});
    errorMessage.css({color:"red"});
    errorMessage.html(message);
}


//
$( document ).ready( function() {
  $('.passcodeInput').blur(function() {
     if(!$.trim(this.value).length) { // zero-length string AFTER a trim
       $(this).addClass('blinking');
     } else {
       $(this).removeClass('blinking');
     }
     $('#footerLogo').show();
     // $('.form .title').show();
     $('.button-container').show();
  });
  $('.passcodeInput').focus(function() {
     $('#footerLogo').hide();
     // $('.form .title').hide();
     $('.button-container').hide();
  });
});
