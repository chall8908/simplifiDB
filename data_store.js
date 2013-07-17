/**
 *
 *
 *
 *
 *
 *
 */
var newStore = new (function() {
      var settings = CONFIG.database;

      function handleUpgrade(e) {
        var db = e.target.result;

        // console.log("upgrading db");

        // loop through the tables outlined in the database schema (see config/database.js)
        _.each(settings.schema, function(table) {
          var os;
          try { db.deleteObjectStore(table.name); } // delete the object store if it exists
          catch(e) {}                               // this shit is pretty ugly...

          os = db.createObjectStore(table.name, table.settings);

          // console.log("created table with name: " + table.name);

          _.each(table.indexes, function(index) {
            os.createIndex.apply(os, index);
          });
        });
      }

      /**
       * handleError handles errors produced by IndexedDB connections/transactions
       * It can be passed either a jQuery Deferred or an event object produced by
       * an error event within a transaction.
       *
       * @param {Deferred|Event} arg the argument to act on
       *
       * @return {Function|undefined} if the provided argument is a Deferred, a
       *                              function is returned to handle errors and
       *                              reject the given deferred.  Otherwise, it
       *                              just handles the error, returning nothing.
       *
       * @See #showAlert
       */
      function handleError(arg) {
        if(arg.resolve && arg.reject) { // looks like a deferred
          return function(e) {
            handleError(e);
            arg.reject(e);
          };
        }

        showAlert('error', e.value);
      }

      /**
       * openConnection opens a connection to an IndexedDB
       * the Deferred returned by this function is resolved with the
       * connection object and rejected with the full event
       *
       * @return {Deferred} a deferred object that gets rejected/resolved
       *                    when the connection either completes, or fails
       */
      function openConnection() {
        var dbCon = indexedDB.open.apply(indexedDB, settings.con),
            def = new $.Deferred();

        dbCon.onupgradeneeded = handleUpgrade;
        dbCon.onsuccess = function(e) {
          // console.log(e);
          def.resolve(e.target.result);
        };
        dbCon.onerror = function(e) {
          console.error(e);
          def.reject(e);
        };

        return def;
      }

      function deleteDatabase() {
        indexedDB.deleteDatabase.apply(indexedDB, settings.con);
      }

      function TransactionWrapper(key) {
        var dbCon = openConnection();

        function getObjectStore(db) {
          var trans = db.transaction(key, "readonly");

          return trans.objectStore(key);
        }

        this.all = function() {
          var def = new $.Deferred();

          dbCon.then(function(db) {
            var data = [],
                os = getObjectStore(db),
                req = store.openCursor();

            req.onsuccess = function(e) {
              var cur = e.target.result;

              if(!cur) {
                def.resolve(data);
                return;
              }

              data.push(cur.value);
              cur.continue();
            };
          });

          return def;
        };

        this.by = function(index, value) {
          var def = new $.Deferred();

          dbCon.then(function(db) {
            var data = [],
                os = getObjectStore(db),
                idx = os.index(index),
                req = idx.get(value);

            req.onsuccess = function(e) {
              var cur = e.target.result;

              if(!cur) {
                def.resolve(data);
                return;
              }

              data.push(cur.value);
              cur.continue();
            };
          });

          return def;
        };

        this.limit = function(number, offset, order) {
          var def = new $.Deferred();

          return def;
        };

        this.where = function(filter) {
          var def = new $.Deferred();

          return def;
        };
      }

      this.get = function(key) {
        return new TransactionWrapper(key);
      };

      this.set = function(key, data) {
        this.rm(key);

        this.insertInto(key, data);
      };

      this.insertInto = function(key, data) {
        if(!_.isArray(data)) {
          data = [data];
        }

        openConnection().then(function(db) {
          try {
            var trans = db.transaction(key, "readwrite"),
                store = trans.objectStore(key);

            _.each(data, function(d) {
                var req = store.put(d);
                req.onerror = handleError;
            });
          } catch(e) {
            console.error(e);
            console.log("Key used: "+key);
            console.log("Data not stored: \n" + JSON.stringify(data, null, 2));
            console.trace();
          }
        });
      };

      this.rm = function(key) {
        openConnection().then(function(db) {
          var trans = db.transaction([key], "readwrite"),
              store = trans.objectStore(key);

          store.clear();
        });
      };

      // window.onbeforeunload = deleteDatabase;
    })();
