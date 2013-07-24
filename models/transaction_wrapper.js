/**
 * TransactionWrapper is a wrapper around database transactions.  It contains
 * all methods for interacting with data in the database.
 *
 * @constructor
 *
 * @param <String> key                the key in the database that houses the
 *                                    data
 * @param <Object> connectionSettings the settings used to set up and connect
 *                                    to the database
 */
function TransactionWrapper(key, connectionSettings) {
  this.databaseKey = key;
  this.databaseSettings = connectionSettings;
}

// ============================================================================
//                                  Helpers
// ============================================================================

/**
 * openConnection opens a connection to an IndexedDB
 * the Deferred returned by this function is resolved with the
 * connection object and rejected with the full event
 *
 * @return {Deferred} a deferred object that gets rejected/resolved
 *                    when the connection either completes, or fails
 */
TransactionWrapper.prototype.openConnection = function openConnection() {
  var dbCon = indexedDB.open.apply(indexedDB, this.databaseSettings),
      def = new $.Deferred(),
      schema = this.databaseSettings.schema;

  dbCon.onupgradeneeded = function handleUpgrade(e) {
    var db = e.target.result;

    // loop through the tables outlined in the database schema (see config/database.js)
    $.each(schema, function(i, table) {
      var os;
      try { db.deleteObjectStore(table.name); } // delete the object store if it exists
      catch(e) {}                               // this shit is pretty ugly...

      os = db.createObjectStore(table.name, table.settings);

      _.each(table.indexes, function(index) {
        os.createIndex.apply(os, index);
      });
    });
  };

  dbCon.onsuccess = function(e) {
    def.resolve(e.target.result);
  };

  dbCon.onerror = this.handleError(def);

  return def;
};

/**
 * handleError handles errors produced by IndexedDB connections/transactions
 * It can be passed either a jQuery Deferred or an event object produced by
 * an error event within a transaction.
 *
 * @param <Deferred|Event> arg the argument to act on
 *
 * @return <Function|undefined> if the provided argument is a Deferred, a
 *                              function is returned to handle errors and
 *                              reject the given deferred.  Otherwise, it
 *                              just handles the error, returning nothing.
 */
TransactionWrapper.prototype.handleError = function handleError(arg) {
  if(arg.resolve && arg.reject) { // looks like a deferred
    var tw = this;
    return function handleErrorWithDeferred(e) {
      tw.handleError(e);
      arg.reject(e);
    };
  }

  console.error(e);
};

/**
 * getObjectStore abstracts the logic that opens a database transaction
 *
 * @param <IDBConnection> db    the connection to the database
 * @param <String>        type  the type of connection to open.  Defaults to
 *                              "readonly".
 *
 * @return <IDBObjectStore> the ObjectStore that represents the key
 *                          passed to this TransactionWrapper
 */
TransactionWrapper.prototype.getObjectStore = function getObjectStore(db, type) {
  var key = this.databaseKey,
      trans = db.transaction(key, (type || "readonly"));

  return trans.objectStore(key);
};

// ============================================================================
//                                Getters
// ============================================================================

/**
 * All returns all records stored under the key given to this TransactionWrapper
 *
 * @return <Array> all records
 */
TransactionWrapper.prototype.all = function getAllItems() {
  var def = new $.Deferred(),
      tw = this;

  tw.openConnection().then(function(db) {
    var data = [],
        os = tw.getObjectStore(db),
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

    req.onerror = tw.handleError(def);

  });

  return def;
};

/**
 * By returns all records that have an <code>index</code> of <code>value</code>
 *
 * @param <String> index  the index to search by
 * @param <String> value  the value to match against
 *
 * @return <Array> the records with an <code>index</code> of <code>value</code>
 */
TransactionWrapper.prototype.by = function getBy(index, value) {
  var def = new $.Deferred(),
      tw = this;

  tw.openConnection().then(function(db) {
    var data = [],
        os = tw.getObjectStore(db),
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

    req.onerror = tw.handleError(def);
  });

  return def;
};

/**
 * INCOMPLETE
 * Returns up to <code>number</code> records, starting from <code>offset</code>
 * (Default 0), in <code>order</code> (Default DESC).
 *
 * @param <Number> number   the number of records to return
 * @param <Number> [offset] the offset from the begining of the list
 * @param <String> [order]  the order to search by
 *
 * @return <Array> up to <code>number</code> records.
 */
TransactionWrapper.prototype.limit = function limit(number, offset, order) {
  var def = new $.Deferred();

  return def;
};

/**
 * INCOMPLETE
 * Returns all records that match the <code>filter</code>.
 *
 * @param <Object> filter the parameters to filter by
 *
 * @return <Array> all records that match the <code>filter</code>
 */
TransactionWrapper.prototype.where = function where(filter) {
  var def = new $.Deferred();

  return def;
};

// ============================================================================
//                                  Setters
// ============================================================================

/**
 * Inserts or updates a record.  If <code>overwrite</code> is falsey, this
 * method will fail to insert a record if it already exists in the database.
 *
 * @param           data      the data to update or insert into the database
 * @param <Boolean> overwrite whether overwriting should be allowed
 */
TransactionWrapper.prototype.insert = function insert(data, overwrite) {
  var tw = this;

  if(!(data instanceof Array)) {
    data = [data];
  }

  tw.openConnection().then(function(db) {
    try {
      var store = tw.getObjectStore(db, "readwrite");

      _.each(data, function(d) {
          var req = overwrite ? store.put(d) : store.add(d);
          req.onerror = tw.handleError;
      });
    } catch(e) {
      console.error(e);
      console.log("Key used: "+key);
      console.log("Data not stored: \n" + JSON.stringify(data, null, 2));
      console.trace();
    }
  });
};

/**
 * Convenience method.  Equivalent to <code>TransactionWrapper.insert(data, true)</code>.
 *
 * @see TransactionWrapper#insert
 */
TransactionWrapper.prototype.update = function update(data) {
  this.insert(data, true);
};

/**
 * Removes all records from the key given to this TransactionWrapper.
 */
TransactionWrapper.prototype.clear = function clear() {
  var tw = this;

  tw.openConnection().then(function(db) {
    var store = tw.getObjectStore(db, "readwrite");

    store.clear();
  });
};
