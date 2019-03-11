const express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 4000;
var Promise = require('promise');

var Airtable = require('airtable');
const airtable_apiKey = 'keyrxFD1nnDCHTmQP';
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: airtable_apiKey
});
var config_base = Airtable.base('appGEyxfx4sS75CnX');
var score_base = Airtable.base('appaAVPwTAeL1m1tu');

var alldevices = {},
    allrooms = {},
    allzones = {},
    allcourts = {},
    allconfigs = {},
    courtnames = {},
    roomnames = {};
    allgames = {};

var USEMASTERSLAVEMODE = true;
var ISTEAMGAME = false;

var connectedcourtdevices = {};

function getDataFromAirtable() {
  // console.log('gettingDataFromAirtable');

  function getDevices() {
    config_base('Devices').select({}).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        ipaddress = record.get('IP Address');

        location = record.get('Location in Zone');
        zone = record.get('Zone');
        court = record.get('Court');

        alldevices[ipaddress] = {
          id: record.id,
          ipaddress: ipaddress,
          location: location,
          zone: zone,
          court: court
        };
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); console.log('getDevices error'); return; }

      // console.log('getDevices complete:');
      // console.log(alldevices);
    });
  }
  function getRooms() {
    config_base('Rooms').select({}).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        name = record.get('Name');
        // // // // // // // // // console.log('Retrieved', roomname);

        zones = record.get('Zones');
        courts = record.get('Courts');

        recorddata = {
          id: record.id,
          name: name,
          zones: zones,
          courts: courts,
          canjoingame: true
        };
        allrooms[record.id] = recorddata;
        roomnames[name] = recorddata;
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); console.log('getRooms error'); return; }

      // console.log('getRooms complete:');
      // console.log(allrooms);
    });
  }
  function getZones() {
    config_base('Zones').select({}).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        name = record.get('Name');

        rooms = record.get('Rooms');
        courts = record.get('Courts');
        devices = record.get('Devices');
        stadium = record.get('Stadium');
        configuration = record.get('Configuration');

        allzones[record.id] = {
          id: record.id,
          name: name,
          rooms: rooms,
          courts: courts,
          devices: devices,
          stadium: stadium,
          configuration: configuration
        };
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); console.log('getZones error'); return; }

      // console.log('getZones complete:');
      // console.log(allzones);
    });
  }
  function getCourts() {
    config_base('Courts').select({}).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        courtname = record.get('Name');
        // // // // // // // // // console.log('Retrieved', courtname);

        zone = record.get('Zone');
        stadium = record.get('Stadium');
        order = record.get('Court Order');
        room = record.get('Room');
        devices = record.get('Devices');

        allcourts[record.id] = {
          id: record.id,
          name: courtname,
          zone: zone,
          stadium: stadium,
          order: order,
          room: room,
          devices: devices
        };

        courtnames[courtname] = {
          id: record.id,
          name: courtname,
          zone: zone,
          stadium: stadium,
          order: order,
          room: room,
          devices: devices
        }
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); return; }

      // // // // // // // console.dir(allcourts);
    });
  }
  function getConfigs() {
    config_base('Configurations').select({}).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        allconfigs[record.id] = record.fields;
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); return; }
    });
  }

  getDevices();
  getRooms();
  getZones();
  getCourts();
  getConfigs();

}

getDataFromAirtable();

var allteams = {};
var teamindex = {};
var teamscores = {};

function getScoresFromAirtable() {

  score_base('Teams').select({}).eachPage(function page(records, fetchNextPage) {
    records.forEach(function(record) {
      allteams[record.id] = record.fields;
      teamindex[record.get('Name')] = record.id;
      teamscores[record.get('Name')] = {
        id: record.id,
        name: record.get('Name'),
        score: record.get('Cumulative Score')
      };
    });
    fetchNextPage();
  }, function done(err) {
    if (err) { console.error(err); return; }

    // console.dir(allteams);
    // console.log('teamindex:');
    // console.dir(teamindex);
  });
}

getScoresFromAirtable();

// Routing
app.use(express.static(path.join(__dirname, 'public')), function(req, res) {
  // if (req.query.roomId) {
  //   // query = req.query.roomId;
  //   // // // // // // // // // console.log('feed routing use - ' + query);
  // }
});

function randomCode(howLong) {
  var randomname = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (var i = 0; i < howLong; i++)
    randomname += possible.charAt(Math.floor(Math.random() * possible.length));

  return randomname;
}


var numUsers = 0;
var currentHighScore = 0;

var courts = {};

var masters = {};

var courtsandmaster = {};

var randomcourts = 0;
var courtnum = randomcourts;


var gamesplayed = {};

// Web Socket (Socket.io)
function onConnection(socket) {
  console.log('new connection - ' + socket.id);

  var currentHighScore = {
    player: 'none',
    score: 0,
    combo: 0
  };

  var addedUser = false;
  var gamesrunning;

  function findARoom(somecourt, somedevice) {
    zoneid = somedevice.zone;
    thiszone = allzones[zoneid];

    console.log('thiszone' + zoneid);
    console.dir(thiszone);

    if (thiszone.rooms) {
      console.log('thiszone.rooms');
      console.dir(thiszone.rooms);
      roomid = thiszone.rooms[0];

      somecourt['room'] = [roomid];
      allcourts[somecourt.id] = somecourt;
      courtnames[somecourt.name] = somecourt;

      console.log('somecourt');
      console.dir(somecourt);
      console.log('somecourt.room - ' + somecourt.room);
      config_base('Courts').update(somecourt.id, {
        "Room": somecourt.room
      }, function(err, record) {
          if (err) { console.error(err); return; }
          console.log('room - ' + record.get('Room'));
      });

      assignCourtToRoom(somecourt, roomid);
    } else {
      somecourt.room = createRoom(somecourt);
    }
  }
  function findACourt(mydevice, myzone) {
    //if device is not a part of a court
    //check zone of device for list of currently configured courts, and add to court based on device location

    // current courtnum
    console.log('FINDACOURT: current courtnum - ' + courtnum);
    // courtnum = courtnum + 1;

    if (myzone.configuration) {
      zoneconfig = allconfigs[myzone.configuration];
      courtnum = zoneconfig[mydevice.location];
    } else {
      // console.log('FINDACOURT: ' + myzone.id + ' - no configuration');
    }

    if (courtnum) {
      console.log('FINDACOURT: ' + mydevice.ipaddress + ' - should be in court #' + courtnum);
      var mycourt;

      var index = courtnum - 1;
      if (myzone.courts) {
        // mycourt = allcourts[myzone.courts[index]];
      }
      if (mycourt) {
        console.log('FINDACOURT: adding court to device [' + mydevice.ipaddress + ']');
        console.dir(mycourt);
        mydevice.court = mycourt;

        console.log('FINDACOURT: deviceinfo');
        console.dir(mydevice);

        mydeviceid = mydevice.id;

        config_base('Devices').update( mydevice.id, {
          "Court": [mydevice.court.id]
        }, function(err, record) {
            if (err) { console.error(err); return; }
            console.log('UpdateDevice ' + mydevice.id + ' with new court - ' + record.get('Court'));
        });

        findARoom(mycourt,mydevice);
      } else {
        console.log('FINDACOURT: need to create a new court for device [' + mydevice.ipaddress + ']');
        createCourt(mydevice,myzone);
      }
    } else {
      // // // // // // // // console.log('no zone config for that location');
      // // // // // // // console.dir(myzone);
      mycourt = allcourts[myzone.courts[0]];
      mydevice.court = mycourt;
      alldevices[mydevice.ipaddress] = mydevice;
      findARoom(mycourt,mydevice);
    }

  }
  function unknownDevice(deviceIP) {
    //if device is not a part of alldevices create a new device
    var newdevice = {
      ipaddress: deviceIP,
      location: 'UNKNOWN LOCATION',
      zone: 'recHU4kI2Q1VTve9v' //default zone record id
    };

    // add device to list of devices
    alldevices[deviceIP] = newdevice;
    var devicezone = allzones[newdevice.zone];
    //redundant? // allzones[newdevice.zone] = devicezone;

    if(devicezone) {
      if (devicezone.devices) {
        // if zone already has devices add to existing array
        devicezone.devices.push(newdevice);
      } else {
        // if zone doesn't have any devices, create new array of devices
        devicezone.devices = [newdevice];
      }
    } else {
      // if no zones exist, we could possibly create a new default zone here, but we really shouldn't be running this if we dont have any zones
    }

    // record in allzones is updated on devices.push

    // PUSH TO AIRTABLE HERE
    config_base('Devices').create({
      "IP Address": newdevice.ipaddress,
      "Zone": [newdevice.zone],
      "Location in Zone": newdevice.location
    }, function(err, record) {
        if (err) { console.error(err); return; }

        //Callback from API push
        newdeviceid = record.getId();
        // // // // // // // // console.log('NewDevice - ' + newdeviceid);

        newdevice['id'] = newdeviceid;

        // do something to update local storage
        alldevices[newdevice.ipaddress] = newdevice;

        // find a court to use for this device
        // console.log('UNKOWNDEVICE: push new device before finding a court - ');
        // console.dir(newdevice);
        findACourt(newdevice, devicezone);
    });
  }

  function joinCourt(somecourtname) {

    var courttojoin = courtnames[somecourtname];
    console.log('JOINCOURT: courtojoin - ');
    console.dir(courttojoin);

    if (courttojoin) {

      var roomcourtisapartof = allrooms[courttojoin.room];
      console.log('JOINCOURT: roomcourtisapartof - ');
      console.dir(roomcourtisapartof);

      var gameInRoom = roomcourtisapartof.game;
      var gamestarted;
      var canjoingame;

      if (gameInRoom) {
        //room has a game already
        gamestarted = gameInRoom.gamerunning;
        canjoingame = gameInRoom.canjoingame;
      }

      gamestarted = roomcourtisapartof.gamerunning;
      canjoingame = roomcourtisapartof.canjoingame;

      if (gamestarted) {
        socket.emit('game already running');
      } else if (!canjoingame) {
        console.log('cant join game yet');
        socket.emit('cant join game yet');
      } else {
        //CHECK COURT TO SEE IF GAME HAS STARTED, also if it has a player IF IT HAS, DON'T LET USER JOIN
        hasplayer = courttojoin.hasplayer;
        if (hasplayer) {
          socket.emit('someone already playing');
          // same as court not found
        } else {
          courttojoin.hasplayer = true;

          // save the hasplayer variable back to our list of courts
          courtnames[somecourtname] = courttojoin;

          socket.roomname = roomcourtisapartof.name;

          // player has joined court, and room
          socket.join(socket.roomname);

          var playerdata = {
            username: socket.username,
            team: socket.team,
            court: socket.court
          }

          courttojoin.player = playerdata;


          // // // console.log("IS GAME IN PROGRESS? " + socket.gamenamesrunning);
          console.log('Player joining court:');
          console.dir(playerdata);
          console.log('JOINCOURT: before player joined court emit');
          debugSocket(socket);
          socket.broadcast.to(socket.roomname).emit('player joined court', playerdata);
          // // // // // console.log('socket.roomname - ' + socket.roomname);

          socket.emit('you joined court');
        }
      }
    } else {
      // // // // // // // // console.log('court not found');
      socket.emit('court not found');
    }
  }

  function createCourt(somedevice,somezone) {
    var newcourtname = randomCode(5);
    var courtorder;
    if (somezone.courts) {
      courtorder = somezone.courts.length + 1;
    } else {
      courtorder = 1;
    }

    //push new room with name ^
    config_base('Courts').create({
      "Name": newcourtname,
      "Court Order": courtorder,
      "Devices": [somedevice.id],
      "Zone": [somezone.id]
    }, function(err, record) {
        if (err) { console.error(err); return; }

        //Callback from API push
        newcourtid = record.getId();

        // do something to update local storage
        newcourt = {
            id: newcourtid,
            name: newcourtname,
            order: courtorder,
            zone: somezone.id,
            devices: [somedevice.id]
        }
        allcourts[newcourtid] = newcourt;
        courtnames[newcourtname] = newcourt;
        somedevice.court = newcourt;
        alldevices[somedevice.ipaddress] = somedevice;

        findARoom(newcourt,somedevice);
    });
  }
  function createRoom(somecourt) {
    var newroomname = randomCode(7);

    //push new room with name ^
    config_base('Rooms').create({
      "Name": newroomname
    }, function(err, record) {
        if (err) { console.error(err); return; }

        //Callback from API push
        newroomid = record.getId();
        // // // // // // // // console.log('NewRoom - ' + newroomid);

        newroom = {
          id: newroomid,
          name: newroomname
        }
        allrooms[newroomid] = newroom;
        roomnames[newroom.name] = newroom;

        somecourt['room'] = [newroomid];
        allcourts[somecourt.id] = somecourt;
        courtnames[somecourt.name] = somecourt;
        // // // // // // // // console.log('create a room assign');
        assignCourtToRoom(somecourt, newroomid);
    });

  }

  function assignCourtToRoom(somecourt, someroomid) {
    fullroomdata = allrooms[someroomid];
    // // // // // // // // console.log('telling device in court: ' + somecourt.name + ' to join room: ' + fullroomdata.name);
    // // // // // // // console.dir(fullroomdata);

    data = {
      court: somecourt,
      room: fullroomdata
    }

    socket.roomname = fullroomdata.name;
    socket.court = somecourt;

    if (USEMASTERSLAVEMODE) {
      courtsandmaster[socket.court.id] = socket.court;

      if (!socket.hasmaster) {
        socket.hasmaster = true;
        court = courtsandmaster[socket.court.id];
        court.slaves = [];
        courtsandmaster[socket.court.id] = court;
        // // // console.log('socket does not have master');
        console.log('ASSIGNCOURTTOROOM: setsockettomaster');
        setSocketMaster();
      }
      if (socket.syncdata){
        // // // // // // // console.log('calling syncslaves from assign court to room');
        syncSlaves(socket.syncdata);
      }
    }

    if (somecourt.room) {
      console.log('assigning court to room - ');
      console.dir(somecourt.room);
    } else {
      // // // // // // // // console.log('trying to update court info as - ');
      // // // // // // // console.dir(fullroomdata);
      // config_base('Courts').update(somecourt.id, {
      //   "Room": [fullroomdata.id]
      // }, function(err, record) {
      //     if (err) { console.error(err); return; }
      // });
    }

    //need to update court list
    socket.emit('join this room', data);
  }


  function addCourtGameScore(courtgamedata) {
    var thisgamesroom = roomnames[socket.roomname];
    var thissocketgamename = thisgamesroom.gamename;
    socket.game.name = thissocketgamename;

    console.log('add courtgamescore to database - ' + socket.game.name);
    console.dir(courtgamedata);
    debugSocket(socket);
    courtgamedata.gamename = socket.game.name;

    pushScoreToDatabase(courtgamedata);
    redirectPlayer(courtgamedata);



    var agame = gamesplayed[thissocketgamename];
    // add score to list of scores
    if (agame) {
      // // console.log('thisgame already in gamesplayed: ');
      // // console.dir(courtgamedata);
      // // // console.log('pushing new score to agame array');
      agame.scores.push(courtgamedata);
      // // console.log('agame full data:');
      // // console.dir(agame);
      // updateHighScorer(agame, courtgamedata);
      gamesplayed[thissocketgamename] = agame;
    } else {
      // // console.log('creating a new game in gamesplayed:')
      agame = {
          gamename: thissocketgamename,
          scores: [courtgamedata],
          highscorer: courtgamedata
      };
      // // // console.log('agame init:');
      // // console.dir(agame);
      // // // // console.dir(agame);
      // // // // // console.log('gamedata');
      // // // // console.dir(courtgamedata);
      gamesplayed[thissocketgamename] = agame;
    }


    // // console.log('addcourtgamescore(scorescounted): ' + thisgamesroom.scorescounted);

    thisgamesroom.scorescounted += 1;
    // // // console.log('scores counted:' + thisgamesroom.scorescounted);
    roomnames[socket.roomname] = thisgamesroom;

    // if all games scores added, get high score
    if (thisgamesroom.scorescounted == thisgamesroom.courtcount) {
      // // console.log('all scores added, getting highscore: ');
      // // console.dir(thisgamesroom);
      // // console.log('get high score for gamename - ' + thissocketgamename);
      getHighScore(thissocketgamename);
    } else {
      // // console.log('not all scores added, waiting for all scores: ');
      // // console.log('counted,courtcount: ' + thisgamesroom.scorescounted + ',' + thisgamesroom.courtcount);
    }

  }

  function redirectPlayer(courtGameData) {
    // var playername = data.player.username;
    // var playerscore = data.player.score;
    // var playerdata = {
    //   playername: playername,
    //   playerscore: playerscore
    // }
    console.log('redirectPlayer: socket - ' + courtGameData);
    debugSocket(socket);
    // socket.emit('show results', playerdata);
  }

  function pushScoreToDatabase(data) {
    playername = data.player.username;
    var playerstreak = data.highestStreak;
    var playershotsmade = data.shotsMade;
    if(ISTEAMGAME) {
      playerteam = teamindex[data.player.team.name];
    } else {
      playerteam = 'N/A';
    }

    playerscore = data.player.score;

    if(ISTEAMGAME) {
      console.log('oldteamscores');
      console.dir(teamscores);
      oldteam = teamscores[data.player.team.name];
      oldteam.score += playerscore;
      teamscores[data.player.team.name] = oldteam;

      console.log('newteamscores');
      console.dir(teamscores);
    }

    if (playerscore > 0) {

      score_base('Players').create({
        "Name": playername,
        // "Team": [playerteam],
        "Score": playerscore,
        "Longest Streak": playerstreak,
        "Shots Made": playershotsmade,
        "Submission Date": new Date()
      }, function(err, record) {
          if (err) { console.error(err); return; }

          //Callback from API push
          newplayerid = record.getId();
          // // // // // // // // console.log('NewPlayer - ' + newplayerid);
      });
    }
  }

  function getHighScore(gamename) {
    // console.log('get highscore for: ' + gamename);

    var thisgamesroom = roomnames[socket.roomname];
    var thisgame = gamesplayed[gamename];

    for (index in thisgame.scores) {
      var ascore = thisgame.scores[index];
      // // // console.log('ascore in thisgame');
      // // // console.log(ascore);

      if (ascore.score > thisgame.highscorer.score) {
        // // // console.log('new high score');
        thisgame.highscorer = ascore;
      } else {
        // // // console.log('Same high score');
      }
    }
    // // console.log('setting scorescounted to 0: ' + gamename);
    thisgamesroom.scorescounted = 0;
    // // // console.log('resetting scorescounted' + thisgamesroom.scorescounted);
    roomnames[socket.roomname] = thisgamesroom;

    var resultsdata = {
      highscorer: thisgame.highscorer,
      teamscores: teamscores
    };

    var emitData = {
      game: gamename,
      resultsdata: resultsdata
    };

    // // console.log('emit data');
    // // console.dir(emitData);

    socket.broadcast.to(socket.roomname).emit('show results', emitData);
    socket.emit('show results', emitData);


    // // // // // console.log("socket roomname: " + socket.roomname);
    gamesplayed[gamename] = thisgame;



  }



  // only needed if USEMASTERSLAVEMODE
  function setSocketMaster() {
    // // // console.log('--setting socket master')
    // // // // // // // console.log('socket court');
    // // // // // // console.dir(socket.court);
    if(socket.court === undefined)
    {
        // // // console.log("UNKNOWN DEVICe");
        // // // console.log(socket.deviceIP);
        //unknownDevice(socket.deviceIP);
        //return;
        // // // console.log(socket.court);
    }

    var courtid = socket.court.id;
    // // // console.log('socket.court.id: ' + courtid);
    var thiscourt = courtsandmaster[courtid];
    // // // console.log('this court - ');
    // // // console.dir(thiscourt);

    if (thiscourt) {
      // // // console.log('court is listed - ');
      // // // // // // console.dir(thiscourt);
      // // // // // // // console.log('court master: ' + thiscourt.master);

      if (thiscourt.master === undefined) {
        // // // console.log('master undefined: ' + thiscourt.master + " " + socket.id);
        thiscourt.master = socket.id;
        socket.court.master = socket.id;
        // // // console.log('thiscourt master: ');
        // // console.dir(thiscourt);
        thiscourt.slaves = [];
        courtsandmaster[courtid] = thiscourt;
        // // // console.log('candm:');
        // // console.dir(courtsandmaster);
        console.log('SETSOCKETMASTER: set master emitted to master socket (should be only court)');
        socket.emit('set master'); //do we need this?

      } else if (thiscourt.master) {
        //// // // console.log('court has master: ' + thiscourt.master);
        if(thiscourt.master == socket.id){
            // // // console.log("SOCKET ALREADY MASTER");
        }
        else {
            thiscourt.slaves.push(socket.id);
            // // // console.log("SOCKET IS SLAVE PUSHING");
        }

        courtsandmaster[courtid] = thiscourt;
        //// // // console.log("this court: " + thiscourt);
        //// // // // // console.log("this court master: " + thiscourt.master);
        // // // console.log("MIDDLE IF " + thiscourt.master);
        // // // console.log(socket.court.master);
        socket.court.master = thiscourt.master;
        //was socket.id
        sendToSpecificSocket(socket.court.master);
        //io.to(thiscourt.master).emit('set master');
      } else {
        // // // console.log("LAST IF " + socket.id);
        thiscourt.master = socket.id;
        socket.court.master = socket.id;
        // // // console.log('thiscourt master: ');
        // // // console.dir(thiscourt);
        thiscourt.slaves = [];
        courtsandmaster[courtid] = thiscourt;
        socket.emit('set master');
      }
    } else {
      // // // console.log('Court not listed - add court to list and set master to this socket');
      thiscourt = {
        id: courtid,
        master: socket.id
      };

      //courtsandmaster[courtid] = thiscourt;
      // // // console.log(courtsandmaster[courtid]);
      // // // console.dir(thiscourt);
      // // // // console.log('candm list: ');
      // // // console.dir(courtsandmaster);

        // // // console.log("END OF SOCKET " + socket.id);
      //socket.court.master = socket.id;
      // // // console.log("SYNC DATA " + socket.syncdata);
      //syncSlaves(socket.syncdata);
      // // // console.log('setting this socket to master:' + socket.court.master);
      //socket.hasmaster = true;
      //socket.emit('set master');
    }

    // if (masters[socket.court.id]) {
    //   socket.master = masters[socket.court.id];
    // } else {
    //   socket.master = socket.id;
    //   masters[socket.court] = socket.id;
    //   socket.emit('set master');
    // }
  }
  function syncSlaves(data) {
    // // // // console.log("---SYNC SLAVES---");
    // // // // console.log('   data sent in');
    // // // console.dir(data);

    var courtmaster;
    if (socket.court.master) {
      courtmaster = socket.court.master;
      // // // // console.log('has court master:');
      // // // console.dir(courtmaster);

      if (courtmaster == socket.id) {
        // // // // console.log('this screen is master - ' + socket.id);
        var courtMasterData = {
          courtname:socket.court.name,
          syncdata:data
        };

        // // // // console.log("Sync with master called on : " + socket.court.name);
        // // // console.dir(testData);
          //// // // console.log("SYNC THE SLAVES");
        socket.broadcast.to(socket.roomname).emit('sync with master', courtMasterData);
        socket.emit('sync with master', courtMasterData);
      } else {
         // // // // console.log('someone else is master - ' + courtmaster);
      }
    } else {
      // // // console.log('SYNC SLAVes: master needs to be set');
      setSocketMaster();
    }
  }
  function findNewMaster(oldsocketid) {
    //var slaveindex = court.slaves.indexOf(socket.id);


      socket.hasmaster = false;
      // // // console.log("SOCKET COURT MASTER " + socket.court.master + " " + socket.id);
      courtsandmaster[socket.court.id].master = null;
    var newmaster = court.slaves.pop();
      // // // console.log("new master");
    // // console.dir(newmaster);

    if(newmaster)
    {
        courtsandmaster[socket.court.id].master = newmaster;
        socket.hasmaster = true;
        // // // console.log("FIND NEW MASTER SET MASTER EMIT " + socket.id)
        io.to(courtsandmaster[socket.court.id].master).emit('set master');
    }
    else {
      socket.court.master = null;
      courtsandmaster[socket.court.id] = null;
      // // // console.log(courtsandmaster[socket.court.id]);
      //socket.court.id = null;
      setSocketMaster();
    }

  }
  function sendToSpecificSocket(socketID) {
    console.log("SEND TO SPECIFIC MASTER " + socketID);
    io.to(socketID).emit('set master');
  }

  socket.on('sync screens', function(data) {
    socket.syncdata = data;
    if (socket.court) {
      if (USEMASTERSLAVEMODE) {
        syncSlaves(data);
      }
    } else {
      // If the socket this device has not already connected and learned its court, it needs to find it
      mydevice = alldevices[data.deviceIP];
      myzone = allzones[mydevice.zone];
      findACourt(mydevice,myzone);
    }
  });
  // end of USEMASTERSLAVEMODE functions


  function checkForKnownDevice(deviceIP) {
    if (deviceIP in alldevices) {
      console.log('we know this device already.');
    } else {
      console.log('device: ' + deviceIP + ' not in alldevices list');
      getDataFromAirtable();
      unknownDevice(deviceIP);
    }
  }

  //court stuff I think
  function getCourtToShow(deviceIP) {

    // find out if the device knows what court it should be a part of
    // first check to see if device is in list of devices
    if (deviceIP in alldevices) {
      //if we know the device already, check its court and zone,
      mydevice = alldevices[deviceIP];
      // console.log("GETCOURTTOSHOW: device");
      // console.dir(mydevice);
      mycourt = allcourts[mydevice.court];
      // console.log("GETCOURTTOSHOW: court ");
      // console.dir(mycourt);
      myzone = allzones[mydevice.zone];

      if (mydevice.court) {
        mycourt = mydevice.court[0];
        console.log('GETCOURTTOSHOW: mydevice.court - ');
        console.dir(mycourt);
        console.log('allcourts');
        console.dir(allcourts);

        mycourt = allcourts[mycourt];
      }

      if (!myzone) {
        // if we don't have a zone set in config, set zone to the default
        myzone = 'DEFAULT ZONE';
      }

      if (mycourt) {
        console.log('COURT TO SHOW: ');
        console.dir(mycourt);
        //if we know the court the device should be in, check if we know the roomid
        myroomid = mycourt.room;
        if (myroomid) {
          //if mycourt already knows what room it is supposed to be a part of
          assignCourtToRoom(mycourt,myroomid);
        } else { //find a room
          findARoom(mycourt,mydevice);
        }
      } else { //find a court
        console.log('m')
        findACourt(mydevice, myzone);
      }
    } else { //unknown device
      console.log('device: ' + deviceIP + ' not in alldevices list');
      getDataFromAirtable();
      unknownDevice(deviceIP);
    }
  };

  // sent from court.js in "getDeviceInfo"
  socket.on('court connected', function(data) {
    // store device IP and save it to socket

    var deviceIP = data.deviceIP;
    socket.deviceIP = deviceIP;

    // we know this is a court, so tell the Socket
    socket.devicetype = 'court';
    courtnum += 1;

    if (!connectedcourtdevices[deviceIP]) {
      console.log('CONNECTION: court connected for the first time');
      // when court has connected, save it to the courts dictionary
      connectedcourtdevices[deviceIP] = data;
    } else {
      //court has already connected (this is probably a reconnect)
      var courtinfo = connectedcourtdevices[deviceIP];
      // console.log('CONNECTION: court reconnected [IP: ' + deviceIP + ' , SOCKET: ' + socket.id + ']');

      socket.emit('court reconnected', courtinfo);

      if(socket.court === undefined) {
        console.log("COURT CONNECTION: unknown court");
        getCourtToShow(deviceIP);
      }
      else{
        console.log("COURT CONNECTION: socket already knows court, calling setSocketMaster");
        setSocketMaster();
      }
    }

    getCourtToShow(deviceIP);
  });







  socket.on('update court', function(courtdata) { //court joins new room
    // // // // // // // // console.log('updating court');
    // var newCourt = {
    //   name: data.courtname,
    //   room: socket.roomname
    // };
    var newroomid = courtdata.room;
    courtnames[courtdata.name].room = newroomid;
    var newroom = allrooms[newroomid];
    socket.join(newroom);
    // // // // // // // // // console.log('Courts: ');
    // // // // // // // console.dir(courts);
  });

  socket.on('join room', function(data) { //court does this
    roomname = data.roomname;
    courtname = data.courtname;

    socket.join(roomname);
    socket.roomname = roomname;
    socket.court = courtnames[data.courtname];

    // // // // // // // // console.log('index.js: court: ' + socket.courtname + ' joining room - ' + socket.roomname);
    // socket.broadcast.to(socket.roomname).emit('court joined room', data);
    socket.emit('court joined room', data);
  });


  //player stuff I think
  socket.on('player wants to join court', function(playerdata) { //player does this
    // we know this a player, so tell the Socket
    socket.devicetype = 'player';

    socket.username = playerdata.username;
    socket.team = playerdata.team;
    socket.court = playerdata.court;

    joinCourt(socket.court);
  });
  socket.on('change player name', function(playerdata) {
    oldplayer = {
      username: socket.username,
      team: socket.team,
      court: socket.court
    };
    newplayer = {
      username: playerdata.username,
      team: playerdata.team,
      court: playerdata.court
    };

    // // // // // // // // console.log('player: ' + oldplayer.username + ' changed name to: ' + newplayer.username);
    // // // // // // // // console.log('new team: ' + newplayer.team);
    socket.username = newplayer.username;
    socket.team = newplayer.team;
    socket.court = newplayer.court;

    data = {
      oldplayer: oldplayer,
      newplayer: newplayer
    }
    // // // // // console.log("Broadcasting to player changed name: " + data);
    socket.broadcast.to(socket.roomname).emit('player changed name', data);
  })


  socket.on('waiting countdown less than four', function(courtName) {
    console.log('Countdown on - ' + courtName + ' is 4 or less');

    var thisgamesroom = roomnames[socket.roomname];

    console.log('---Step 1---');
    console.log('thisgamesroom:');
    console.dir(thisgamesroom);

    if (thisgamesroom.gamerunning) {
      console.log('Game is already running, we need to add our court to the count of courts running game');
      // socket.gamename = thisgamesroom.gamename;
      thisgamesroom.courtcount += 1;
      // // // console.log('courtcount: ' + thisgamesroom.courtcount);
      roomnames[socket.roomname] = thisgamesroom;
      allrooms[thisgamesroom.id] = thisgamesroom;
    } else {
      console.log('Game is not running we need to start it');
      startGame();
    }

  });
  socket.on('game almost ready', function(courtName) {
    console.log('Game Almost Ready Called by - ' + courtName);

    var thisgamesroom = roomnames[socket.roomname];

    console.log('---Step 1---');
    console.log('thisgamesroom:');
    console.dir(thisgamesroom);

    if (thisgamesroom.gamerunning) {
      console.log('Game is already running, we need to add our court to the count of courts running game');
      // socket.gamename = thisgamesroom.gamename;
      thisgamesroom.courtcount += 1;
      // // // console.log('courtcount: ' + thisgamesroom.courtcount);
      roomnames[socket.roomname] = thisgamesroom;
      allrooms[thisgamesroom.id] = thisgamesroom;
    } else {
      console.log('Game is not running we need to start it');
      startGame();
    }

    //POSSIBLE ISSUE
    // if (!socket.gamename) {
    //
    //   socket.gamename = thisgamesroom.id + '_' + thisgamesroom.gamenum;
    //   // console.log('setting socket.gamename' + socket.gamename);
    // }

    // // console.log('roomnames');
    // // console.dir(roomnames);

    // // // // // console.log("this games room " + thisgamesroom);
    // // // // // console.log('running:' + thisgamesroom.gamerunning);


    //TODO: WILL NEED TO LISTEN FOR AN EVENT TO TURN GAME PROGRESS OFF AFTER RESULTS ARE SHOWN

  });

  function createGameName(someRoom, someDate) {
    var month = someDate.getMonth();
    var day = someDate.getDate();
    var hour = someDate.getHours();
    var minutes = someDate.getMinutes();

    var newgamename = someRoom.id + '_' + month + '_' + day + '_' + hour + '_' + minutes;

    return newgamename;
  }

  function startGame() {
    var thisgamesroom = roomnames[socket.roomname];

    var newdate = new Date();

    thisgamesroom.gamename = createGameName(thisgamesroom, newdate);

    console.log('---Step 2---');
    console.log('start game (current gamename)- ' + thisgamesroom.gamename);
    newGameObject = {
      name: thisgamesroom.gamename,
      players: {},
      gameDateTime: newdate
    }
    console.dir(newGameObject);
    console.log('---Step 3---');
    console.log('add newGameObject to socket - ');
    socket.game = newGameObject;

    debugSocket(socket);

    console.log('SOCKETGAMENAME - ' + socket.game.name);
    // socket.gamename = thisgamesroom.gamename;

    allgames[socket.game.name] = socket.game;

    thisgamesroom.gamerunning = true;
    thisgamesroom.canjoingame = false;
    thisgamesroom.scorescounted = 0;

    // console.log('starting game with new gamename: ' + thisgamesroom.gamename);
    // // // console.log('game started: ' + thisgamesroom.gamename);
    thisgamesroom.courtcount = 1;
    // // // console.log('courtcount: ' + thisgamesroom.courtcount);
    // socket.gamename = thisgamesroom.gamename;
    // console.log('new socketgame: '+ socket.gamename);

    roomnames[socket.roomname] = thisgamesroom;
    allrooms[thisgamesroom.id] = thisgamesroom;

    // updateGameName(thisgamesroom.gamename);

    var gamedata = {
      // gamename: thisgamesroom.gamename,
      game: newGameObject
    }

    // // console.log('game almost ready');
    socket.broadcast.to(socket.roomname).emit('game almost ready', gamedata);
  }

  socket.on('throw ball', function(data) {
    // // // // // // // // // console.log('Full Data - ' + data);

    var exitX = data.exitX;
    var exitY = data.exitY;
    var xSpeed = data.xSpeed;
    var ySpeed = data.ySpeed;
    var deviceWidth = data.deviceWidth;
    var deviceHeight = data.deviceHeight;
    // // // // // // // // // console.log('Data Saved');

    var shotInfo = {
      username: socket.username,
      ballcolor: socket.usercolor,
      fromX: exitX,
      fromY: exitY,
      xSpeed: xSpeed,
      ySpeed: ySpeed,
      deviceWidth: deviceWidth,
      deviceHeight: deviceHeight
    }

    // // // // // // // // console.log('take shot');

    var emitData = {
      court: socket.court,
      shotInfo: shotInfo
    }

    socket.broadcast.to(socket.roomname).emit('take shot', emitData);

  });
  socket.on('game over', function(someGameData, someCourtData) {
    courtGameHasEnded(someGameData);

    console.log('game over: gamedata');
    console.dir(someGameData);

    console.log('SOCKETONGAMEOVER: courtData');
    console.dir(someCourtData);

    addCourtScoreForGame(someGameData);
    // Submit Player Data To Database
    addCourtGameScore(someGameData);

  });
  function courtGameHasEnded(someGameData) {
    var thisgamesroom = roomnames[socket.roomname];

    if (thisgamesroom.gamerunning) {
      socket.broadcast.to(socket.roomname).emit('end all games', socket.court);
      thisgamesroom.gamerunning = false;

      roomnames[socket.roomname] = thisgamesroom;
      allrooms[thisgamesroom.id] = thisgamesroom;
    }
  }
  function addCourtScoreForGame(someCourtData) {

    var thisgamesroom = roomnames[socket.roomname];
    var thissocketgamename = thisgamesroom.gamename;
    console.log('--BREAKING--');
    debugSocket(socket);

    gamedata = socket.game;
    console.log("Socket.game");
    console.dir(gamedata);


    socket.game.name = thissocketgamename;

    //
    // thisgame = allgames[socket.gamename];
    // console.log("Thisgame");
    // console.dir(thisgame);

    allgames[socket.game.name] = gamedata;

    // if all scores have been added for this game call push to database function
    pushScoreForGameToDatabase(gamedata);
  }

  function pushScoreForGameToDatabase(gamedata) {
    console.log('PUSHSCOREFORGAME: gamedata to push');
    console.dir(gamedata);
  }

  socket.on('room reset', function() {
    var thisgamesroom = roomnames[socket.roomname];

    // // // // // console.log('roomname:' +socket.roomname);
    // // // // // console.log('room reset called');
    // // // // console.dir(roomnames);
    // if (thisgamesroom.gamerunning) {
      // console.log('room reset called');
      thisgamesroom.gamerunning = false;
      thisgamesroom.canjoingame = true;

      roomnames[socket.roomname] = thisgamesroom;
      allrooms[thisgamesroom.id] = thisgamesroom;

      socket.broadcast.to(socket.roomname).emit('reset game');
      socket.emit('reset game');
    // } else {
      // // // console.log('room reset called while game not running');
    // }
  });
  socket.on('court reset', function(somecourtname) {
    // // // // // console.log('court resetting');
    var thiscourt = courtnames[somecourtname];
    thiscourt.hasplayer = false;
    courtnames[somecourtname] = thiscourt;
  });

  function courtDisconnected(somesocket) {

      var thisgamesroom = roomnames[somesocket.roomname];
      thisgamesroom.gamerunning = false;
      roomnames[somesocket.roomname] = thisgamesroom;

      var thiscourt = courtnames[somesocket.court.name];
      // // // console.log(thiscourt);

      courtnum -= 1;

      // // console.log("COURT DISCONNECTED");
      thiscourt.hasplayer = false;
      courtnames[somesocket.court] = thiscourt;

      // // // console.log("")
    if (socket.court) {
      var somecourtid = somesocket.court.id;
      var courtid = somecourtid;
      var court = courtsandmaster[courtid];

      socket.emit('reset game');
      socket.broadcast.to(somesocket.roomname).emit('reset game');

      if(USEMASTERSLAVEMODE) {

        if (court.master == socket.id) {
          // // // // // // console.log('need to find new master - ');
          // // // // // console.dir(socket.court);
          // // // // // // console.log('current courtsandmaster');
          // // // // // console.dir(courtsandmaster);

          findNewMaster(socket.id);
        } else {
          var slaveindex = court.slaves.indexOf(socket.id);
          court.slaves.pop(slaveindex);
          courtsandmaster[courtid] = court;

            // // // // // // console.log('court after pop');
            // // // // // console.dir(court);
            // // // // // // console.log('current courtsandmaster');
            // // // // // console.dir(courtsandmaster);
        }
      }
    }
  }
  function playerDisconnected(somesocket) {
  }

  //server stuff
  socket.on('disconnect', function() {
    // // // // // console.log('user from: ' + socket.id + ' disconnected');

    // if socket is a court socket
    if (socket.devicetype == 'court') {
      // // // // // console.log('court disconnected');
      courtDisconnected(socket);
    } else if (socket.devicetype == 'player') {
      // // // // // console.log('player disconnected');
      playerDisconnected(socket);
    } else {
      //seems like device disconnected before it was set up
      // // // // // console.log('unknown device type disconnected');
    }
  })
  socket.on('reconnect', function() {
    // // // // // console.log('socket reconnected - ' + socket.id);
    // // // // console.dir(socket);
  });

  socket.on('touch event', function(data) {
    // // // // // // // console.log('Some Touch Event');
    // // // // // // console.dir(data);
  });

  socket.on('disconnect this device', function() { // called from player
    socket.disconnect();
  });



  //game stuff
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
  //   var thisgamesroom = roomnames[socket.roomname];
  //
  //   thisgamesroom.gamename = newgamename;
  //
  //   console.log('gamename after update: ' + thisgamesroom.gamename);
  //
  //   roomnames[socket.roomname] = thisgamesroom;
  //   allrooms[thisgamesroom.id] = thisgamesroom;
  //   socket.broadcast.to(socket.roomname).emit('update game name', newgamename);
  // }
  socket.on('update game', function(_gamedata) {
    // console.log('update game name from socket - ' + socket.gamename);
    //
    console.log('ON UPDATE GAME');
    debugSocket(socket);

    socket.game = _gamedata;
    // var thisgamesroom = roomnames[socket.roomname];
    //
    // thisgamesroom.gamename = newgamename;
    //
    // roomnames[socket.roomname] = thisgamesroom;
    // allrooms[thisgamesroom.id] = thisgamesroom;
    //
  });

}


function debugSocket(somesocket) {
  console.log('-----');
  console.log('SOCKET_INFO: ' + somesocket.id);
  console.log('- deviceIP -');
  console.dir(somesocket.deviceIP);
  console.log('- devicetype -');
  console.dir(somesocket.devicetype);
  console.log('- roomname -');
  console.dir(somesocket.roomname);
  console.log('- court -');
  console.dir(somesocket.court);
  console.log('- game -');
  console.dir(somesocket.game);
  console.log('-----');
}



io.on('connection', onConnection);

server.listen(port, function(){
  console.log('listening on %d', port);
});












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

// Ready to delete finished
