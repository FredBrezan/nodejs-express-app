function onCKEditor() {
}

function initCKEditor() {
    $('#edblk').ckeditor(onCKEditor, {customConfig: '/ckcfg.js'})
}

function init() {
    console.log('document ready!')
    initEditor();
}
$(document).ready(init)
