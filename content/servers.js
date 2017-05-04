(function() {
    const log       = require("ko/logging").getLogger("commando-scope-servers");
    const {Cc, Ci}  = require("chrome");
    const commando  = require("commando/commando");
    const notify    = require("notify/notify");

    log.setLevel(require("ko/logging").LOG_INFO);
    
    this.onSearch = function(query, uuid, onComplete) {
        
        var RCS = Cc["@activestate.com/koRemoteConnectionService;1"].getService(Ci.koIRemoteConnectionService);
            
        
        var server_count = {},
            servers = RCS.getServerInfoList(server_count);
        
        log.debug(uuid + " - Starting Scoped Search");
        
        var results = [];
        
        // Iterate over servers
        for (let x = 0;x < servers.length; x++) {
            var cur = servers[x];
            var description_suffix = (cur.privatekey.length > 0) ? " (ssh key)" : "";
            results.push({
                id: cur.guid,
                name: cur.alias,
                server_data: {
                    "protocol": cur.protocol,
                    "hostname": cur.hostname,
                    "port": cur.port,
                    "username": cur.username,
                    "password": cur.password,
                    "path": cur.path,
                    "passive": cur.passive,
                    "sshkey": cur.privatekey
                },
                description: cur.username + "@" + cur.hostname+description_suffix,
                icon: "koicon://ko-svg/chrome/fontawesome/skin/database.svg?size=14",
                classList: 'small-icon',
                scope: "scope-servers",
                allowMultiSelect: false
            });
        }

        // Split query into words
        query = query.toLowerCase();
        var words = query.split(" ");
        
        // Filter out empty word entries.
        words = words.filter(function(w) !!w);
        if (words) {
            results = results.filter(function(result) {
                var text = (result.description + result.name).toLowerCase();
                if (words.every(function(w) text.indexOf(w) != -1)) {
                    return true;
                }
                return false;
            });
        }

        // Return results to commando
        if (results.length)
            commando.renderResults(results, uuid);

        // Let commando know we're done
        onComplete();
    };
    
    function remoteToURI(remote) {
        var io = Cc["@mozilla.org/network/io-service;1"].
        getService(Ci.nsIIOService);
        var uri = io.newURI("http://foo.tld", null, null);
        uri.scheme = remote.protocol;
        uri.host = remote.server;
        uri.username = remote.username;
        uri.password = remote.password;
        uri.port = remote.port;
        
        return uri.spec;
    }

    this.onSelectResult = function() {
        var RCS = Cc["@activestate.com/koRemoteConnectionService;1"].getService(Ci.koIRemoteConnectionService);
        log.debug("Invoking Server");
        // Open the first selected item
        var server_data = commando.getSelectedResult().server_data;
        setTimeout(() => {
            try {
                var connection = RCS.getConnection2(server_data.protocol,
                                                    server_data.hostname,
                                                    server_data.port,
                                                    server_data.username,
                                                    server_data.password,
                                                    server_data.path,
                                                    server_data.passive,
                                                    server_data.sshkey);
                var uri = remoteToURI(connection);
                ko.places.manager.openNamedRemoteDirectory(uri);
            } catch (e) {
                log.error(`Failed to connect: ${e}`);
                notify.send(`Failed to connect to ${server_data.hostname}! See log file for more info.`, {
                    priority: "error",
                    category: "commando_servers"
                });
            }
        }, 0);
        commando.hide();
    };
    
    this.onExpandSearch = function(query, uuid, callback) {
        var commands = require("./commands");
        commands.onExpandSearch(query, uuid, callback);
    };

}).apply(module.exports);
