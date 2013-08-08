EasyDB
======
EasyDB is a wrapper around IndexedDB.  It provides easier setup of and access to data in an IndexedDB.

Requirements
------------

EasyDB Currently has the following dependencies:

* [jQuery](http://jquery.com/) - Used to provide nicer callbacks via their Deferred interface.
* [Lo-Dash](http://lodash.com/) - Underscore.js should also work.

Pipeline
--------
* Provide version without jQuery and Lo-Dash as dependencies.

How to use - The Basics
-----------------------
EasyDB was designed to be easy and read well.  It uses an [ActiveRecord](http://api.rubyonrails.org/classes/ActiveRecord/Base.html) style interface, so Ruby on Rails developers should be right at home.  Even if you've never encountered ActiveRecord, the syntax is pretty easy to understand.

*Let's get started.*

The first thing you need to do is setup your database.  Configuring your connection and schema is very easy and all the actual configuration work is handled by EasyDB.  Configuration settings are passed into EasyDB when you instantiate it.

````javascript
// See the INTERFACE file for descriptions of these fields
var settings = {
      connection: ['test_database', 1],
      schema: [
        { name: 'test_table' }
      ]
    },
    db = new EasyDB(settings);
````

From here, you'll want to add data into your table.

````javascript
db.open('test_table').insert({
  foo: 5,
  bar: "hello",
  baz: true
});
````

You can then read data out of it.

````javascript
// get is an alias for open, they can be used interchangeably
db.get('test_table').all().then(function(everything) {
  console.log(everything); // [ { foo: 5, bar: "hello", baz: true } ]
});
````

See, easy!  To make things even easier, the same connection can be reused multiple times.  Those last two commands could easily have been written:

````javascripts
var con = db.open('test_table');
con.insert(({
  foo: 5,
  bar: "hello",
  baz: true
});
con.all().then(function(everything) { console.log(everything); });
````

Because of how IndexedDB works, the call to ````insert````  will block the call to ````all```` until it is complete.  In this way, you can be assured that your data is always up-to-date and you won't have to deal with incomplete inserts when reading out data.

In place editing with ````update````
------------------------------------
````update```` is another way to add data to your database.  To really make use of update, you need to add a ````keyPath```` to your table settings.
````javascript
var settings = {
      connection: ['test_database', 1],
      schema: [
        {
          name: 'test_table',
          settings: { keyPath: 'id' }
        }
      ]
    };
````

Once you've added a keyPath, you can use update to modify data added, in place.

````javascript
var con = db.open('test_table');

con.insert({
  id: 1,
  foo: "hi"
});

con.all().then(function(everything) {
  console.log(everything); // [{ id: 1, foo: "hi" }]
});

con.update({
  id: 1,
  bar: "everyone"
});

con.all().then(function(everything) {
  console.log(everything); // [{ id: 1, bar: "everyone" }]
});
````

Reading the important bytes
---------------------------
Grabbing all the data in a table like we've been doing is very inefficient, especially when you only want one or two records.  To combat this, EasyDB provides a few handy accessor methods that give you just what you want.

* ````first()```` - grabs the first record in the table
* ````last()```` - grabs the last record in the table
* ````by(index, value)```` - grabs records with an index of the given value
* ````where(filter)```` - grabs records that match the filter

License
-------
<a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/deed.en_US"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-sa/3.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">EasyDB</span> by <span xmlns:cc="http://creativecommons.org/ns#" property="cc:attributionName">Chris Hall</span> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/deed.en_US">Creative Commons Attribution-ShareAlike 3.0 Unported License</a>.
