(function() {
    if (window.ksRunnerInit) return;

    // This line gets patched up by the cloud
    var pxtConfig = {
    "relprefix": "/pxt-ev3/",
    "verprefix": "",
    "workerjs": "/pxt-ev3/worker.js",
    "monacoworkerjs": "/pxt-ev3/monacoworker.js",
    "gifworkerjs": "/pxt-ev3/gifjs/gif.worker.js",
    "serviceworkerjs": "/pxt-ev3/serviceworker.js",
    "typeScriptWorkerJs": "/pxt-ev3/tsworker.js",
    "pxtVersion": "9.3.20",
    "pxtRelId": "localDirRelId",
    "pxtCdnUrl": "/pxt-ev3/",
    "commitCdnUrl": "/pxt-ev3/",
    "blobCdnUrl": "/pxt-ev3/",
    "cdnUrl": "/pxt-ev3/",
    "targetVersion": "0.0.0",
    "targetRelId": "",
    "targetUrl": "",
    "targetId": "ev3",
    "simUrl": "/pxt-ev3/simulator.html",
    "simserviceworkerUrl": "/pxt-ev3/simulatorserviceworker.js",
    "simworkerconfigUrl": "/pxt-ev3/workerConfig.js",
    "partsUrl": "/pxt-ev3/siminstructions.html",
    "runUrl": "/pxt-ev3/run.html",
    "docsUrl": "/pxt-ev3/docs.html",
    "multiUrl": "/pxt-ev3/multi.html",
    "asseteditorUrl": "/pxt-ev3/asseteditor.html",
    "skillmapUrl": "/pxt-ev3/skillmap.html",
    "authcodeUrl": "/pxt-ev3/authcode.html",
    "multiplayerUrl": "/pxt-ev3/multiplayer.html",
    "kioskUrl": "/pxt-ev3/kiosk.html",
    "teachertoolUrl": "/pxt-ev3/teachertool.html",
    "isStatic": true
};

    var scripts = [
        "/pxt-ev3/highlight.js/highlight.pack.js",
        "/pxt-ev3/marked/marked.min.js",
    ]

    if (typeof jQuery == "undefined")
        scripts.unshift("/pxt-ev3/jquery.js")
    if (typeof jQuery == "undefined" || !jQuery.prototype.sidebar)
        scripts.push("/pxt-ev3/semantic.js")
    if (!window.pxtTargetBundle)
        scripts.push("/pxt-ev3/target.js");
    scripts.push("/pxt-ev3/pxtembed.js");

    var pxtCallbacks = []

    window.ksRunnerReady = function(f) {
        if (pxtCallbacks == null) f()
        else pxtCallbacks.push(f)
    }

    window.ksRunnerWhenLoaded = function() {
        pxt.docs.requireHighlightJs = function() { return hljs; }
        pxt.setupWebConfig(pxtConfig || window.pxtWebConfig)
        pxt.runner.setInitCallbacks(pxtCallbacks)
        pxtCallbacks.push(function() {
            pxtCallbacks = null
        })
        pxt.runner.init();
    }

    scripts.forEach(function(src) {
        var script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
    })

} ())
