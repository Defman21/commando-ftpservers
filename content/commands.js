(function(){
    const log      = require("ko/logging").getLogger("commando-scope-ftpservers-expand");
    const commando = require("commando/commando");
    
    log.setLevel(require("ko/logging").LOG_DEBUG);
    
    var entries = [
        {
            id: "getServerInfo",
            name: "Get Server Info",
            tip: "Get server info: username, hostname and password or ssh key path",
            scope: "scope-ftpservers",
            command: doGetServerInfo,
            weight: 1000,
            allowExpand: false
        }
    ];
    
    var getResults = function (query) {
        
        var cache = entries; // Make copy of entries for filtering
        query = query.toLowerCase();
        var words = query.split(" ");
        
        words.filter(function(w) !!w);
        
        if (words) {
            cache = cache.filter(function(entry) {
                var text = (entry.description + entry.name).toLowerCase();
                if (words.every(function(w) text.indexOf(w) != -1)) {
                    return true;
                }
                return false;
            });
        }
        
        return cache;
    }
    
    this.onExpandSearch = function (query, uuid, callback) {
        commando.renderResults(commando.filter(getResults(query), query), uuid);
        callback();
    }
    
    function doGetServerInfo () {
        var item = commando.getSubscope(),
            data = item.server_data,
            password = (data.sshkey.length > 0) ? "OpenSSH key: " + data.sshkey : "Password: " + data.password,
            text = "Hostname: " + data.hostname + ", " + "Username: " + data.username + ", " + password,
            use_alert = ko.prefs.getBoolean("commando_ftpservers_use_alert", false);
        if (use_alert)
            commando.alert(text);
        else
            commando.tip(text);
    }
    
}).apply(module.exports);