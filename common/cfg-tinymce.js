function initEditor() {
    tinymce.init({
    
        // General
        selector: "#edblk",
        theme: "modern",
        inline: true, 
        plugins: "visualblocks",
        
        // menu, toolbar, statusbar
        fixed_toolbar_container: "#edtoolbar",
        statusbar: true,
        resize: false,
        
        // visualblocks plugin
        visualblocks_default_state: false,
    });
}

