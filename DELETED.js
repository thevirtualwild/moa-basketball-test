////////////////////////////////////////////////////////

//         ***********DELETE AREA ***********         //

//- game stuff
  // var gamesrunning;
  // socket.on('start countdown', function(courtName) {
  //   if (!gamesrunning) {
  //    gamesrunning = true;
  //    // // // // // // // // console.log('countdown started by - ' + courtName);
  //    socket.broadcast.to(socket.roomname).emit('start countdown', courtName);
  //   } else {
  //    // // // // // // // // console.log('countdown already running')
  //   }
  // });

  // function updateGameName(newgamename) {
  //   // console.log('update game name called: ' + newgamename);
  //   console.log('---Step 3---');
  //   console.log('gamename before update: ' + thisgamesroom.gamename);
  //   var thisgamesroom = d_roomnames[socket.roomname];
  //
  //   thisgamesroom.gamename = newgamename;
  //
  //   console.log('gamename after update: ' + thisgamesroom.gamename);
  //
  //   d_roomnames[socket.roomname] = thisgamesroom;
  //   d_allrooms[thisgamesroom.id] = thisgamesroom;
  //   socket.broadcast.to(socket.roomname).emit('update game name', newgamename);
  // }
//- end gamestuff




// todelete:
  //
  // getScoresFromAirtable();
  // function getScoresFromAirtable() {
  //
  //   score_base('Teams').select({}).eachPage(function page(_records, fetchNextPage) {
  //     _records.forEach(function(_record) {
  //       d_teamscores[_record.get('Name')] = {
  //         id: _record.id,
  //         name: _record.get('Name'),
  //         score: _record.get('Cumulative Score')
  //       };
  //     });
  //     fetchNextPage();
  //   }, function done(err) {
  //     if (err) { console.error(err); return; }
  //   });
  // }
// END delete
// to delete:
  // function pushScoreToDatabase(data) //push player score //DAVID: not using this currently
  // {
  //   playername = data.player.username;
  //   var playerstreak = data.highestStreak;
  //   var playershotsmade = data.shotsMade;
  //
  //   playerscore = data.player.score;
  //
  //   if(ISTEAMGAME) {
  //     console.log('oldteamscores');
  //     console.dir(d_teamscores);
  //     oldteam = d_teamscores[data.player.team.name];
  //     oldteam.score += playerscore;
  //     d_teamscores[data.player.team.name] = oldteam;
  //
  //     console.log('newteamscores');
  //     console.dir(d_teamscores);
  //   }
  //
  //   if (playerscore > 0) {
  //
  //     var gamename = socket.game.name;
  //
  //
  //     score_base('Players').create({
  //       "Name": playername,
  //       // "Game": gamename,
  //       "Score": playerscore,
  //       "Longest Streak": playerstreak,
  //       "Shots Made": playershotsmade,
  //       "Submission Date": new Date()
  //     }, function(err, _record) {
  //         if (err) { console.error(err); return; }
  //
  //         //Callback from API push
  //         newplayerid = _record.getId();
  //         // // // // // // // // console.log('NewPlayer - ' + newplayerid);
  //     });
  //   }
  // }
// END Delete
// To Delete, seems redundant or not needAlphaBlending
    // // when the client emits 'add user', this listens and executes
    // socket.on('add user', function(data) {
    //   // dont add the user twice, just return if this is called again.
    //   if (addedUser) return;
    //
    //   // // // // // // // // console.log('add user called - ' + data);
    //   var userdata = '';
    //
    //   // if not valid json object, parse
    //   try {
    //       userdata = JSON.parse(data);
    //       // // // // // // // // console.log('userdata' - userdata);
    //   } catch (e) {
    //       userdata = data;
    //   }
    //
    //   // we store the username in the socket session for this client
    //   socket.username = userdata.username;
    //   ++numUsers;
    //   addedUser = true;
    //
    //   if (numUsers == 1 ) {
    //     socket.team = 'red';
    //     socket.emit('change team', socket.team);
    //   } else if (numUsers == 2) {
    //     socket.team = 'blue';
    //     socket.emit('change team', socket.team);
    //   } else {
    //     socket.team = userdata.team;
    //   }
    //
    //   // fake for now
    //   // socket.roomname = 'GAME';
    //
    //   // // // // // // // // console.log("|New User: " + socket.username + "\n - Chosen team: " + socket.team);
    //
    //   // socket.emit('login', {
    //   //   numUsers: numUsers,
    //   //   roomname: socket.roomname
    //   // });
    //
    //   // // // // // // // // console.log(' - Joined Room: ' + socket.roomname);
    //
    //   // echo globally (all clients) that a person has connected
    //   socket.broadcast.to(socket.roomname).emit('user joined', {
    //     username: socket.username,
    //     team: socket.team,
    //     numUsers: numUsers
    //   });
    // });

    // socket.on('add court', function(courtdata) {
    //   // // // // // // // // console.log('adding court');
    //   // var newCourt = {
    //   //   name: data.courtname,
    //   //   room: socket.roomname
    //   // };
    //   courts[courtdata.name] = socket.roomname;
    //   // // // // // // // // console.log('court name - ' + courtdata.name);
    //   // // // // // // // // console.log('socket room - ' + socket.roomname);
    //   // // // // // // // // // console.log('Courts: ');
    //   // // // // // // // console.dir(courts);
    // });
    // var query;
    //might not need
    // socket.on('query request', function() {
    //   // // // // // // // // console.log('query request received');
    //   if (query) {
    //     // // // // // // // // console.log('there is a query - ' + query);
    //     socket.emit('query', query);
    //   } else {
    //     // // // // // // // // console.log('no query found');
    //     socket.emit('use random query');
    //   }
    // });
    // // app.use(express.static(path.join(__dirname, 'babylon')));
    // //
    // app.get('/game', function(req, res) {
    //     res.sendFile(path.join(__dirname + '/public/game.html'));
    //     query = req.query.room;
    //     // // // // // // // // console.log('webapp routing - ' + query);
    // });
    //
    // // app.get('/rebabylon', function(req, res) {
    // //   var randquery = randomCode(7);
    // //   // // // // // // // // console.log('redirecting');
    // //   res.redirect('/babylon/?roomId=' + randquery);
    // //   // query = randquery;
    // //   // // // // // // // // // console.log('query - ' + query);
    // // });
    //
    // // app.get('/babylon', function(req, res) {
    // //     // // // // // // // // console.log('babylon loaded');
    // //     res.sendFile(path.join(__dirname + '/public/babylon/index.html'));
    // //     // query = req.query.roomId;
    // //     // // // // // // // // // console.log('feed routing bab - ' + query);
    // // });
    //
    //
    // app.set('view engine', 'ejs');
    //
    // app.get('/about', function(req, res) {
    //   res.render('pages/about');
    // });

// Court Delete:

    // socket.on('sync with master', function(_syncData)
    // {
    //     if(courtName == _syncData.courtname)
    //     {
    //         if(masterData === undefined)
    //         {
    //             masterData            = _syncData.syncdata;
    //         }
    //         else
    //         {
    //             if(masterData.score == true)
    //             {
    //                 masterData        = _syncData.syncdata;
    //                 masterData.score  = true;
    //             }
    //             else
    //             {
    //                 masterData        = _syncData.syncdata;
    //             }
    //         }
    //
    //         readyToSync = true;
    //
    //         if(!ISMASTER)
    //         {
    //             //console.log("SYNC WITH MASTER");
    //
    //             if(netPhysicsDisabled == false)
    //             {
    //                 for(var i = 0; i < netSpheres.length; i++)
    //                 {
    //                     netSpheres[i].physicsImpostor.dispose();
    //                 }
    //
    //                 netPhysicsDisabled = true;
    //             }
    //         }
    //     }
    //     else
    //     {
    //         //console.log("COURT NAMES DON't MATCH");
    //     }
    // });

//       *********** END DELETE AREA ***********       //

// Player stuff //

//
// function joinCourt(someCourt) {
//   // calls functions from /babylon/scrips/playerInfo.js (generate Functions)
//
//   username = generateName();
//   team = generateTeam();
//
//   var courttojoin = someCourt;
//   if (courttojoin) {
//       courttojoin = courttojoin.toUpperCase();
//   } else {
//       courttojoin = 'GAME';
//   }
//
//   g_overlayMaterial.ambientColor = defaultColor3;
//
//   userdata = {
//       'username': username,
//       'team': team,
//       'court': courttojoin
//   };
//
//   console.log('JOINCOURT: Court name - ' + courttojoin);
//   // Tell the server your new room to connect to
//   socket.emit('player wants to join court', userdata);
// }
//- END Game Start Functions


////////////////////////////////////////////////////////
