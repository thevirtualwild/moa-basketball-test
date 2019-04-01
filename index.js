////////////////////////////////////////////////////////
// This needs to be exported from the states.js script, so that we can make it an actual state machine (I don't have time for this right now)
var g_roomStates = Object.freeze({"ATTRACT": 0, "WAITING": 1, "GAMEPLAY": 2, "RESULTS": 3});
var g_gameStates = Object.freeze({"INACTIVE": 0, "WAITING": 1, "GAMEPLAY": 2});
// config stuff
var initWaitTime = 5;
var initGameTime = 20;
var initResultsTime = 10;
//- END Config stuff

//-  Imports and Stuff
const express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 4000;
var Promise = require('promise');
//- END imports and sstuff

//- Airtable configuration
var Airtable = require('airtable');
const airtable_apiKey = 'keyrxFD1nnDCHTmQP';
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: airtable_apiKey
});
var config_base = Airtable.base('appGEyxfx4sS75CnX');
var score_base = Airtable.base('appaAVPwTAeL1m1tu');
//- End Airtable configuration

var defaultZoneID = 'recHU4kI2Q1VTve9v';

////////////////////////////////////////////////////////

//- d_ server based data objects
var d_alldevices = {},
    d_allrooms = {},
    d_allzones = {},
    d_allcourts = {},
    d_allconfigs = {},
    d_courtnames = {},
    d_roomnames = {},
    d_allgames = {},
    d_teamscores = {},
    d_masters = {}, //not currently used
    d_courtsandmaster = {},
    d_connectedCourts = {};
//- end d_ server Variables

//- g_ server based gameplay objects
var g_activerooms = {},
    g_gamerooms = {};
// var g_gameCourts = {};

//- end g_ server based gameplay objects

var randomcourts = 0;
var m_courtnum = randomcourts;

var USEMASTERSLAVEMODE = true;
var ISTEAMGAME = false;

////////////////////////////////////////////////////////

//- Data setting functions (Get data from API and set as local data) **should be using promises**
function getDataFromAirtable() {
  // console.log('gettingDataFromAirtable');

  function getDevices() {
    config_base('Devices').select({}).eachPage(function page(_records, fetchNextPage) {
      _records.forEach(function(_record) {

        var recorddata = {
          id: _record.id,
          ipaddress: _record.get('IP Address'),
          location: _record.get('Location in Zone'),
          zone: _record.get('Zone'),
          court: _record.get('Court')
        };

        updateDevices(recorddata, false);
        // d_alldevices[ipaddress] = recorddata;
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); console.log('getDevices error'); return; }

      // console.log('getDevices complete:');
      // console.log(d_alldevices);
    });
  }
  function getRooms() {
    config_base('Rooms').select({}).eachPage(function page(_records, fetchNextPage) {
      _records.forEach(function(_record) {
        var name = _record.get('Name');

        var zones = _record.get('Zones');
        var courts = _record.get('Courts');

        var recorddata = {
          id: _record.id,
          name: name,
          zones: zones,
          courts: courts,
          canjoingame: true
        };

        if (isEmpty(d_allrooms)) {
          d_allrooms[_record.id] = recorddata;
          d_roomnames[name] = recorddata;
          initializeGameRoom(recorddata);
        }

      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); console.log('getRooms error'); return; }

      // console.log('getRooms complete:');
      // console.log(d_allrooms);
    });
  }
  function getZones() {
    config_base('Zones').select({}).eachPage(function page(_records, fetchNextPage) {
      _records.forEach(function(_record) {
        var name = _record.get('Name');

        var rooms = _record.get('Rooms');
        var courts = _record.get('Courts');
        var devices = _record.get('Devices');
        var stadium = _record.get('Stadium');
        var configuration = _record.get('Configuration');

        var recorddata = {
          id: _record.id,
          name: name,
          rooms: rooms,
          courts: courts,
          devices: devices,
          stadium: stadium,
          configuration: configuration
        };

        d_allzones[_record.id] = recorddata;
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); console.log('getZones error'); return; }

      // console.log('getZones complete:');
      // console.log(d_allzones);
    });
  }
  function getCourts() {
    config_base('Courts').select({}).eachPage(function page(_records, fetchNextPage) {
      _records.forEach(function(_record) {

        var recorddata = {
          id: _record.id,
          name: _record.get('Name'),
          zone: _record.get('Zone'),
          stadium: _record.get('Stadium'),
          order: _record.get('Court Order'),
          room: _record.get('Room'),
          devices: _record.get('Devices')
        }

        updateCourts(recorddata, false);
        // d_allcourts[_record.id] = recorddata;
        // d_courtnames[courtname] = recorddata;
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); return; }

      // // // // // // // console.dir(d_allcourts);
    });
  }
  function getConfigs() {
    config_base('Configurations').select({}).eachPage(function page(_records, fetchNextPage) {
      _records.forEach(function(_record) {
        d_allconfigs[_record.id] = _record.fields;
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { console.error(err); return; }
    });
  }

  getDevices();
  // if (!d_allrooms) {
    getRooms();
  // }
  getZones();
  getCourts();
  getConfigs();

}
//- END data setting functions

//- Helper Functions
function isEmpty(_object) {
  for (var key in _object) {
    if (_object.hasOwnProperty(key))
      return false;
  }
  return true;
}
function randomCode(howLong) {
  var randomname = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (var i = 0; i < howLong; i++)
    randomname += possible.charAt(Math.floor(Math.random() * possible.length));

  return randomname;
}
function _debugSocket(_somesocket) {
  console.log('-----');
  console.log('SOCKET_INFO: ' + _somesocket.id);
  console.log('- deviceIP -');
  console.dir(_somesocket.deviceIP);
  console.log('- devicetype -');
  console.dir(_somesocket.devicetype);
  console.log('- roomname -');
  console.dir(_somesocket.roomname);
  console.log('- court -');
  console.dir(_somesocket.court);
  console.log('- game -');
  console.dir(_somesocket.game);
  console.log('-----');
}
function _debugObject(_someMessage, _someObject) {
  console.log('-----');
  console.log(_someMessage);
  console.dir(_someObject);
  console.log('-----');
}
function countConnectedCourts() {
  return Object.keys(d_connectedCourts).length;
}
//- END Helper Functions

//- Update functions
function updateDevices(_somedevice, _PUSHTODATABASE) {
  d_alldevices[_somedevice.ipaddress] = _somedevice;

  if (_PUSHTODATABASE) {
    config_base('Devices').update( _somedevice.id, {
      "Court": [_somedevice.court.id]
    }, function(err, _record) {
        if (err) { console.error(err); return; }
        console.log('UpdateDevice ' + _somedevice.id + ' with new court - ' + _record.get('Court'));
    });
  }
}
function updateCourts(_somecourt, _PUSHTODATABASE) {
  d_allcourts[_somecourt.id] = _somecourt;
  d_courtnames[_somecourt.name] = _somecourt;

  if (_PUSHTODATABASE) {
    config_base('Courts').update(_somecourt.id, {
      "Room": _somecourt.room
    }, function(err, _record) {
        if (err) { console.error(err); return; }
        console.log('room - ' + _record.get('Room'));
    });
  }
}
function updateRooms(_someroom) {
  d_roomnames[_someroom.name] = _someroom;
  d_allrooms[_someroom.id] = _someroom;
}
//- END Update Functions

var waittimers = {};
var gametimers = {};
var resultstimers = {};

//- Server Based Timing
function startWaitingClock(_someRoom) {
  var newTimer = setInterval(updateWaitTime, 1000, _someRoom);

  waittimers[_someRoom.name] = {
    timer: newTimer,
    currenttime: initWaitTime
  }

  // setTimeout(startGameForRoom, (initWaitTime * 1000), _someRoom);
}
function startGameplayClock(_someRoom) {
  var newTimer = setInterval(updateGameTime, 1000, _someRoom);

  console.log('STARTGAMEPLAYCLOCK - ' + initGameTime);
  gametimers[_someRoom.name] = {
    timer: newTimer,
    currenttime: initGameTime
  }

}
function startResultsClock(_someRoom) {
  var newTimer = setInterval(updateResultsTime, 1000, _someRoom);

  console.log('STARTRESULTSCLOCK - ' + initResultsTime);
  resultstimers[_someRoom.name] = {
    timer: newTimer,
    currenttime: initResultsTime
  }

}

function updateWaitTime(_someRoom) {
  var currentWaitTime = waittimers[_someRoom.name].currenttime;
  currentWaitTime -= 1;
  waittimers[_someRoom.name].currenttime = currentWaitTime;

  var emitData = {
    room: _someRoom,
    time: currentWaitTime
  }
  // io.sockets.in(_someRoom).emit('update wait time', currentWaitTime);
  io.emit('update wait time', emitData);

  if (currentWaitTime <= -2) { //TODO: delayed call? how do we do on server without tweenmax
    clearInterval(waittimers[_someRoom.name].timer);

    startGameForRoom(_someRoom);
  }
}
function updateGameTime(_someRoom) {
  var currentGameTime = gametimers[_someRoom.name].currenttime;
  currentGameTime -= 1;
  gametimers[_someRoom.name].currenttime = currentGameTime;

  var emitData = {
    room: _someRoom,
    time: currentGameTime
  }

  io.emit('update game time', emitData);

  if (currentGameTime <= -1) { //TODO: delayed call
    clearInterval(gametimers[_someRoom.name].timer);

    endGameInRoom(_someRoom);

    delete g_activerooms[_someRoom.name];
  }
}
function updateResultsTime(_someRoom) {
  var currentResultsTime = resultstimers[_someRoom.name].currenttime;
  currentResultsTime -= 1;
  resultstimers[_someRoom.name].currenttime = currentResultsTime;

  var emitData = {
    room: _someRoom,
    time: currentResultsTime
  }

  io.emit('update results time', emitData);

  if (currentResultsTime <= -1) { //TODO: delayed call
    clearInterval(resultstimers[_someRoom.name].timer);

    resetRoom(_someRoom);
  }
}

function resetRoom(_someRoom) {
  io.emit('reset game', _someRoom);

  for (var courtname in _someRoom.courts) {
    clearPlayersFromCourtInGameRoom(courtname, _someRoom);
  }

  _someRoom.state = g_gameStates.ATTRACT;
}

function clearPlayersFromCourtInGameRoom(_someCourtName, _someRoom) {
  _debugObject('Clear Players -', _someRoom.courts);
  _debugObject('CourtName', _someCourtName);

  var thiscourt = _someRoom.courts[_someCourtName];
  _debugObject('ThisCourt', thiscourt);

  delete thiscourt.player;

  thiscourt.hasplayer = false;

  _someRoom.courts[_someCourtName] = thiscourt;

  updateRooms(_someRoom);
}


function startGameForRoom(_someRoom) {
  // _debugObject('Start Game For Room', _someRoom);

  setTimeout(startGameplayClock, (3 * 1000), _someRoom);

  var emitData = {
    room: _someRoom,
    game: _someRoom.game
  }

  // io.sockets.in(_someRoom).emit('game almost ready', _someRoom.game);
  io.emit('game almost ready', emitData);
}

function endGameInRoom(_someRoom) {
  // changeRoomGameState(_someRoom, g_gameStates.RESULTS);

  startResultsClock(_someRoom);

  io.emit('end all games', _someRoom);
}
function showResultsInRoom(_someRoom) {


}






////////////////// NEW AND CLEAN ///////////////////

function initializeGameRoom(_someRoom) {
  _someRoom.state = g_gameStates.ATTRACT;
  _someRoom.courts = {};
  updateGameRooms(_someRoom);
}
//- update Functions
function updateGameRooms(_someRoom) {
  g_gamerooms[_someRoom.name] = _someRoom;
}
//- checks will return boolean
function checkIfCourtInGameRoom(_someCourt, _someRoom) {
  _debugObject('CHECK IF COURT IN GAME ROOM - court', _someCourt);
  _debugObject('CHECK IF COURT IN GAME ROOM - room', _someRoom);
  if (_someRoom.courts[_someCourt.name]) {
    return true;
  } else {
    return false;
  }
}
function checkIfPlayerCanJoinCourtInGameRoom(_somePlayer, _someCourt, _someRoom) {
  if (_someRoom.state == g_gameStates.ATTRACT || _someRoom.state == g_gameStates.WAITING) {
    if (_someRoom.courts[_someCourt.name].player) {
      return {canjoingame: false, message: 'Player already playing on this court'};
    } else {
      return {canjoingame: true, message: 'Court Avaialble for New Player'};
    }
  } else {
    return {canjoingame: false, message: 'Game Already In Progress'};
  }
}
function checkIfActiveCourt(_someCourt, _someRoom) {
  if (_someRoom.courts[_someCourt.name].player) {
    console.log('court has player so it is active');
    return true;
  } else {
    return false;
  }
}


//////////////// END NEW AND CLEAN /////////////////











////////////////////////////////////////////////////////

//- Web Socket (Socket.io)
function onConnection(socket) {
  ////////////////////////////////////////////////////////
  // Any new connection to the server calls this function and can use the info in here
  console.log('new connection - ' + socket.id);
  ////////////////////////////////////////////////////////

  //- Court Connection Functions (Court Setup)
  function unknownDevice(_deviceIP) {
    //if device is not a part of d_alldevices create a new device

    setupDevice(_deviceIP);

  }
  // function checkForKnownDevice(deviceIP) {
  //   if (deviceIP in d_alldevices) {
  //     console.log('we know this device already.');
  //   } else {
  //     console.log('device: ' + deviceIP + ' not in d_alldevices list');
  //     getDataFromAirtable();
  //     unknownDevice(deviceIP);
  //   }
  // }


  function setupCourt(_deviceData) {
    console.log('COURTCONNECTED: court connected for the first time');
    socket.deviceIP = _deviceData.deviceIP;
    // we know this is a court, so tell the Socket
    socket.devicetype = 'court';
    // courtnum += 1;

    d_connectedCourts[_deviceData.deviceIP] = _deviceData;
    // _debugObject(' - connected courts - newcourtdevice:' + _deviceData.deviceIP, d_connectedCourts);

    getCourtToShow(_deviceData.deviceIP);
  }

  function setupDevice(_deviceIP) {
    var newdevice = {
      ipaddress: _deviceIP,
      location: 'UNKNOWN LOCATION',
      zone: defaultZoneID //default zone record id
    };

    var devicezone = d_allzones[newdevice.zone];

    if(devicezone) {
      if (devicezone.devices) {
        // if zone already has devices add to existing array
        devicezone.devices.push(newdevice);
        // _debugObject('DeviceZone Devices:', devicezone);
      } else {
        // if zone doesn't have any devices, create new array of devices
        devicezone.devices = [newdevice];
      }
    } else {
      // if no zones exist, we could possibly create a new default zone here, but we really shouldn't be running this if we dont have any zones
    }

    // record in d_allzones is updated on devices.push

    // add device to list of devices
    updateDevices(newdevice, false);

    // PUSH TO AIRTABLE HERE
    config_base('Devices').create({
      "IP Address": newdevice.ipaddress,
      "Zone": [newdevice.zone],
      "Location in Zone": newdevice.location
    }, function(err, _record) {
        if (err) { console.error(err); return; }

        //Callback from API push
        var newdeviceid = _record.getId();
        newdevice['id'] = newdeviceid;

        // update list of devices
        updateDevices(newdevice, false);

        // find a court to use for this device
        findACourt(newdevice, devicezone);
    });

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
    }, function(err, _record) {
        if (err) { console.error(err); return; }

        //Callback from API push
        newcourtid = _record.getId();

        // do something to update local storage
        newcourt = {
            id: newcourtid,
            name: newcourtname,
            order: courtorder,
            zone: somezone.id,
            devices: [somedevice.id]
        }
        d_allcourts[newcourtid] = newcourt;
        d_courtnames[newcourtname] = newcourt;
        somedevice.court = newcourt;
        d_alldevices[somedevice.ipaddress] = somedevice;

        findARoom(newcourt,somedevice);
    });
  }
  function createRoom(somecourt) {
    console.log("Create Room called");
      var newroomname = randomCode(7);

      //push new room with name ^
      config_base('Rooms').create({
        "Name": newroomname
      }, function(err, _record) {
          if (err) { console.error(err); return; }

          //Callback from API push
          newroomid = _record.getId();
          // // // // // // // // console.log('NewRoom - ' + newroomid);

          newroom = {
            id: newroomid,
            name: newroomname
          }
          d_allrooms[newroomid] = newroom;
          d_roomnames[newroom.name] = newroom;

          somecourt['room'] = [newroomid];
          d_allcourts[somecourt.id] = somecourt;
          d_courtnames[somecourt.name] = somecourt;
          // // // // // // // // console.log('create a room assign');
          assignCourtToRoom(somecourt, newroomid);
      });

    }

  //court stuff I think
  function getCourtToShow(_deviceIP) {

    // find out if the device knows what court it should be a part of
    // first check to see if device is in list of devices
    if (_deviceIP in d_alldevices) {
      // if we know the device already, check its court and zone,
      var mydevice = d_alldevices[_deviceIP];
      // _debugObject('GETCOURTTOSHOW - device:', mydevice);
      var mycourt = d_allcourts[mydevice.court];
      // _debugObject(' - GETCOURTTOSHOW - mycourt', mycourt);

      var myzone;
      if (mydevice.zone) {
        myzone = d_allzones[mydevice.zone];
      } else {
        // if we don't have a zone set in config, set zone to the default
        console.log( ' - GETCOURTTOSHOW - No Zone Set, Using Default from Config');

        myzone = d_allzones[defaultZoneID];
      }
      // _debugObject(' - GETCOURTTOSHOW - myzone', myzone);

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
        console.log("We don't know a court, we need to - Findacourt called");
        findACourt(mydevice, myzone);
      }
    } else { //unknown device
      console.log('GETCOURTTOSHOW - device: ' + _deviceIP + ' not in d_alldevices list');
      getDataFromAirtable();
      unknownDevice(_deviceIP);
    }
  };
  function findARoom(_somecourt, somedevice) {
    var zoneid = somedevice.zone;
    var thiszone = d_allzones[zoneid];
    var courtNeedingRoom = _somecourt;

    // _debugObject('FINDAROOM start - thiszone' + zoneid +':', thiszone);

    if (thiszone.rooms) {
      var roomid = thiszone.rooms[0];

      courtNeedingRoom['room'] = [roomid];

      // _debugObject(' - FINDAROOM add room to court - somecourt:', courtNeedingRoom);

      assignCourtToRoom(courtNeedingRoom, roomid);

      updateCourts(courtNeedingRoom, true);
    } else {
      courtNeedingRoom.room = createRoom(courtNeedingRoom);
    }
  }
  function findACourt(_mydevice, _myzone) {
    //if device is not a part of a court
    //check zone of device for list of currently configured courts, and add to court based on device location

    var numcourts = countConnectedCourts();
    console.log('FINDACOURT: current courtnum - ' + numcourts);

    if (m_courtnum > 0) {
      m_courtnum = numcourts - 1;
    } else {
      m_courtnum = 0;
    }

    if (_myzone.configuration) {
      var zoneconfig = d_allconfigs[_myzone.configuration];
      m_courtnum = zoneconfig[_mydevice.location];
    } else {
      // console.log('FINDACOURT: ' + myzone.id + ' - no configuration');
    }

    if (m_courtnum != null) {
      console.log('FINDACOURT: ' + _mydevice.ipaddress + ' - should be in court #' + m_courtnum);
      var mycourt;

      //TODO DAVID this can be looked at later. We are just going to always create new court if not the same IP
      // if (_myzone.courts) {
      //   mycourt = d_allcourts[_myzone.courts[m_courtnum]];
      // }

      if (mycourt) {
        console.log('FINDACOURT: adding court to device [' + _mydevice.ipaddress + ']');
        console.dir(mycourt);
        _mydevice.court = mycourt;

        console.log('FINDACOURT: deviceinfo');
        console.dir(_mydevice);

        updateDevices(_mydevice, true);

        findARoom(mycourt, _mydevice);
      } else {
        console.log('FINDACOURT: need to create a new court for device [' + _mydevice.ipaddress + ']');
        createCourt(_mydevice, _myzone);
      }
    } else {
      debugObject(' - m_coutrnum is somehow null', _myzone);
      if (_myzone.courts) {
        mycourt = d_allcourts[_myzone.courts[0]];
        _mydevice.court = mycourt;
        updateDevices(_mydevice, false); //
        findARoom(mycourt, _mydevice);
      } else {
        console.log('no zone courts ');
      }
    }

  }
  function assignCourtToRoom(_somecourt, _someroomid) {
    var fullroomdata = d_allrooms[_someroomid];
    // _debugObject('ASSIGNCOURTTOROOM start - fullroomdata:', fullroomdata);
    // _debugObject('- ASSIGNCOURTTOROOM start - court:', _somecourt);
    // _debugObject('- ASSIGNCOURTTOROOM start - someroomid:', _someroomid);

    var data = {
      court: _somecourt,
      room: fullroomdata
    }

    socket.roomname = fullroomdata.name;
    socket.court = _somecourt;

    if (USEMASTERSLAVEMODE) {
      d_courtsandmaster[socket.court.id] = socket.court; //ERROR this won't work, becuase socket.court

      if (!socket.hasmaster) {
        socket.hasmaster = true;
        court = d_courtsandmaster[socket.court.id];
        court.slaves = [];
        d_courtsandmaster[socket.court.id] = court;
        // // // console.log('socket does not have master');
        console.log('ASSIGNCOURTTOROOM: setsockettomaster');
        setSocketMaster();
      }
      if (socket.syncdata){
        // // // // // // // console.log('calling syncslaves from assign court to room');
        syncSlaves(socket.syncdata);
      }
    }

    if (checkIfCourtInGameRoom(_somecourt, fullroomdata)) {
      console.log('ASSIGNCOURTTOROOM: Court Already in Game Room. What does this mean?');
      addCourtToGameRoom(_somecourt, fullroomdata);
    } else {
      fullroomdata.courts[_somecourt.name] = _somecourt;
      updateRooms(fullroomdata);
      addCourtToGameRoom(_somecourt, fullroomdata);
    }
    //TODO: David need to update court list
    socket.emit('join this room', data);
  }
  //- End Court Setup

  ////////////////////////////////////////////////////////

  function checkIfPlayerCanJoinGame(_someRoom, _someCourt) {
    //Check if player can joins
    //TODO: DAVID Needs work

    console.log('-------Check if Player Can Join Game-------');
    // _debugObject('SomeRoom', _someRoom);
    // _debugObject('SomeCourt', _someCourt);

    //check if gamestarted? check if canjoingame?
    var gamestarted;
    var gameInRoom = _someRoom.game;

    var canjoingame;
    var message;

    if (gameInRoom) {
      //room has a game already
      gamestarted = gameInRoom.gamerunning;
      canjoingame = gameInRoom.canjoingame;
    } else {
      gamestarted = _someRoom.gamerunning;
      canjoingame = _someRoom.canjoingame;
    }

    if (gamestarted) {
      socket.emit('game already running');
    } else if (!canjoingame) {
      console.log('cant join game yet');
      socket.emit('cant join game yet');
    } else {
      //CHECK COURT TO SEE IF GAME HAS STARTED, also if it has a player IF IT HAS, DON'T LET USER JOIN
      var hasplayer = _someCourt.hasplayer;
      if (hasplayer) {
        socket.emit('someone already playing');
        // same as court not found
      } else {
        //Player Should be able to join
      }
    }

    var returndata = {
      canjoingame: canjoingame,
      message: message
    }
    return returndata;
  }
  //- Player Connection Functions (Connect to Court)
  function playerRequestToJoinCourt(_somePlayerData, _somecourtname) {

    var courttojoin = d_courtnames[_somecourtname]; //Should this be d_connectedCourts?
    // // _debugObject('PLAYERREQUEST - courttojoin:', courttojoin);

    if (courttojoin) {

      var roomcourtisapartof = d_allrooms[courttojoin.room];
      // // _debugObject('JOINCOURT - roomcourtisapartof:', roomcourtisapartof);

      // var gameroom = g_gamerooms[roomcourtisapartof.name];


      if (g_activerooms[roomcourtisapartof.name]) {
        //do something by adding player to court requested
        // _debugObject('Room already active, adding additional player to active game', g_activerooms);

        var playerCanJoinGame_data = checkIfPlayerCanJoinGame(roomcourtisapartof, courttojoin);

        if (playerCanJoinGame_data.canjoingame) {
          courttojoin.hasplayer = true;

          // save the hasplayer variable back to our list of courts
          // _debugObject('Updating Courtnames, but also courts?', d_courtnames);
          updateCourts(courttojoin,false); // d_courtnames[_somecourtname] = courttojoin;

          //addroominfotosocket
          socket.roomname = roomcourtisapartof.name;

          // player has joined court, and room
          socket.join(socket.roomname);

          courttojoin.player = _somePlayerData;

          // // // console.log("IS GAME IN PROGRESS? " + socket.gamenamesrunning);
          // _debugObject('Player joining court - courttojoin:', courttojoin);
          console.log('JOINCOURT: before player joined court emit');
          // _debugSocket(socket);

          playerConnectedToCourt(_somePlayerData);
        } else {
          console.log("Player can't join game - " + playerCanJoinGame_data.message);
        }
      } else {

        // // _debugObject('Room not currently active, create a game, add player to it, and start waiting clock', roomcourtisapartof);
        // // _debugObject('CourtToJoin',courttojoin);

        g_gamerooms[roomcourtisapartof.name] = {
          courts: {}
        };
        g_gamerooms[roomcourtisapartof.name].courts[courttojoin.name] = {
          player: _somePlayerData
        };

        // // _debugObject('g_gamerooms', g_gamerooms);
        courttojoin.hasplayer = true;

        //addroominfotosocket
        socket.roomname = roomcourtisapartof.name;

        // player has joined court, and room
        socket.join(socket.roomname);

        var newGame = createNewGame(courttojoin, _somePlayerData);

        addPlayerToGame(newGame, _somePlayerData);

        roomcourtisapartof.game = newGame;

        updateRooms(roomcourtisapartof);
        updateActiveRooms(roomcourtisapartof);

        startGameLobbyInRoom(roomcourtisapartof);

        // _debugObject('PlayerRequest - gameAddedToRoom:', roomcourtisapartof);

        // g_activerooms
      }
    } else {
      console.log('PLAYERREQUEST - court not found');
      socket.emit('court not found'); //sends message back to player that court not available
    }
  }
  //- End Player Connection Functions

  ////////////////////////////////////////////////////////

  function changeRoomGameState(_someRoom, _someGameState) {
    _someRoom.state = _someGameState;

    updateRooms(_someRoom);
    updateActiveRooms(_someRoom);

    updateDevicesInRoomGameStates(_someRoom);
  }
  function updateDevicesInRoomGameStates(_someRoom) {
    // _debugObject('UPDATEGAMESTATES', _someRoom);
    socket.broadcast.to(_someRoom.name).emit('update game state', _someRoom.state);
    socket.emit('update game state', _someRoom.state);
  }

  function startGameLobbyInRoom(_someRoom) {
    changeRoomGameState(_someRoom, g_gameStates.WAITING);

    startWaitingClock(_someRoom);
  }

  function updateActiveRooms(_someRoom) {
    g_activerooms[_someRoom.name] = _someRoom;

    // _debugObject('g_activerooms:', g_activerooms);
  }

  ////////////////////////////////////////////////////////

  //- GameScoring
  function addCourtGameScore(_courtgamedata) {
    var thisgamesroom = d_roomnames[socket.roomname];
    var thisgamename = thisgamesroom.gamename;

    redirectPlayer(_courtgamedata);


    _debugObject('ADDCOURT - thisgamesroom', thisgamesroom);
    _debugObject('ADDCOURTGAMESCORE - d_allGames', d_allgames);

    var thisgame = d_allgames[thisgamename];
    // add score to list of scores
    if (thisgame) {
      console.log('thisgame already in d_allgames: ');
      console.dir(thisgame);
      console.log('pushing new score to thisgame array');
      console.log(courtname);

      var scoredata = {
        playername: _courtgamedata.player.username,
        courtname: _courtgamedata.player.court,
        playerscore: _courtgamedata.score,
        playerstreak: _courtgamedata.highestStreak
      };

      console.log(' - _courtgamedata: ');
      console.dir(_courtgamedata);

      var thiscourtname = _courtgamedata.player.court;

      if (thisgame.courts[thiscourtname].players) {
        //TODO?
        // _debugObject('thisgame.courts[thiscourtname].players',thisgame.courts[thiscourtname].players);
        thisgame.courts[thiscourtname].players[_courtgamedata.player.username].score = scoredata.playerscore;
        thisgame.courts[thiscourtname].players[_courtgamedata.player.username].streak = scoredata.playerstreak;
      } else {
        console.log(' ** addCourtGameScore problem with thisgame.courts[thiscourtname].players[_courtgamedata.player.username]');
        console.dir(_courtgamedata);
      }


      if (thisgame.scores) {
        thisgame.scores.push(scoredata);
      } else {
        thisgame.scores = [scoredata];
      }
      // updateHighScorer(agame, courtgamedata);
      d_allgames[thisgamename] = thisgame;

    } else {
      console.log('ADDCOURTGAMESCORE: How the hell did you get here without a game?');
    }

    d_roomnames[socket.roomname] = thisgamesroom;

    console.log('____ADDCOURTGAMESCORE______')

    var allscoresin = checkScoresIn(thisgame);

    if (allscoresin) {
      getHighScore(thisgamename);
      pushGameToDatabase(thisgame);
      thisgame.haspushed = true;
    } else {
      console.log('NOT ALL SCORES IN');
      setTimeout(forceScoreSubmission, 2000, thisgame);
    }

  }

  function checkScoresIn(_someGame) {
    _debugObject('CHECK SCORES IN: _someGame', _someGame);
    for(var court in _someGame.courts) {
      for (var player in court.players) {
        if (player.score) {
          return true;
        } else {
          break;
        }
      }
    }
  }

  function forceScoreSubmission(_somegame) {
    var thisgame = d_allgames[_somegame.name];
    if (!thisgame.haspushed) {
      getHighScore(thisgame.name);
      pushGameToDatabase(thisgame);
      thisgame.haspushed = true;
    } else {
      console.log('FORCESCORESUBMISSION: game already pushed');
    }
  }

  function pushGameToDatabase(_gameData) {
    console.log('____PUSHGAMETODATABASE____');
    console.dir(_gameData);

    // var winnerCourtID = d_courtnames[_gameData.highscore.courtname].id;
    // console.log('winnercourtid - ' + winnerCourtID)

    score_base('Games').create({
      "Name": _gameData.name,
      "Date": _gameData.gameDateTime,
      // "Players": players,
      "Winning Player": _gameData.highscore.playername
    }, function(err, _record) {
        if (err) { console.error(err); return; }

        //Callback from API push
        var newgameid = _record.getId();

        // pushPlayerScores(newgameid, _gameData.players);
    });
  }

  //TODO: push player scores will need to go through all courts and then players
  function pushPlayerScores(_gamerecordId, _playersdata) {
    var players = [];

    console.log(' - gamedata players');
    console.dir(_playersdata);

    for( var playername in _playersdata ) {

      var player = _playersdata[playername];

      score_base('Players').create({
        "Name": player.username,
        "Score": player.score,
        "Longest Streak": player.streak,
        "Game": [_gamerecordId]
      }, function(err, _record) {
          if (err) { console.error(err); return; }

          //push new player to array of players
          console.log(_record.getId());
          players.push(_record.getId());
      });
      console.log('players');
      console.dir(players);
    }
  }

  function getHighScore(_gamename) {
    console.log('GETHIGHSCORE: ' + _gamename);

    var thisgamesroom = d_roomnames[socket.roomname];
    var thisgame = d_allgames[_gamename];

    thisgame.highscore = 0;


    // _debugObject('Go Through Scores', thisgame);


    for (index in thisgame.scores) {
      var ascore = thisgame.scores[index];
      console.log(' - ascore in thisgame');
      console.dir(ascore);

      // _debugObject(' - thisgame', thisgame);

      if (thisgame.highscore) {
        console.log('highscore already exists - ');
        console.dir(thisgame.highscore);
        console.log('this score');
        console.dir(ascore);
        if (ascore.playerscore > thisgame.highscore.playerscore) {
          console.log('new high score');
          thisgame.highscore = ascore;
        } else {
          console.log('score '+ ascore.playerscore +' lower than high score ' + thisgame.highscore.playerscore);
        }
      } else {
        console.log('new highscore');
        thisgame.highscore = ascore;
      }
      console.log('anything else here?');

    }
    // // console.log('setting scorescounted to 0: ' + gamename);

    console.log('what about here?');
    thisgamesroom.scorescounted = 0;
    // // // console.log('resetting scorescounted' + thisgamesroom.scorescounted);
    d_roomnames[socket.roomname] = thisgamesroom;

    var emitData = thisgame;

    console.log(' - emit data');
    console.dir(emitData);

    socket.broadcast.to(socket.roomname).emit('show results', emitData);
    socket.emit('show results', emitData);

    // // // // // console.log("socket roomname: " + socket.roomname);
    d_allgames[_gamename] = thisgame;
  }
  //- End GameScoring

  ////////////////////////////////////////////////////////

  function redirectPlayer(courtGameData) {
      // var playername = data.player.username;
      // var playerscore = data.player.score;
      // var playerdata = {
      //   playername: playername,
      //   playerscore: playerscore
      // }
      console.log('redirectPlayer: socket - ' + courtGameData);
      // _debugSocket(socket);
      // socket.emit('show results', playerdata);
    }

  ////////////////////////////////////////////////////////

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
    var thiscourt = d_courtsandmaster[courtid];
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
        d_courtsandmaster[courtid] = thiscourt;
        // // // console.log('candm:');
        // // console.dir(d_courtsandmaster);
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

        d_courtsandmaster[courtid] = thiscourt;
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
        d_courtsandmaster[courtid] = thiscourt;
        socket.emit('set master');
      }
    } else {
      // // // console.log('Court not listed - add court to list and set master to this socket');
      thiscourt = {
        id: courtid,
        master: socket.id
      };

      //d_courtsandmaster[courtid] = thiscourt;
      // // // console.log(d_courtsandmaster[courtid]);
      // // // console.dir(thiscourt);
      // // // // console.log('candm list: ');
      // // // console.dir(d_courtsandmaster);

        // // // console.log("END OF SOCKET " + socket.id);
      //socket.court.master = socket.id;
      // // // console.log("SYNC DATA " + socket.syncdata);
      //syncSlaves(socket.syncdata);
      // // // console.log('setting this socket to master:' + socket.court.master);
      //socket.hasmaster = true;
      //socket.emit('set master');
    }

    // if (d_masters[socket.court.id]) {
    //   socket.master = d_masters[socket.court.id];
    // } else {
    //   socket.master = socket.id;
    //   d_masters[socket.court] = socket.id;
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
      d_courtsandmaster[socket.court.id].master = null;
    var newmaster = court.slaves.pop();
      // // // console.log("new master");
    // // console.dir(newmaster);

    if(newmaster)
    {
        d_courtsandmaster[socket.court.id].master = newmaster;
        socket.hasmaster = true;
        // // // console.log("FIND NEW MASTER SET MASTER EMIT " + socket.id)
        io.to(d_courtsandmaster[socket.court.id].master).emit('set master');
    }
    else {
      socket.court.master = null;
      d_courtsandmaster[socket.court.id] = null;
      // // // console.log(d_courtsandmaster[socket.court.id]);
      //socket.court.id = null;
      setSocketMaster();
    }

  }
  function sendToSpecificSocket(socketID) {
    console.log("SEND TO SPECIFIC MASTER " + socketID);
    io.to(socketID).emit('set master');
  }
  // end of USEMASTERSLAVEMODE functions

  ////////////////////////////////////////////////////////

  //- Game Related Functions
  function createNewGame(_someroom, _firstPlayer) {

    var newDate = new Date();

    var gameName = createGameName(_someroom, newDate);

    newGameObject = {
      name: gameName,
      gameDateTime: newDate,
      courts: {
      },
      state: g_gameStates.INACTIVE,
      haspushed: false
    }

    // _debugObject('NEWGAMECREATED: ', newGameObject);

    return newGameObject;
  }
  function createGameName(_someRoom, _someDate) {
    var month = _someDate.getMonth();
    var day = _someDate.getDate();
    var hour = _someDate.getHours();
    var minutes = _someDate.getMinutes();

    var newgamename = _someRoom.id + '_' + month + '_' + day + '_' + hour + '_' + minutes;

    return newgamename;
  }
  function addPlayerToGame(_someGame, _somePlayerData) {
    var courtname = _somePlayerData.court;

    // _debugObject('Add player to game:', _somePlayerData);
    if (_someGame.courts[courtname]) {
      // if this court is already a part of the game, and we are somehow adding another player
      _someGame.courts[courtname].players[_somePlayerData.username] = _somePlayerData;
    } else {
      var tempPlayersObject = {};
      tempPlayersObject[_somePlayerData.username] = _somePlayerData;

      var playercourt = {
        name: courtname,
        players: tempPlayersObject
      }

      playerConnectedToCourt(_somePlayerData);
      addCourtToGame(_someGame, playercourt);
    }

    // _debugObject('PLAYERADDEDTOGAME:', _someGame);
    return _someGame;
  }
  function addCourtToGame(_someGame, _someCourt) {
    _someGame.courts[_someCourt.name] = _someCourt;
  }
  function startGameInRoom(_someRoom) {
    var thisgamesroom = d_roomnames[socket.roomname];

    // _debugObject('startGameInRoom: _someRoom', _someRoom);
    // _debugObject('startGameInRoom: thisgamesroom', thisgamesroom);

    var newdate = new Date();

    console.log('---Step 3---');
    console.log('start game (current gamename)- ' + thisgamesroom.gamename);

    thisgamesroom.gamerunning = true;
    thisgamesroom.canjoingame = false;
    thisgamesroom.scorescounted = 0;

    // console.log('starting game with new gamename: ' + thisgamesroom.gamename);
    // // // console.log('game started: ' + thisgamesroom.gamename);

    //TODO: huh? why is courtcount set?
    // // // console.log('courtcount: ' + thisgamesroom.courtcount);
    // socket.gamename = thisgamesroom.gamename;
    // console.log('new socketgame: '+ socket.gamename);

    d_roomnames[socket.roomname] = thisgamesroom;
    d_allrooms[thisgamesroom.id] = thisgamesroom;

    // updateGameName(thisgamesroom.gamename);

    var gamedata = {
      // gamename: thisgamesroom.gamename,
      room: thisgamesroom,
      game: socket.game
    }

    // // console.log('game almost ready');
    socket.broadcast.to(socket.roomname).emit('game almost ready', gamedata);
  }
  //- END Game Related Functions

  ////////////////////////////////////////////////////////

  //- Scoring Related Functions
  function courtGameHasEnded(someGameData) {
    var thisgamesroom = d_roomnames[socket.roomname];

    if (thisgamesroom.gamerunning) {
      // socket.broadcast.to(socket.roomname).emit('end all games', socket.court);
      thisgamesroom.gamerunning = false;

      d_roomnames[socket.roomname] = thisgamesroom;
      d_allrooms[thisgamesroom.id] = thisgamesroom;
    }
  }
  function addCourtScoreForGame(someCourtData) {

    // var thisgamesroom = d_roomnames[socket.roomname];
    // var thisgamename = thisgamesroom.gamename;
    // console.log('--BREAKING--');
    // // _debugSocket(socket);
    //
    // gamedata = socket.game;
    // console.log("Socket.game");
    // console.dir(gamedata);
    //
    //
    // socket.game.name = thisgamename;
    //
    // //
    // // thisgame = d_allgames[socket.gamename];
    // // console.log("Thisgame");
    // // console.dir(thisgame);
    //
    // d_allgames[socket.game.name] = gamedata;
    //
    // // if all scores have been added for this game call push to database function
    // // pushScoreForGameToDatabase(gamedata);
  }
  function pushScoreForGameToDatabase(gamedata) {
    console.log('PUSHSCOREFORGAME: gamedata to push');
    console.dir(gamedata);
  }
  //- END Scoring Related functions

  ////////////////////////////////////////////////////////

  //- Court Connection and Disconnection
  function courtConnected(_deviceData) {
    // store device IP and save it to socket
    var deviceIP = _deviceData.deviceIP;

    if (d_connectedCourts[deviceIP]) { // If court was already in list of courts
      courtReconnected(deviceIP);
    } else { // If first time connection
      setupCourt(_deviceData);
    }
  }
  function courtReconnected(_someDeviceIP) {
    //court has already connected (this is probably a reconnect)
    var courtinfo = d_connectedCourts[_someDeviceIP];

    console.log('CONNECTION: court reconnected [IP: ' + _someDeviceIP + ' , SOCKET: ' + socket.id + ']');
    console.log('courtinfo - ');
    console.dir(courtinfo);

    socket.emit('court reconnected', courtinfo);

    if(socket.court === undefined) {
      console.log("COURT CONNECTION: unknown court");
      getCourtToShow(_someDeviceIP);
    }
    else {
      console.log("COURT CONNECTION: socket already knows court, calling setSocketMaster");
      setSocketMaster();
    }
  }
  function courtDisconnected(_somesocket) {

    var thisgamesroom = d_roomnames[_somesocket.roomname];

    console.log('COURTDISCONNECTED:');
    // _debugSocket(_somesocket);
    console.log(' - courtcount: ' + thisgamesroom.courtcount);
    thisgamesroom.courtcount -= 1;
    console.log(' - courtcount2: ' + thisgamesroom.courtcount);

    if (thisgamesroom.courtcount <= 0) {

      console.log(' - setgamerunning to false: ' + thisgamesroom.courtcount);
      thisgamesroom.gamerunning = false;

      socket.emit('end all games', _somesocket.court);
      console.log(' - forcing room to reset');
      socket.emit('force room reset');
      thisgamesroom.courtcount = 0;
    }
    d_roomnames[_somesocket.roomname] = thisgamesroom;
    d_allrooms[thisgamesroom.id] = thisgamesroom;

    var thiscourt = d_courtnames[_somesocket.court.name];

    // TODO: this is where we would decriment the courtnumber if the disconnect was for a long enough timeout

    thiscourt.hasplayer = false;
    d_courtnames[_somesocket.court] = thiscourt;

    if (socket.court) {
      var somecourtid = _somesocket.court.id;
      var courtid = somecourtid;
      var court = d_courtsandmaster[courtid];

      socket.emit('reset game');
      // socket.broadcast.to(somesocket.roomname).emit('reset game');

      if(USEMASTERSLAVEMODE) {

        if (court.master == socket.id) {

          findNewMaster(socket.id);
        } else {
          var slaveindex = court.slaves.indexOf(socket.id);
          court.slaves.pop(slaveindex);
          d_courtsandmaster[courtid] = court;

        }
      }
    }

  }
  //- END Court Connection Related Functions

  //- Player Connection and Disconnection
  function playerConnectedToCourt(_somePlayerData) {
    socket.broadcast.to(socket.roomname).emit('player joined court', _somePlayerData);
    // // // // // console.log('socket.roomname - ' + socket.roomname);

    var emitData = {
      roomname: socket.roomname
    }

    socket.emit('you joined court', emitData);
  }
  function playerDisconnected(somesocket) {
    console.log('PLAYERDISCONNECTED: remove them from the players in a game');
    var thisgamesroom = d_roomnames[somesocket.roomname];

    // thisgamesroom.courtcount -= 1;
  }
  //- END Player Connection Related Functions



  ///////// NEW AND CLEAN /////////

  function addCourtToGameRoom(_someCourt, _someRoom) {
    _someRoom.courts[_someCourt.name] = _someCourt;
    updateGameRooms(_someRoom);
  }
  function addPlayerToCourtInGameRoom(_somePlayer, _someCourt, _someRoom) {
    _someRoom.courts[_someCourt.name].player = _somePlayer;
    updateGameRooms(_someRoom);

    var emitData = {
      player: _somePlayer,
      court: _someCourt,
      room: _someRoom
    }

    socket.roomname = _someRoom.name;
    socket.join(socket.roomname);
    socket.emit('player can join room', emitData);

    playerConnectedToCourt(_somePlayer);
  }
  function playerRequestToJoinCourtInGameRoom(_somePlayer, _someCourt, _someRoom, _somesocket) {
    var courtingameroom = checkIfCourtInGameRoom(_someCourt, _someRoom);

    if (courtingameroom) {
      var availabilitycheck = checkIfPlayerCanJoinCourtInGameRoom(_somePlayer, _someCourt, _someRoom);

      if (availabilitycheck.canjoingame) {
        addPlayerToCourtInGameRoom(_somePlayer, _someCourt, _someRoom);
        _someCourt.hasplayer = true; //holdover from before
        updateCourts(_someCourt,false);

        if (_someRoom.state == g_gameStates.ATTRACT) {
          //start game and change state of game room
          startGameLobbyInRoom(_someRoom);
        } else {
          //game is already in waiting state, and should start soon.
        }
      } else {
        //some sort of message should be sent to player
        console.log("Can't Join - " + availabilitycheck.message);
      }
    } else {
      console.log('Court - ' + _someCourt.name + ' not in room - ' + _someRoom.name);
    }
  }

  /////// END NEW AND CLEAN ///////










  ////////////////////////////////////////////////////////
  //               **SOCKET LISTENERS**                 //

  //- sent from court.js in "getDeviceInfo"
  socket.on('court connected', function(_deviceData) {
    courtConnected(_deviceData);
  });
  //  player disconnect requested
  socket.on('disconnect this device', function() { // called from player
    socket.disconnect();
  });
  //- END Socket Connection related calls

  socket.on('update court', function(courtdata) { //court joins new room
    // // // // // // // // console.log('updating court');
    // var newCourt = {
    //   name: data.courtname,
    //   room: socket.roomname
    // };
    var newroomid = courtdata.room;
    d_courtnames[courtdata.name].room = newroomid;
    var newroom = d_allrooms[newroomid];
    socket.join(newroom);
    // // // // // // // // // console.log('Courts: ');
    // // // // // // // console.dir(courts);
  });
  socket.on('join room', function(data) { //court does this
    roomname = data.roomname;
    courtname = data.courtname;

    socket.join(roomname);
    socket.roomname = roomname;
    socket.court = d_courtnames[data.courtname];

    // // // // // // // // console.log('index.js: court: ' + socket.courtname + ' joining room - ' + socket.roomname);
    // socket.broadcast.to(socket.roomname).emit('court joined room', data);
    socket.emit('court joined room', data);
  });


  //player stuff I think
  socket.on('player wants to join court', function(_playerdata) { //player does this
    // we know this a player, so tell the Socket
    socket.devicetype = 'player';

    socket.username = _playerdata.username;
    socket.team = _playerdata.team;
    socket.court = _playerdata.court;

    var courttojoin = d_courtnames[_playerdata.court];
    var roomcourtisapartof = d_allrooms[courttojoin.room[0]];

    // playerRequestToJoinCourt(_playerdata, courttojoin);

    playerRequestToJoinCourtInGameRoom(_playerdata, courttojoin, roomcourtisapartof);
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
  });


  socket.on('waiting countdown less than four', function(courtName) {
    console.log('Countdown on - ' + courtName + ' is 4 or less');

    var thisgamesroom = d_roomnames[socket.roomname];

    console.log('---Step 1---');
    console.log('thisgamesroom:');
    console.dir(thisgamesroom);

    if (thisgamesroom.gamerunning) {
      console.log('WAITING COUNTDOWN LESSTHANFOUR: Game is already running, we need to add our court to the count of courts running game');
      // socket.gamename = thisgamesroom.gamename;
      // thisgamesroom.courtcount += 1;
      // // // console.log('courtcount: ' + thisgamesroom.courtcount);
      d_roomnames[socket.roomname] = thisgamesroom;
      d_allrooms[thisgamesroom.id] = thisgamesroom;
    } else {
      console.log('Game is not running we need to start it');
      startGameInRoom(thisgamesroom);
    }

  });
  socket.on('game almost ready', function(courtName) {
    console.log('Game Almost Ready Called by - ' + courtName);

    var thisgamesroom = d_roomnames[socket.roomname];

    console.log('---Step 1---');
    console.log('thisgamesroom:');
    console.dir(thisgamesroom);

    if (thisgamesroom.gamerunning) {
      console.log('Game is already running, we need to add our court to the count of courts running game');
      // socket.gamename = thisgamesroom.gamename;

      // // // console.log('courtcount: ' + thisgamesroom.courtcount);
      d_roomnames[socket.roomname] = thisgamesroom;
      d_allrooms[thisgamesroom.id] = thisgamesroom;
    } else {
      console.log('Game is not running we need to start it');
      startGameInRoom(thisgamesroom);
    }

    //POSSIBLE ISSUE
    // if (!socket.gamename) {
    //
    //   socket.gamename = thisgamesroom.id + '_' + thisgamesroom.gamenum;
    //   // console.log('setting socket.gamename' + socket.gamename);
    // }

    // // console.log('d_roomnames');
    // // console.dir(d_roomnames);

    // // // // // console.log("this games room " + thisgamesroom);
    // // // // // console.log('running:' + thisgamesroom.gamerunning);


    //TODO: WILL NEED TO LISTEN FOR AN EVENT TO TURN GAME PROGRESS OFF AFTER RESULTS ARE SHOWN

  });


  socket.on('touch event', function(data) {
    // // // // // // // console.log('Some Touch Event');
    // // // // // // console.dir(data);
  });
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
  socket.on('send game data', function(someGameData, someCourtData) {
    console.log('SENDGAMEDATA CALLED');
    courtGameHasEnded(someGameData);

    console.log('game over: gamedata');
    console.dir(someGameData);

    console.log('SOCKETONGAMEOVER: courtData');
    console.dir(someCourtData);

    // addCourtScoreForGame(someGameData);
    // Submit Player Data To Database
    addCourtGameScore(someGameData);

  });


  socket.on('room reset', function() {
    var thisgamesroom = d_roomnames[socket.roomname];

    // // // // // console.log('roomname:' +socket.roomname);
    // // // // // console.log('room reset called');
    // // // // console.dir(d_roomnames);
    if (thisgamesroom) {
      // console.log('room reset called');

      thisgamesroom.gamerunning = false;
      thisgamesroom.canjoingame = true;

      d_roomnames[socket.roomname] = thisgamesroom;
      d_allrooms[thisgamesroom.id] = thisgamesroom;

    } else {
      console.log('room reset called while room not set');
    }
  });
  socket.on('court reset', function(somecourtname) {
    console.log('court resetting');
    var thiscourt = d_courtnames[somecourtname];
    thiscourt.hasplayer = false;
    d_courtnames[somecourtname] = thiscourt;

    // _debugSocket(socket);

  });


  socket.on('update game', function(_gamedata) {
    // console.log('update game name from socket - ' + socket.gamename);
    //
    console.log('ON UPDATE GAME');

    socket.game = _gamedata;

    // _debugSocket(socket);
    // var thisgamesroom = d_roomnames[socket.roomname];
    //
    // thisgamesroom.gamename = newgamename;
    //
    // d_roomnames[socket.roomname] = thisgamesroom;
    // d_allrooms[thisgamesroom.id] = thisgamesroom;
    //
  });


  socket.on('start lobby', function(_firstplayer) {
    // TODO: Should be an emit now

    console.log('ONSTARTLOBBY: - createNewGame called');

    var thisgamesroom = d_roomnames[socket.roomname];

    var newGame = createNewGame(thisgamesroom, _firstplayer);

    addPlayerToGame(newGame, _firstplayer);
    thisgamesroom.courtcount = 1;

    thisgamesroom.gamename = newGame.name;

    d_roomnames[socket.roomname] = thisgamesroom;
    // console.dir(newGameObject);
    console.log('---Step 2---');
    console.log('add newGameObject to socket - ');
    socket.game = newGameObject;

    // _debugSocket(socket);

    console.log('SOCKETGAMENAME - ' + socket.game.name);
    // socket.gamename = thisgamesroom.gamename;

    d_allgames[socket.game.name] = socket.game;
  });
  socket.on('add player to game', function(_newplayer) {
    var currentGame = socket.game;

    var thisgamesroom = d_roomnames[socket.roomname];
    thisgamesroom.courtcount += 1;
    if (currentGame) {
      var updatedGame = addPlayerToGame(currentGame, _newplayer)
      d_allgames[updatedGame.name] = updatedGame;
      socket.game = updatedGame;
    } else {
      console.log("ADDPLAYERTOGAME: socket doesn't have game");
      currentGame = d_allgames[thisgamesroom.gamename];
      var updatedGame = addPlayerToGame(currentGame, _newplayer)
      d_allgames[updatedGame.name] = updatedGame;
      socket.game = updatedGame;
      // _debugSocket(socket);
    }
  });

  //- Master sync socket emits
  socket.on('sync screens', function(data) {
    socket.syncdata = data;
    if (socket.court) {
      if (USEMASTERSLAVEMODE) {
        syncSlaves(data);
      }
    } else {
      // If the socket this device has not already connected and learned its court, it needs to find it
      mydevice = d_alldevices[data.deviceIP];
      myzone = d_allzones[mydevice.zone];
      findACourt(mydevice,myzone);
    }
  });
  //- END Master sync socket emits

  //- any connected device(socket) disconnection and reconnection
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
  //- END device disconnection and reconnection emit handling

}
//- End Web Socket (Socket.io)

////////////////////////////////////////////////////////

//- Set Data
getDataFromAirtable();
//- END Set Data

////////////////////////////////////////////////////////

//- Routing, Socket Start, and Server Start
app.use(express.static(path.join(__dirname, 'public')), function(req, res) {
  // if (req.query.roomId) {
  //   // query = req.query.roomId;
  //   // // // // // // // // // console.log('feed routing use - ' + query);
  // }
});
io.on('connection', onConnection);
server.listen(port, function(){
  console.log('listening on %d', port);
});
//- End server function calls

////////////////////////////////////////////////////////
