const config = require('./config');
const app = require('express')();
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const { videoToken } = require('./tokens');
const http=require('http').createServer(app)
const io = require('socket.io')(http);

// Alex's SOCKET code
let val = true
let rLString;
let debtateTime = 5
let intermissionTime = 3
// This class holds an array of all the rooms
class Rooms {
  constructor() {
    this.roomList = {}
  }
  
  newRoom(name) {
    let r = new Room(name)
    this.roomList[r.name] = r
    return r
  }

  delRoom(name) {
    this.roomList[name] = null
  }

  get allRooms() {
    return this.roomList
  }
  // this could include summary stats like average score, etc. For simplicy, just the count for now
  get numberOfRooms() {
    return this.roomList.length
  }

  sendRoomUpdate() {
    rLString = JSON.stringify(roomList.allRooms)
    io.to('lobby').emit('initialRoomList', rLString)
  }
}


// Class framework for each Room. Will allow us to manage the rooms better
// Will probably need to store all these in an array or another class.
// Could potentially do objects to but I think this is smarter
// https://socket.io/docs/rooms/
class Room {
  constructor(name) {
    this.name = name;
    this.host = null;
    this.contender = null;
    this.spectators = [];
    this.topic = 'Topic Name';
    this.hostArg = 'Is the Greatest';
    this.contenderArg = 'Is the Worst';
    this.status = 'Waiting';
    this.hostPoints = 0;
    this.contenderPoints = 0;
    this.messages = [{
      timeStamp: 20200700456,
      fromUser: 'Alex',
      message: 'Lets go!'
    },
    {
      timeStamp: 20200700456,
      fromUser: 'Avery',
      message: 'OK!'
    }]
  }

  get numberOfUsers() {
    return this.users
  }

  messageRoomUsers(message, user='Server') {
    io.to(this.name).emit('message', {
      roomName: this.name,
      fromUser: user,
      message: message})
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  startGame() {
    // The framework of the game! Toggles the turns
    io.to(this.name).emit('startGame', {
      roomName: this.name
    })
    this.sleep(5000)
    .then(() => {
      io.to(this.name).emit('gameCommand', `${this.contender} (Contender) is muted!`)
      io.to(this.name).emit('mute', {
        mute: this.contender,
        intermission: false,
        timer: debtateTime
      })
    })
    .then(() => this.sleep(debtateTime * 1000))
    .then(() => {
      io.to(this.name).emit('gameCommand', `Intermission`)
      io.to(this.name).emit('mute', {
        mute: this.host,
        intermission: true,
        timer: intermissionTime
      })
    })
    .then(() => this.sleep(intermissionTime * 1000))
    .then(() => {
      io.to(this.name).emit('gameCommand', `${this.host} (Host) is muted!`)
      io.to(this.name).emit('unMute', this.contender)
      io.to(this.name).emit('mute', {
        mute: this.host,
        intermission: false,
        timer: debtateTime
      })})
    .then(() => this.sleep(debtateTime * 1000))
    .then(() => {
      io.to(this.name).emit('unMute', this.host)
      io.to(this.name).emit('gameCommand', 'Game over - nobody is muted')
      })
    }
  }

// Roomslist is an instance of the roomS class.
const roomList = new Rooms('roomList');
// Two rooms in here for testing purposes.
roomList.newRoom('testRoom')
roomList.newRoom('otherRoom')

let interval;
io.sockets.on('connection', function (socket) {
  // Send roomList to each new participant
  socket.join('lobby')
  rLString = JSON.stringify(roomList.allRooms)
  // Send room data to client that just connected.
  socket.emit('initialRoomList', rLString)
  // console.log('all rooms being sent: ', Object.keys(roomList.allRooms))

  socket.on('disconnect', function (socket) {
    console.log('socket disconnected')
  })

  socket.on('createRoom', function (data) {
    console.log(`Request to Create ${data.roomName} by ${data.userName} received.`)

    // Socket Joins the 'socket'room'
    socket.join(data.roomName)
    // Also create an instance of the room class.
    roomList.newRoom(data.roomName)
    // Assign the username as host of the newly created class.
    roomList.roomList[data.roomName]['host'] = data.userName

    // Send an updated room list to everyone in the lobby.
    roomList.sendRoomUpdate()
    console.log(`Current roomList is ${roomList.allRooms}`)
  });

  socket.on('joinRoom', function (data) {
    console.log(`Request to join ${data.roomName} from ${data.userName} received.`)
    // Add to room list
    roomList.roomList[data.roomName]['contender'] = data.userName

    // Socket Joins the 'socket'room'
    socket.join(data.roomName)
    
    // Send out update to everyone in lobby.
    roomList.sendRoomUpdate()

    // Room is full if host & contender spots exist
    if (roomList.roomList[data.roomName]['contender'] && roomList.roomList[data.roomName]['host']) {
      console.log(`${data.roomName} is FULL`)

      roomList.roomList[data.roomName]['messages'].push({
        timeStamp: 20200700456,
        fromUser: 'Server',
        message: 'Room is full!'
      })

      roomList.sendRoomUpdate()

      // Starts the game method!
      roomList.roomList[data.roomName].startGame();
    }
  });

  socket.on('leaveRoom', function (data) {
    console.log(`Request to leave ${data.roomName} from ${data.userName} received.`)

    if (roomList.roomList[data.roomName]['contender'] === data.userName) {
      roomList.roomList[data.roomName]['contender'] = null
    } else if (roomList.roomList[data.roomName]['host'] === data.userName) {
      // Removes the instance of the class 
      roomList.roomList[data.roomName] = null
    }

    socket.leave(data.roomName)
    roomList.sendRoomUpdate()

    // rLString = JSON.stringify(roomList.allRooms)
    // socket.emit('initialRoomList', rLString)
  })

  socket.on('message', function(data) {
    console.log(`Message received from ${data.userName} - ${data.message}`)
    roomList.roomList[data.roomName]['messages'].push({
      timeStamp: 20200700456,
      fromUser: data.userName,
      message: data.message
    })

    roomList.sendRoomUpdate()
  })
});

// const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(pino);

const sendTokenResponse = (token, res) => {
  res.set('Content-Type', 'application/json');
  res.send(
    JSON.stringify({
      token: token.toJwt()
    })
  );
};

app.get('/api/greeting', (req, res) => {
  const name = req.query.name || 'World';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

app.get('/video/token', (req, res) => {
  const identity = req.query.identity;
  const room = req.query.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);

});
app.post('/video/token', (req, res) => {
  const identity = req.body.identity;
  const room = req.body.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);
});

http.listen(3001, () =>
  console.log('Express server is running on localhost:3001')
);
