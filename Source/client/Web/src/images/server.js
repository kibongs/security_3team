var express = require('express');
var app = express();
var path = require("path");
const https = require('https');
const http = require('http');

const ssl_config = require('./ssl-config');

const options = {
    key: ssl_config.privateKey,
    cert: ssl_config.certificate
}

// const server = https.createServer(options, app);
const server = http.createServer(app);
const cors = require('cors');
const io = require('socket.io')(server,{
    cors : {
        origin :"*",
        credentials :true
    }
});

app.use(cors());
app.use(express.urlencoded({
    extended: true
}))

const host = "https://team-server-dhzve.run.goorm.io";

var socketId = "";
io.on('connection', socket => {

    const req = socket.request;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('user connected: ' + socket.id + " ip:" +ip );

    if(socketId.length === 0){
        socketId = socket.id;
    }

    socket.on('alpr_video', (message, callback) => {
        io.to(socketId).emit('videoView', message);
    });

    socket.on('alpr_image', (message, callback) => {
        io.to(socketId).emit('imageView', message);
    });

    socket.on('cameraView', (message, callback) => {
        getFrameData(true, "");
    });

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.id);
        if(socket.id === socketId){
            stopAlpr();
            socketId = "";

        }
    });

});

var timerId = setInterval(() => serverHeartBit(), 5000);
function serverHeartBit(){
    const request = https.request(host + "/life", (response) => {
        io.to(socketId).emit("serverStatus", response.statusCode);
    });

    request.on('error', (error) => {
        io.to(socketId).emit("serverStatus", "200");
    });

    request.end();
}

const { exec }  = require('child_process');
let pid = 0;
let plateArr = [];
function getFrameData(query){
    var jwt = query.jwt;
    var executablePath = path.resolve('alpr.exe');
    var parameters = ["-c", query.ct, "-s", query.save, "-f", query.res];

    if(query.type === "camera"){
        parameters.push(query.name);
    } else if(query.type === "video" || query.type === "image"){
        parameters.push(path.resolve(query.name));
    }

    if(pid === 0){
        var cmd = executablePath + " " + parameters.join(' ');
        const child = exec(cmd, (error, stdout, stderr) => {
            if (error) {
            }
        });

        pid = child.pid;
        child.stdout.on('data', (data) => {
            if(data.includes("plate")){
                let _data = data.split(",");
                try{
                    if(_data[1] !== null && _data[2] !== null && _data[2] >= 90){
                        if(jwt !== null){
                            var options = {
                                timeout: 10000,
                                time: true,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${jwt}`
                                }
                            };
            
                            if(plateArr.length === 0 || !plateArr.includes(_data[1])){
                                plateArr.push(_data[1]);
                                const request = https.request(host+"/plate/get?plate_number="+_data[1], options, (response) => {
                                    let data = '';
                                    response.on('data', (chunk) => {
                                        data = data + chunk.toString();

                                    });
                                
                                    response.on('end', () => {
                                        try{
                                            const body = JSON.parse(data);
                                            io.to(socketId).emit('queryTimeout', '');
                                            io.to(socketId).emit('plateInfo', body);
                                        } catch(e){
                                            console.log(e);
                                        }
                                    });
                                });

                                request.on('error', (error) => {
                                    console.log('An error', error);
                                });

                                request.on('timeout', (message) => {
                                    stopAlpr();
                                    request.destroy();
                                    io.to(socketId).emit('queryTimeout', 'The server is not working properly. Please try again in a few minutes.');
                                })

                                request.end();
                            }
                        }
                    }
                } catch(e){
                    console.log(e);
                }
            } else if(data === "no") {
                io.sockets.emit('plateData', 'no');
            }
        });

        child.stderr.on('data', (data) => {
            console.log(`Error: ${data}`);
        });

        child.on('exit', (code) => {
            console.log("ALRP end");
            io.to(socketId).emit('alprEnd', '');
            pid = 0;
        });
    }
}

function stopAlpr(){
    io.sockets.emit('stopAlpr', 'stopAlpr');
}

app.post('/login', function(req, res){
    let email = req.query.email;
    let password = req.query.password;
    let otp = req.query.otp;

    const url = host +"/signin?username="+email+"&password="+password+"&otp="+otp;
    const request = https.request(url, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data = data + chunk.toString();
        });
    
        response.on('end', () => {
            try{
                
                const body = JSON.parse(data);
                console.log(body);
                res.send(body);
            } catch(e){
                console.log(e);
            }
        });
    })
    
    request.on('error', (error) => {
        console.log('An error', error);
    });
    
    request.end(); 
});

app.get('/startAlpr', function (req, res) {
    getFrameData(req.query);
    res.send("startAlpr");
});

app.get('/stopAlpr', function (req, res) {
    stopAlpr();
    res.send("stopAlpr");
});

server.listen(4000, function () {
    var host = server.address().address
    var port = server.address().port
})