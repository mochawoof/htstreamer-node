const app = require("express")();
const port = 80;
const wsPort = 8080;
const ws = require("ws");
const ver = "1";
const robot = require("robotjs"); // for screenshotting, mouse and keyboard etc
const sharp = require("sharp"); // to convert raw screenshot to jpg
const sendQualities = [10, 40, 70, 90, 100];
const sendResolutionMultipliers = [0.3, 0.5, 0.6, 0.8, 1];
const qualityNames = ["potato", "low", "med", "high", "lossless"];
let sendQualityIndex = 2 // med
const dataSep = String.fromCharCode(0);
const pollRate = 33;
const statPollRate = 1000;

let lastTrackSecond = 0;
let sendsPerThisSecond = 0;

let processingTime = 0;
let sendsPerSecond = 0;
let dataSize = 0;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.listen(port, () => {
    console.log("running html server on " + port + "...");
});

const wss = new ws.WebSocketServer({
    port: wsPort
}, () => {
    console.log("running websocket server on " + wsPort + "...");
});

function setupClientLoop(ws) {
    console.log("setting up client loop...");
    let interval = setInterval(() => {
        if (ws.readyState != ws.OPEN) {
            console.log("closing client loop");
            clearInterval(interval);
        }

        let processingTimeStart = Date.now();

        if (processingTimeStart - 1000 > lastTrackSecond) {
            lastTrackSecond = processingTimeStart;
            sendsPerSecond = sendsPerThisSecond;
            sendsPerThisSecond = 0;
        }

        let screen = robot.screen.capture();
        sharp(screen.image, {
            raw: {
                width: screen.width,
                height: screen.height,
                channels: 4
            }
        }).recomb([
            [0, 0, 1, 0],
            [0, 1, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 1]
        ]).resize({
            width: screen.width * sendResolutionMultipliers[sendQualityIndex],
            height: screen.height * sendResolutionMultipliers[sendQualityIndex]
        }).jpeg({
            quality: sendQualities[sendQualityIndex]
        }).toBuffer().then((b) => {
            dataSize = b.length;
            ws.send(b);

            sendsPerThisSecond++;
            processingTime = Date.now() - processingTimeStart;
        });
    }, pollRate);
}

function setupStatLoop(ws) {
    console.log("setting up stat loop...");
    let interval = setInterval(() => {
        if (ws.readyState != ws.OPEN) {
            console.log("closing stat loop");
            clearInterval(interval);
        }
        ws.send("stat" + dataSep + processingTime + dataSep + sendsPerSecond + dataSep + dataSize + dataSep + pollRate);
    }, statPollRate);
}

wss.on("connection", (ws) => {
    ws.on("error", console.error);

    ws.on("message", (d) => {
        let spl = d.toString().split(dataSep);
        if (spl[0] == "clientReady") {
            if (spl.length == 2 && spl[1] == ver) {
                setupClientLoop(ws);
            }
        } else if (spl[0] == "statReady") {
            setupStatLoop(ws);
        } else if (spl[0] == "qual") {
            if (spl.length == 2) {
                let qualityNameIndex = qualityNames.indexOf(spl[1].trim());
                sendQualityIndex = qualityNameIndex == -1 ? sendQualityIndex : qualityNameIndex;
            }
        } else if (spl[0] == "reqQual") {
            ws.send("reqQual" + dataSep + qualityNames[sendQualityIndex]);
        }
    });
});