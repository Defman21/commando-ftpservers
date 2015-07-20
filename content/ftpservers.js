(function() {
    const log       = require("ko/logging").getLogger("commando-scope-ftpservers")
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
                scope: "scope-ftpservers",
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

    this.onSelectResult = function() {
        var RCS = Cc["@activestate.com/koRemoteConnectionService;1"].getService(Ci.koIRemoteConnectionService);
        log.debug("Invoking Project");
        // Open the first selected item
        var selected = commando.getSelectedResult(),
            server_data = selected.resultData.server_data,
            connection = RCS.getConnection2(server_data.protocol,
                                           server_data.hostname,
                                           server_data.port,
                                           server_data.username,
                                           server_data.password,
                                           server_data.path,
                                           server_data.passive,
                                           server_data.sshkey); // Use getConnection2 because some servers uses ssh private key for auth -> koIRemoteConnection
        log.debug("Connected: " + connection.username + "@" + connection.server);
        
        commando.hideCommando();
    }
    
    this.onExpandSearch = function(query, uuid, callback) {
        var commands = require("./commands");
        commands.onExpandSearch(query, uuid, callback);
    }

}).apply(module.exports);
