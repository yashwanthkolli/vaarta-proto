var express = require('express')
const socketio = require('socket.io')
const http = require('http')
const config = require('./config')
const mediasoup =require('mediasoup')
const Room = require('./Room')
const Peer = require('./Peer')

const router = require('./router')

const port = process.env.PORT || 3001

// App setup
var app = express()
const server = http.createServer(app)

corsOptions = {
    cors: true,
    origins: ["http://localhost:3000"]
}
const io = socketio(server, corsOptions)

let workers = []
let nextMediasoupWorkerIdx = 0

let roomList = new Map()
;
(async () => {
    await createWorkers()
})()

async function createWorkers() {
    let {
        numWorkers
    } = config.mediasoup

    for (let i = 0; i < numWorkers; i++) {
        let worker = await mediasoup.createWorker({
            logLevel: config.mediasoup.worker.logLevel,
            logTags: config.mediasoup.worker.logTags,
            rtcMinPort: config.mediasoup.worker.rtcMinPort,
            rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
        })

        worker.on('died', () => {
            console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
            setTimeout(() => process.exit(1), 2000);
        })
        workers.push(worker)

        // log worker resource usage
        /*setInterval(async () => {
            const usage = await worker.getResourceUsage();

            console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }, 120000);*/
    }
}

function getMediasoupWorker() {
    const worker = workers[nextMediasoupWorkerIdx];

    if (++nextMediasoupWorkerIdx === workers.length)
        nextMediasoupWorkerIdx = 0;

    return worker;
}

function room() {
    return Object.values(roomList).map(r => {
        return {
            router: r.router.id,
            peers: Object.values(r.peers).map(p => {
                return {
                    name: p.name,
                }
            }),
            id: r.id
        }
    })
}

io.on('connection', (socket) => {
    console.log("New Connection")

    socket.on('createRoom', async ({
        room_id
    }, callback) => {
        if (roomList.has(room_id)) {
            console.log('Already Exists')
            // callback('already exists')
        } else {
            console.log('---created room--- ', room_id)
            let worker = await getMediasoupWorker()
            roomList.set(room_id, new Room(room_id, worker, io))
            // callback(room_id)
        }
    })

    socket.on('join', async ({ room_id, name }, callback) => {

        console.log('---user joined--- \"' + room_id + '\": ' + name)
        if (!roomList.has(room_id)) {
            // return cb({
            //     error: 'room does not exist'
            // })
            console.log('---created room--- ', room_id)
            let worker = await getMediasoupWorker()
            roomList.set(room_id, new Room(room_id, worker, io))
        }
        roomList.get(room_id).addPeer(new Peer(socket.id, name))
        socket.room_id = room_id

        // cb(roomList.get(room_id).toJson())
    })

    socket.on('disconnect', () => {
        console.log('User Left')
    })
})

app.use(router)

server.listen(port, () => console.log(`Server running on ${port}`))
