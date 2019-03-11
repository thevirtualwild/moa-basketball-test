// texting info
var texting_code = 'BBALL';
var texting_number = '12345';

// used in both player.js and court.js
var ISTEAMGAME = 'false';

//player variables


// court.js variables
var initLoadTime = 1; //was 7
var currentLoadTime = 1; //was 7

var USEMASTERSLAVEMODE = true;
var ISMASTER;
if (USEMASTERSLAVEMODE) {
  ISMASTER = false;
} else {
  ISMASTER = true;
}


var attractShots = [-.12, 1.2, 1.1, .3, 1, -.2, -2.5, 1.8, 0, 3.2];

var initWaitTime = 15; //was 15
var initGameTime = 60; //was 30
var initResultsTime = 10; //was 10

var loadScreenFadeTime = 1;







var results_breakpoints = {
  "loser":
  {
    "points"        : "N/A",
    "message_line1" : "Don't Quit",
    "message_line2" : "Your Day Job!",
    "redirect_url"  : "https://stackoverflow.com"
  },
  "bad":
  {
    "points"        : 6,
    "message_line1" : "Time To",
    "message_line2" : "Go Pro!",
    "redirect_url"  : "https://google.com"
  },
  "okay":
  {
    "points"        : 10,
    "message_line1" : "Time To",
    "message_line2" : "Go Pro!",
    "redirect_url"  : "https://bing.com"
  },
  "good": {
    "points"        : 12,
    "message_line1" : "Time To",
    "message_line2" : "Go Pro!",
    "redirect_url"  : "https://yahoo.com"
  },
  "great": {
    "points"        : 16,
    "message_line1" : "Time To",
    "message_line2" : "Go Pro!",
    "redirect_url"  : 'https://netflix.com'
  }
}
