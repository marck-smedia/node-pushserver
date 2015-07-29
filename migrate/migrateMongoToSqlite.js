'use strict';

var config = require('./config.json');
var mongoose = require('./lib/PushAssociationMongo')(config.mongodbUrl);
var sqlite = require('./lib/PushAssociationsSqlite')(config.sqliteFile);

mongoose.getAll(function (error, items) {
  if (!error) {
    var i = items.length;
    items.forEach(function (item) {
      sqlite.add(item.user, item.type, item.token, function (error) {
        i--;
        if (error) {
          console.error('Error while copying ' + JSON.stringify(item));
        } else {
          console.log('Item ' + JSON.stringify(item) + ' copied.');
        }
        if(i === 0){
          console.log('Migration complete in file: ' + config.sqliteFile);
          process.exit();
        }
      });
    });
  } else {
    console.error(error);
  }
});
