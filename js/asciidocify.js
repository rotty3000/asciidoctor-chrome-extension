(function (document) {

    var autoReloadInterval;
    var AUTO_RELOAD_INTERVAL_TIME = 2000;
    var ENABLE_RENDER_KEY = 'ENABLE_RENDER';

    /**
     * AsciiDocify the content!
     */
    function asciidocify() {
        $.ajax({
            url:location.href,
            cache:false,
            complete:function (data) {
                loadContent(data);
            }
        });
    }

    function loadContent(data) {
        if (isHtmlContentType(data)) {
            return;
        }
        chrome.storage.local.get(ENABLE_RENDER_KEY, function (items) {
            var enabled = items[ENABLE_RENDER_KEY];
            // Extension is enabled
            if (enabled) {
                appendStyles();
                appendHighlightJsScript();
                appendCustomJsScript();
                render(data.responseText);
            }
            startAutoReload();
        });
    }

    function reloadContent(data) {
        chrome.storage.local.get(LIVERELOADJS_DETECTED_KEY, function (items) {
            var liveReloadJsDetected = items[LIVERELOADJS_DETECTED_KEY];
            // LiveReload.js has been detected
            if (!liveReloadJsDetected) {
                var key = 'md5' + location.href;
                chrome.storage.local.get(key, function (items) {
                    var md5sum = items[key];
                    if (md5sum && md5sum == md5(data)) {
                        return;
                    }
                    // Content has changed...
                    chrome.storage.local.get(ENABLE_RENDER_KEY, function (items) {
                        var enabled = items[ENABLE_RENDER_KEY];
                        // Extension is enabled
                        if (enabled) {
                            // Render Asciidoc in html
                            render(data);
                        } else {
                            // Display plain content
                            $(document.body).html('<pre style="word-wrap: break-word; white-space: pre-wrap;">' + $(document.body).text(data).html() + '</pre>');
                        }
                        // Update md5sum
                        var value = {};
                        value[key] = md5(data);
                        chrome.storage.local.set(value);
                    });
                });
            }
        });
    }

    function startAutoReload() {
        clearInterval(autoReloadInterval);
        autoReloadInterval = setInterval(function () {
            $.ajax({
                url:location.href,
                cache:false,
                success:function (data) {
                    reloadContent(data);
                }
            });
        }, AUTO_RELOAD_INTERVAL_TIME);
    }

    /**
     * Is the content type html ?
     * @param data The data
     * @return true if the content type is html, false otherwise
     */
    function isHtmlContentType(data) {
        var contentType = data.getResponseHeader('Content-Type');
        return contentType && (contentType.indexOf('html') > -1);
    }

    asciidocify();

}(document));
