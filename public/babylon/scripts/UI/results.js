var textFadeTimeResults = .5;

var canvas = document.getElementById("canvas");

var footer = document.querySelector("footer");
var footerLeft = document.getElementById("footerLeft");
var footerCenter = document.getElementById("footerCenter");
var playNow = document.getElementById("playNow");
var comboBadge = document.getElementById("comboBadge");
var inner = document.getElementById("inner");
var results = document.getElementById("results");
var topScore = document.getElementById("topScore");
var yourScore = document.getElementById("yourScore");



var infobar_content = document.getElementById('infobar-content');
var game_overlay = document.getElementById('game-overlay');


var winner_stats = document.getElementById('winner-stats');
var winner_score = winner_stats.getElementsByClassName('playerscore')[0];
var winner_streak = winner_stats.getElementsByClassName('playerstreak')[0];
var winner_score_num = winner_score.getElementsByClassName('stat-num')[0];
var winner_streak_num = winner_streak.getElementsByClassName('stat-num')[0];

var player_stats = document.getElementById('player-stats');
var player_score = player_stats.getElementsByClassName('playerscore')[0];
var player_streak = player_stats.getElementsByClassName('playerstreak')[0];
var player_score_num = player_score.getElementsByClassName('stat-num')[0];
var player_streak_num = player_streak.getElementsByClassName('stat-num')[0];


var winner_name = infobar_content.getElementsByClassName('results-state')[0].getElementsByClassName('playername-container')[0];
var winner_name_first = winner_name.getElementsByClassName('firstname')[0];
var winner_name_last = winner_name.getElementsByClassName('lastname')[0];

// var player_name = game_overlay.getElementsByClassName('results-state')[0].getElementsByClassName('playername-container')[0];
// var player_name_first = player_name.getElementsByClassName('firstname')[0];
// var player_name_last = player_name.getElementsByClassName('lastname')[0];

//UIResultsAnimateIn();
//UIResultsAnimateOut();

var body = document.body,
    html = document.documentElement;

var height = Math.max( body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight );

var width = Math.max(
    document.documentElement["clientWidth"],
    document.body["scrollWidth"],
    document.documentElement["scrollWidth"],
    document.body["offsetWidth"],
    document.documentElement["offsetWidth"]
);

var winner = false;

var widthTweenDistance;
var heightTweenDistance;

// // yourFirstName.innerHTML = "";
// // yourLastName.innerHTML = "";
//
// topFirstName.innerHTML = "";
// topLastName.innerHTML = "";

// topScoreText.innerHTML = "0";
// yourScoreText.innerHTML = "0";

var animating = false;
var currentScore;
var currentName;
function UIResultsAnimateIn()
{
    turnOnResults();

    console.log("ANIMATE RESULTS IN");
    animating = false;

    inner.style.backgroundColor = "transparent";

    // TweenMax.to(inner, textFadeTime, {backgroundColor: "rgba(0,0,0,0.8)"});
    //
    // TweenMax.to(topScore, textFadeTimeResults, {delay: textFadeTimeResults, marginLeft: 0, ease:Back.easeOut});
    // TweenMax.to(topScore, textFadeTimeResults*2, {delay: textFadeTimeResults, opacity: 1});

    // if(!winner)
    // {
    //     console.log("TWEENING IN YOUR LOSER SCORE");
    //     TweenMax.to(yourScore, textFadeTimeResults, {delay: textFadeTimeResults*2, marginRight: 0, ease:Back.easeOut});
    //     TweenMax.to(yourScore, textFadeTimeResults*2, {delay: textFadeTimeResults*2, opacity: 1});
    // }
    //
    // TweenMax.to(teamScores, textFadeTimeResults, {delay: textFadeTimeResults*3, opacity: 1});
    //
    // TweenMax.to(team1, textFadeTimeResults, {delay: textFadeTimeResults*3.5, marginTop: 0, ease:Back.easeOut});
    // TweenMax.to(team1, textFadeTimeResults*2, {delay: textFadeTimeResults*3.5, opacity: 1});
    //
    // TweenMax.to(team2, textFadeTimeResults, {delay: textFadeTime*3.7, marginTop: 0, ease:Back.easeOut});
    // TweenMax.to(team2, textFadeTimeResults*2, {delay: textFadeTime*3.7, opacity: 1});
    //
    // TweenMax.to(team3, textFadeTimeResults, {delay: textFadeTimeResults*3.9, marginTop: 0, ease:Back.easeOut});
    // TweenMax.to(team3, textFadeTimeResults*2, {delay: textFadeTimeResults*3.9, opacity: 1});
}

function UIResultsAnimateOut()
{
    if(animating) return;

    // TweenMax.to(topScore, textFadeTimeResults, {delay: textFadeTimeResults, marginLeft: width, ease:Back.easeOut});
    // TweenMax.to(topScore, textFadeTimeResults, {delay: textFadeTimeResults, opacity: 0});
    // TweenMax.to(yourScore, textFadeTimeResults, {delay: textFadeTimeResults, marginRight: width, ease:Back.easeOut});
    // TweenMax.to(yourScore, textFadeTimeResults, {delay: textFadeTimeResults, opacity: 0});
    //
    // TweenMax.to(teamScores, textFadeTimeResults, {delay: textFadeTimeResults, opacity: 0});
    //
    // TweenMax.to(team1, textFadeTimeResults, {delay: textFadeTimeResults, marginTop: height, ease:Back.easeOut});
    // TweenMax.to(team1, textFadeTimeResults, {delay: textFadeTimeResults, opacity: 0});
    //
    // TweenMax.to(team2, textFadeTimeResults, {delay: textFadeTimeResults, marginTop: height, ease:Back.easeOut});
    // TweenMax.to(team2, textFadeTimeResults, {delay: textFadeTimeResults, opacity: 0});
    //
    // TweenMax.to(team3, textFadeTimeResults, {delay: textFadeTimeResults, marginTop: height, ease:Back.easeOut});
    // TweenMax.to(team3, textFadeTimeResults, {delay: textFadeTimeResults, opacity: 0});
    //
    // TweenMax.to(inner, textFadeTimeResults, {backgroundColor: "rgba(0,0,0,0.0)", delay:textFadeTimeResults});

    turnOffResults();

    animating = true;

    currentScore = 0;
}

function turnOnResults()
{
    changeVisibility('results-state', 'visible');
    changeDisplay('results-state', 'block');
}
function turnOffResults()
{
  changeVisibility('results-state','hidden');
  changeDisplay('results-state', 'none');
}


function UIResultsUpdateName(name)
{
    currentName = name;
    // yourFirstName.innerHTML = name.substr(0, name.indexOf(' '));
    // yourLastName.innerHTML = name.substr(name.indexOf(' ') + 1);
}

function UIResultsUpdateScore(playerScore)
{
  //TODO: Should only be called in court during results phase
    // console.log('UIResultsUpdateScore:');
    // console.dir(playerScore);
    // if(playerScore === undefined){
    //     currentScore = 0;
    //     player_score_num.innerHTML = currentScore.toString();
    // }
    // else {
    //     currentScore = playerScore;
    //     player_score_num.innerHTML = playerScore.toString();
    // }

}

function UIResultsSetData(data) {
    if(data.resultsdata.highscorer === undefined)
    {
        winner = true;
        winner_score_num.innerHTML = currentScore.toString();
        // // topFirstName.innerHTML = currentName.substr(0, currentName.indexOf(' '));
        // // topLastName.innerHTML = currentName.substr(currentName.indexOf(' ') + 1);
        // yourScore.style.display = "none";
        console.log("HI SCORER IS UNDEFINED");
    }
    else
    {

        if(currentScore === undefined){
            currentScore = 0;
            player_score_num.innerHTML = currentScore.toString();
        }


        if(currentScore >= data.resultsdata.highscorer.score)
        {
            ShowYouWonResults(data);
        }
        else
        {
            ShowYouLostResults(data);
        }
    }
}


function ShowYouWonResults(data) {
  winner = true;
  player_score_num.innerHTML = currentScore.toString();
  player_name_first.innerHTML = currentName.substr(0, currentName.indexOf(' '));
  player_name_last.innerHTML = currentName.substr(currentName.indexOf(' ') + 1);
  winner_stats.style.display = "none";
  winner_name.style.display = "none;"

  console.log("YOU ARE HIGH SCORER " + currentScore + " top score " + data.resultsdata.highscorer.score);
}
function ShowYouLostResults(data) {
  winner = false;

  player_score_num.innerHTML = currentScore.toString();

  // winner_stats.style.display = "none";
  // winner_name.style.display = "none;"

  var winnername = data.resultsdata.highscorer.player.username;
  winner_name_first.innerHTML = winnername.substr(0, winnername.indexOf(' '));
  winner_name_last.innerHTML = winnername.substr(winnername.indexOf(' ') + 1);

  winner_score_num.innerHTML = data.resultsdata.highscorer.score;
  console.log("YOU LOST TO HIGH SCORER " + currentScore + " top score " + data.resultsdata.highscorer.score);
}
