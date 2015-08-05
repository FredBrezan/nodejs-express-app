
function initWebSocket() {
    var socket = io(); 
    socket.on('status', function(msg) {
        console.log('socket received', msg)
        $('#msg').html(msg)
    })
    socket.emit('message', "document's websocket ready")
    $('#appctrl-start').click(function(e) { socket.emit('message', 'start') })
    $('#appctrl-stop').click(function(e) { socket.emit('message', 'stop') })
    $('#appctrl-restart').click(function(e) { socket.emit('message', 'restart') })
    $('#appctrl-shutdown').click(function(e) { socket.emit('message', 'shutdown') })
    //$('a').mousedown(function(e) { e.preventDefault() })
}

function initCKEditor() {
    $('#edblk').ckeditor(onCKEditor, {customConfig: '/ckcfg.js'})
}

function init() {
    console.log('document ready!')
    //initEditor()
    initWebSocket()
}

$(document).ready(init)
