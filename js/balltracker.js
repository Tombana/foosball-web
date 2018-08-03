var websocket;

// Pass an onOpen, onError and onMessage function
function initBalltracker(onOpen, onError, onMessage) {
    // Open a connection to the Balltracking program
    websocket = new WebSocket("ws://localhost:8420/");
    websocket.onopen = onOpen;
    websocket.onmessage = onMessage;
    websocket.onerror = onError;
}

function balltrackerConnected() {
    return (websocket.readyState == websocket.OPEN);
}

function showReplay() {
    if (websocket.readyState == websocket.OPEN)
        websocket.send("replay");
}

function startCamera() {
    if (websocket.readyState == websocket.OPEN)
        websocket.send("start");
}

function stopCamera() {
    if (websocket.readyState == websocket.OPEN)
        websocket.send("stop");
}

