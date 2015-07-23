(function() {
    const log       = require("ko/logging").getLogger("commando-scope-remoteservers")
    const {Cc, Ci}  = require("chrome");
    const commando = require("commando/commando");

    log.setLevel(require("ko/logging").LOG_DEBUG);
    
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
                server_data: { // Give server info to onSelectResult
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
                icon: "koicon://ko-svg/chrome/icomoon/skin/database.svg",
                scope: "scope-remoteservers",
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
    }
    
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
        log.debug("Invoking Project");
        // Open the first selected item
        var server_data = commando.getSelectedResult().server_data,
            connection = RCS.getConnection2(server_data.protocol,
                                           server_data.hostname,
                                           server_data.port,
                                           server_data.username,
                                           server_data.password,
                                           server_data.path,
                                           server_data.passive,
                                           server_data.sshkey); // Use getConnection2 because some servers uses ssh private key for auth -> koIRemoteConnection
        var uri = remoteToURI(connection);
        ko.places.manager.openNamedRemoteDirectory(uri);
        commando.hideCommando();
    }
    
    this.onExpandSearch = function(query, uuid, callback) {
        var commands = require("./commands");
        commands.onExpandSearch(query, uuid, callback);
    }

}).apply(module.exports);
