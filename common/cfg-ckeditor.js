CKEDITOR.editorConfig = function(config) {
    config.language = 'en';
    //cfg.uiColor = '#AADC6E';
    config.toolbarLocation = 'top';
    config.toolbarCanCollapse = true;
    config.toolbarStartupExpanded = false;
    
    config.toolbar_Basic = [
        [ 'Source', '-', 'Bold', 'Italic' ]
    ];
    // Load toolbar_Name where Name = Basic.
    config.toolbar = 'Basic';
};