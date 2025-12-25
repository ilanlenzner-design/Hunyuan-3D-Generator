/**
 * Minimal CSInterface for CEP Extensions
 */
var CSInterface = function() {};

CSInterface.prototype.hostEnvironment = window.__adobe_cep__ ? JSON.parse(window.__adobe_cep__.getHostEnvironment()) : null;

CSInterface.prototype.evalScript = function(script, callback) {
    if(callback === undefined || callback === null) {
        callback = function(result) {};
    }
    window.__adobe_cep__.evalScript(script, callback);
};

CSInterface.prototype.getSystemPath = function(pathType) {
    var path = window.__adobe_cep__.getSystemPath(pathType);
    var OSVersion = this.getOSInformation();
    if (OSVersion.indexOf("Windows") >= 0) {
        path = path.replace("file:///", "");
    } else if (OSVersion.indexOf("Mac") >= 0) {
        path = path.replace("file://", "");
    }
    return decodeURIComponent(path);
};

CSInterface.prototype.getOSInformation = function() {
    var userAgent = navigator.userAgent;
    if ((navigator.platform == "Win32") || (navigator.platform == "Windows")) {
        return "Windows";
    } else if ((navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") 
        || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel")) {
        return "Mac";
    }
    return "Unknown Output System";
};

CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    return window.__adobe_cep__.openURLInDefaultBrowser(url);
};

SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};
