// SomeNano Magic Eye
// See more of my projects: https://somenano.com

"use strict"

var nano_mark = new Image();
nano_mark.onload = function() {
    console.log('nano_mark loaded!');
};
nano_mark.src = '/images/nano-mark-dark.png';

var nano_mark_light = new Image();
nano_mark_light.onload = function() {
    console.log('nano_mark_light loaded!');
};
nano_mark_light.src = '/images/nano-mark-light.png';

window.BLOCKS = {};
const STORAGE_KEY = 'stereogram';
const IMG_WIDTH_MULT = 2.27;
const IMG_MAX_HEIGHT = 800;
const GROW_STEPS = 75;
const DEFAULT_FPS = 5;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function getBaseLog(x, y) {
    // Base x of y
    // Ex: Base 2 of 8 returns 3
    return Math.log(y) / Math.log(x);
}

///

function start_intervals() {
    clearInterval(window.block_interval);
    clearInterval(window.canvas_interval);

    let fps = get_fps();

    window.block_interval = setInterval(function() {
        update_blocks();
    }, (1*1000)/fps);
    
    window.canvas_interval = setInterval(function() {
        update_cps();
        update_canvas();
        if (get_option('stereogram-enabled') != false) update_stereogram();
    }, (1*1000)/fps);
}

function get_fps() {
    let fps = get_option('fps');
    if (fps === undefined) fps = DEFAULT_FPS;
    return fps;
}

function set_fps(fps) {
    set_option('fps', fps);
    $('#fps').text(fps);
    start_intervals();
}
set_fps(get_fps());

function inc_fps() {
    let fps = get_fps();
    fps = fps + 1;
    set_fps(fps);
}

function dec_fps() {
    let fps = get_fps();
    fps = fps - 1;
    set_fps(fps);
}

function set_option(option, value) {
    let storage = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (storage == null) storage = {};
    storage[option] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

function get_option(option) {
    try {
        let storage = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return storage[option];
    } catch(e) {
        return undefined;
    }
}

function toggle_options() {
    let more = 'Show more options...';
    let less = 'Show less options...';
    if ($('#options-link').text() == more) {
        $('#options-link').text(less);
        $('#options-arrow').html('<i class="fas fa-chevron-down"></i>')
        $('.additional-option').css('display', 'table-row');
    } else {
        $('#options-link').text(more);
        $('#options-arrow').html('<i class="fas fa-chevron-right"></i>')
        $('.additional-option').css('display', 'none');
    }
}

function toggle_info() {
    let more = 'What am I looking at?';
    let less = 'Hide additional info';
    if ($('#info-link').text() == more) {
        $('#info-link').text(less);
        $('.info-option').css('display', 'table-row');
    } else {
        $('#info-link').text(more);
        $('.info-option').css('display', 'none');
    }
}

function toggle_stereogram(force=undefined) {
    if ($('#stereogram-check').is(':checked') || force == 'enabled') {
        $('#stereogram-enabled').text('enabled');
        $('#stereogram-check').prop('checked', true);
        set_option('stereogram-enabled', true);
        $('#stereogram').show();
        $('#canvas').hide();
        $('#darkmode-check').removeAttr("disabled");
    } else {
        $('#stereogram-enabled').text('disabled');
        set_option('stereogram-enabled', false);
        $('#stereogram-check').prop('checked', false);
        $('#stereogram').hide();
        $('#canvas').show();
        toggle_darkmode('disabled');
        $('#darkmode-check').attr("disabled", true);
    }
}
if (get_option('stereogram-enabled') != false) toggle_stereogram('enabled');
else toggle_stereogram('disabled');

function toggle_darkmode(force=undefined) {
    if (force != 'enabled' && (!$('#darkmode-check').is(':checked') || force == 'disabled')) {
        $('#darkmode-enabled').text('disabled');
        set_option('darkmode-enabled', false);
        $('a').css('color', '#000000');
        $('#menu').css('color', '#000000');
        $('.box-bg').css('background-color', 'rgba(255, 255, 255, 0.4)');
        $('body').css('color', '#000000');
        $('#nano-mark').attr("src","/images/nano-mark-dark.png");
        $('#darkmode-check').prop('checked', false);
    } else {
        $('#darkmode-enabled').text('enabled');
        set_option('darkmode-enabled', true);
        $('a').css('color', '#ffffff');
        $('#menu').css('color', '#ffffff');
        $('.box-bg').css('background-color', 'rgba(0, 0, 0, 0.4)');
        $('body').css('color', '#ffffff');
        $('#nano-mark').attr("src","/images/nano-mark-light.png");
        $('#darkmode-check').prop('checked', true);
    }
}
if (get_option('darkmode-enabled') != true) toggle_darkmode('disabled');
else toggle_darkmode('enabled');

///

function update_cps() {
    $('#cps').text(''+ get_cps().toFixed(2) + '');
}

function setup_canvas() {
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext("2d");

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

}

function update_canvas() {

    setup_canvas();

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext("2d");

    // Get Array of Nano Blocks sorted by z;
    let blocks = Object.entries(window.BLOCKS);
    blocks.sort(function (a, b) {
        return a[1].z - b[1].z;
    });

    // Show Nano Blocks
    for (let block of blocks) {
        let hash = block[0];
        let coords = block[1];

        let size_multipler = Math.pow(coords.z_step, coords.z);
        let width = ((IMG_MAX_HEIGHT*IMG_WIDTH_MULT) / GROW_STEPS) * size_multipler;
        let height = (IMG_MAX_HEIGHT / GROW_STEPS) * size_multipler;

        // Background mark (white)
        ctx.drawImage(nano_mark_light, coords.x - width/2, coords.y - height/2, width, height);

        // Display mark (black w/ alpha)
        ctx.globalAlpha = (1 / GROW_STEPS) * coords.z;
        ctx.drawImage(nano_mark, coords.x - width/2, coords.y - height/2, width, height);

        ctx.globalAlpha = 1.0;

    }

    // Display CPS value
    let cps = get_cps();
    let size = (canvas.width / 3 < canvas.height / 2 ? canvas.width / 3 : canvas.height / 2);
    ctx.font = 'bold '+ size +'px Montserrat';
    ctx.fillStyle='#000000';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(cps.toFixed(2), canvas.width/2, canvas.height/2);

}

function update_stereogram() {
    let canvas = document.getElementById('canvas');
    let depthMapper = new MagicEye.CanvasDepthMapper(canvas);
    let off_color = [255, 255, 255, 255];
    if (get_option('darkmode-enabled') == true) off_color = [0, 0, 52, 255];
    MagicEye.render({
        el: 'magic-eye',
        depthMapper: depthMapper,
        colors: [
            [74, 144, 226, 255],
            off_color,
        ]
    });
}

function update_blocks() {
    let canvas = document.getElementById('canvas');

    for (let block of Object.entries(window.BLOCKS)) {
        let hash = block[0];
        let coords = block[1];

        if (coords.z >= GROW_STEPS) {
            delete window.BLOCKS[hash];
            continue;
        }

        coords.z += 1;
        coords.x = coords.x + coords.x_dir * Math.pow(coords.x_step, coords.z);
        coords.y = coords.y + coords.y_dir * Math.pow(coords.y_step, coords.z);
    }
}

var done = false;
function handle_new_block(data)
{
    // if (done == true) return;
    done = true;
    let canvas = document.getElementById('canvas');

    let x = getRandomInt(0+canvas.width/4, canvas.width-(canvas.width/4));
    let y = getRandomInt(0+canvas.height/4, canvas.height-(canvas.height/4));
    let x_dir = (x - canvas.width / 2 > 0 ? 1 : -1);
    let y_dir = (y - canvas.height / 2 > 0 ? 1 : -1);
    let slope = Math.abs((y - canvas.height / 2) / (x - canvas.width / 2));
    let x_dist = (canvas.width / 2) + IMG_MAX_HEIGHT*IMG_WIDTH_MULT/2;
    let y_dist = (canvas.height / 2) + IMG_MAX_HEIGHT/2;
    if (slope < 1) y_dist = y_dist * slope;
    else x_dist = x_dist / slope;
    let x_step = Math.pow(x_dist, 1/GROW_STEPS);
    let y_step = Math.pow(y_dist, 1/GROW_STEPS);
    let z_step = Math.pow(IMG_MAX_HEIGHT, 1/GROW_STEPS);

    window.BLOCKS[data.hash] = {
        x: x,
        y: y,
        z: 0,
        x_step: x_step,
        y_step: y_step,
        z_step: z_step,
        x_dir: x_dir,
        y_dir: y_dir
    };
    /* = = = Send = = =
    account: "nano_3ohriafuds5pudyanucjzn46ireff1bii18189ihk7u4xcmq39wxa6u3qac9"
    amount: "100000000000000000000000000000"
    block: "{
        "type": "state",
        "account": "nano_3ohriafuds5pudyanucjzn46ireff1bii18189ihk7u4xcmq39wxa6u3qac9",
        "previous": "18A79AED7E5422E7F9A3FB79FAE956D12721B3C0D483881F24C9A31725770CCA",
        "representative": "nano_3o7uzba8b9e1wqu5ziwpruteyrs3scyqr761x7ke6w1xctohxfh5du75qgaj",
        "balance": "29148261333333333300000000000000",
        "link": "397B1551443C04B8C49C9B761AECEF5F38A664B71D4595053318CACA52C9EDC1",
        "link_as_account": "nano_1gdu4oanah16q54bs8up5dpgyqsrnskdg9c7kn4m888csbbemug3yc3zdmta",
        "signature": "A7EA175448754EC56CA9D944B40ED51CC4190FB0957BD717665D19EF09243079D98C01A9ED57684B16B8DA8DC5882E8E56D1F50BDC394F337D7B159399F29904",
        "work": "864b01bc9a991fd2"
        }"
    hash: "EC9C181F812FE112B9BCE7EA4FBEA6A56008BFE778222BE7B4F889B2D92C9614"
    is_send: "true"
    subtype: "send"
    */

    /* = = = Receive = = =
    account: "nano_1gdu4oanah16q54bs8up5dpgyqsrnskdg9c7kn4m888csbbemug3yc3zdmta"
    amount: "100000000000000000000000000000"
    block: "{
        "type": "state",
        "account": "nano_1gdu4oanah16q54bs8up5dpgyqsrnskdg9c7kn4m888csbbemug3yc3zdmta",
        "previous": "E06C6158D8E9DEA4510569A4A4A36D838EE25DDB7E1146B7FD46E60975A284A6",
        "representative": "nano_3o7uzba8b9e1wqu5ziwpruteyrs3scyqr761x7ke6w1xctohxfh5du75qgaj",
        "balance": "109294000000000000000000000000",
        "link": "EC9C181F812FE112B9BCE7EA4FBEA6A56008BFE778222BE7B4F889B2D92C9614",
        "link_as_account": "nano_3u6w51hr4dz34cwusszcbyzcfbd134zygy347hmuby6bpdeks7inrumkcqma",
        "signature": "F2E2975000F4408A92528BB07400FC035BAAA44577DAA3038F196C2768D9C733B30B6A21048F9BBEB7C77857E96A5372E529C113D937B61646B8F554F254780B",
        "work": "33b43475d61091c0"
    }"
    hash: "DB2126797DF5F9E6870BB8F38F07BF9A423BD8623F154F3D4708EC7FC6A6A266"
    subtype: "receive"
    */

    // console.log(data);

    // Update CPS

    
}

