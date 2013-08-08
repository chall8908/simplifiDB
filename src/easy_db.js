/**
 * EasyDB is the top level object for interacting with an indexedDB easily.
 * It provides some convenience methods and syntactic sugar for handling
 * connections.
 *
 * Most methods on EasyDB delegate to or create a TransactionWrapper object.
 *
 * @see TransactionWrapper
 *
 * @constructor
 * @params <Object> [settings] overrides to the default settings
 */
function EasyDB(settings) {
  this.settings = settings || this.testSettings;

  // Open a connection to the DB to perform any upgrades
  this.open().openDatabase();
}

EasyDB.prototype.testSettings = {
  connection: ['easy_db', 1],
  schema: [
    {
      name: "sample_table",
      keyPath: "id",
      indexes: [
        ['by_id', 'id', {unique: true}]
      ]
    }
  ]
};

/**
 * Deletes the database represented by this EasyDB object
 */
EasyDB.prototype.delete = function deleteDatabase() {
  indexedDB.deleteDatabase.apply(indexedDB, this.settings.connection);
};

/**
 * Creates a new TransactionWrapper to the given <code>key</code>.
 *
 * @param <String> key  a key in the database
 *
 * @return <TransactionWrapper> a TransactionWrapper open to the given
 *                              <code>key</code>
 */
EasyDB.prototype.open = function open(key) {
  return new TransactionWrapper(key, this.settings);
};

/**
 * Syntactic sugar.  Equivalent to EasyDB.open
 *
 * @see EasyDB.open
 */
EasyDB.prototype.get = EasyDB.prototype.open;

/**
 * Clears all the records stored under <code>key</code>.
 *
 * @param <String> key  a key in the database
 */
EasyDB.prototype.clear = function clear(key) {
  new TransactionWrapper(key, this.settings).clear();
};
