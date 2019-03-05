var textFadeTimeResults = .5;

var canvas = $('#canvas');

var infobar_content = $('#infobar-content');
var game_overlay = $('#game-overlay');

var winner_stats = $('#winner-stats');
var winner_ribbon = $('#winner-ribbon');
var winner_trophy = $('#winner-trophy');
var winner_score = $('#winner-stats .playerscore');
var winner_streak = $('#winner-stats .playerstreak');
var winner_score_num = $('#winner-stats .playerscore .stat-number');
var winner_streak_num = $('#winner-stats .playerstreak .stat-number');

var player_stats = $('#player-stats');
var player_score = $('#player-stats .playerscore');
var player_streak = $('#player-stats .playerstreak');
var player_score_num = $('#player-stats .playerscore .stat-number');
var player_streak_num = $('#player-stats .playerstreak .stat-number');

var winner_name = $('#infobar-content .results-state .playername-container');
var winner_name_first = $('#infobar-content .results-state .playername-container .firstname');
var winner_name_last = $('#infobar-content .results-state .playername-container .lastname');

var results_flavor_text = $('#results-flavortext');

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

var animating = false;
var currentScore;
var currentName;
function UIResultsAnimateIn()
{
    turnOnResults();

    console.log("ANIMATE RESULTS IN");
    animating = false;

    // if(!winner)
    // {
    //     console.log("TWEENING IN YOUR LOSER SCORE");
    //     TweenMax.to(yourScore, textFadeTimeResults, {delay: textFadeTimeResults*2, marginRight: 0, ease:Back.easeOut});
    //     TweenMax.to(yourScore, textFadeTimeResults*2, {delay: textFadeTimeResults*2, opacity: 1});
    // }

}

function UIResultsAnimateOut()
{
    if(animating) return;

    turnOffResults();

    animating = true;

    currentScore = 0;
}

function turnOnResults()
{
    changeVisibility('results-state', 'visible');
    changeDisplay('results-state', 'block');
    turnOnAnimations();
    turnOnResultsBackground();
}
function turnOffResults()
{
  changeVisibility('results-state','hidden');
  changeDisplay('results-state', 'none');
  turnOffAnimations();
  turnOffResultsBackground();
}


function UIResultsUpdateName(name)
{
  //Not Used in current results screen
  currentName = name;
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

function UIResultsSetData(topScoreData,playerScoreData) {
  console.log('UIRESULTSSETDATA');
    var playerscore = playerScoreData.score;
    var playerstreak = playerScoreData.highestStreak;

    var winnername = topScoreData.resultsdata.highscorer.player.username;
    var winnerscore = topScoreData.resultsdata.highscorer.score;
    var winnerstreak = topScoreData.resultsdata.highscorer.highestStreak;

    if(winnerscore === undefined)
    {
        winner = true;
        player_score_num.text(playerscore.toString());
        player_streak_num.text(playerstreak.toString());

        console.log("HI SCORER IS UNDEFINED");
    }
    else
    {
        if(playerscore === undefined){
            currentScore = 0;
            player_score_num.text(playerscore.toString());
            player_streak_num.text(playerstreak.toString());
        }

        resultsdata = {
          playerscore: playerscore,
          playerstreak: playerstreak,
          winnername: winnername,
          winnerscore: winnerscore,
          winnerstreak: winnerstreak
        }

        if(playerscore >= winnerscore)
        {
            winner = true;
            ShowYouWonResults(resultsdata);

            if(playerscore >= results_breakpoints["okay"].points) {
              message = results_breakpoints["okay"].message_line1 + '<br/>'
                + results_breakpoints["okay"].message_line2;
            } else if (playerscore >= results_breakpoints["good"].points) {
              message = results_breakpoints["good"].message_line1 + '<br/>'
                + results_breakpoints["good"].message_line2;
            } else if (playerscore >= results_breakpoints["great"].points) {
              message = results_breakpoints["great"].message_line1 + '<br/>'
                + results_breakpoints["great"].message_line2;
            } else {
              message = results_breakpoints["bad"].message_line1 + '<br/>'
                + results_breakpoints["bad"].message_line2;
            }


            ShowCustomMessage(message);
        }
        else
        {
            ShowYouLostResults(resultsdata);
            message = results_breakpoints["loser"].message;


            ShowCustomMessage(message);
        }

    }
}


function ShowCustomMessage(message) {
  results_flavor_text.html(message);
}


function ShowYouWonResults(resultsdata) {
  console.log('You Won Results');
  console.log(resultsdata);
  player_score_num.text(resultsdata.playerscore.toString());
  player_streak_num.text(resultsdata.playerstreak);
  // player_name_first.innerHTML = currentName.substr(0, currentName.indexOf(' '));
  // player_name_last.innerHTML = currentName.substr(currentName.indexOf(' ') + 1);
  winner_stats.css({display:"none"});
  winner_name.css({display:"none"});
  winner_trophy.css({display:"block"});
  winner_ribbon.css({display:"block"});

  console.log("YOU ARE HIGH SCORER " + resultsdata.playerscore + " top score " + resultsdata.winnerscore);
}
function ShowYouLostResults(resultsdata) {
  console.log('You Lost Results:');
  console.log(resultsdata);

  winner = false;

  player_score_num.text(resultsdata.playerscore.toString());

  winner_stats.css({display:"block"});
  winner_name.css({display:"block"});
  winner_trophy.css({display:"none"});
  winner_ribbon.css({display:"none"});

  winner_name_first.text(resultsdata.winnername.substr(0, winnername.indexOf(' ')));
  winner_name_last.text(resultsdata.winnername.substr(winnername.indexOf(' ') + 1));

  winner_score_num.text(resultsdata.winnerscore);
  console.log("YOU LOST TO HIGH SCORER " + resultsdata.playerscore + " top score " + resultsdata.winnerscore);
}

function turnOnResultsBackground() {
  $('#animation-container .overlay-background').css({display:'block'});
}
function turnOffResultsBackground() {
  $('#animation-container .overlay-background').css({display:'none'});
}
