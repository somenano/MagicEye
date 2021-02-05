"use strict"

function new_websocket(url, ready_callback, message_callback) {
    let socket = new WebSocket(url);
    socket.onopen = function() {
        console.log('WebSocket is now open');
        if (ready_callback !== undefined) ready_callback(this);
    }
    socket.onerror = function(e) {
        console.error('WebSocket error');
        console.error(e);
    }
    socket.onmessage = function(response) {
        console.log('New message from: '+ url);
        // console.log(response);
        if (message_callback !== undefined) message_callback(response);
    }

    return socket;
}

new_websocket('wss://node.somenano.com/repeater', function(socket) {
    // onopen
    let params = {
        action: 'subscribe',
        topic: 'confirmation'
    }
    socket.send(JSON.stringify(params));
}, function(response) {
    // onmessage
    let data = JSON.parse(response.data);
    if (data.topic != 'confirmation') return;
    handle_block_dump(data);
});

// 30 second CPS tracker
var cps_tracker = new Array(30).fill(0);
setInterval(update_cps, 1*1000);

function get_cps()
{
    return cps_tracker.reduce(function(a, b) { return a + b; }, 0) / cps_tracker.length;
}

function update_cps()
{
    // Every second update the array
    cps_tracker = cps_tracker.slice(1,);
    cps_tracker.push(0);
}

function handle_block_dump(data)
{
    let dtg, cps, blocks, duration = undefined;
    try {
        dtg = new Date(data.dtg);
        cps = data.cps;
        blocks = data.blocks;
        duration = data.duration;
    } catch(e) {
        console.error('In index.handle_block_dump: error parsing received WebSocket data.');
        console.error(data);
        console.error(e);
        return;
    }

    console.log(''+ String(dtg.getHours()).padStart(2, '0') +':'+ String(dtg.getMinutes()).padStart(2, '0') +':'+ String(dtg.getSeconds()).padStart(2, '0') + ' - Received '+ blocks.length +' Nano Blocks from the last '+ (duration/1000).toFixed(2) +' second(s). CPS is '+ cps.toFixed(2) +' over the last 30 seconds.');

    // Iterate over each block and "handle" spread over the given duration
    if (handle_new_block === undefined) {
        console.error('You must define handle_new_block(block)!');
        return;
    }

    let spread = duration / blocks.length;
    for (let i=0 ; i<blocks.length ; i++) {
        let block = blocks[i];
        setTimeout(function() {
            cps_tracker[cps_tracker.length-1] += 1;

            handle_new_block(block);
        }, spread*i);
    }

}