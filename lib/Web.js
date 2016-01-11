'use strict';

var config = require('./Config');
var compression = require('compression');
var bodyParser = require('body-parser');
var express = require('express');
var _ = require('lodash');
var pushAssociations = require('./PushAssociations');
var push = require('./PushController');
var logger = config.log4js.getLogger('Web');
var fs = require('fs');

var app = express();

// Middleware
app.use(compression());
app.use(bodyParser.json());

app.use(express.static(__dirname + '/../dist'));

// Helpers
function validateNotification(notif) {
  var valid = true;

  valid = valid && (!!notif.ios || !!notif.android || !!notif.wp);
  // TODO: validate content

  return valid;
}

function sendNotifications(notifs) {
  var areNotificationsValid = _.every(notifs, validateNotification);

  if (!areNotificationsValid) {
    return false;
  }

  notifs.forEach(function(notif) {
    var users = notif.users;
    var androidPayload = notif.android;
    var iosPayload = notif.ios;
    var wpPayload = notif.wp;

    var targets = [];
    if (androidPayload) {
      targets.push('android');
    }
    if (iosPayload) {
      targets.push('ios');
    }
    if (wpPayload) {
      targets.push('wp');
    }

    var deferred;
    if (users) {
      deferred = pushAssociations.getForUsers(users);
    } else {
      deferred = pushAssociations.getAll();
    }

    deferred.then(
      function(pushAssociations) {
        push.send(pushAssociations, androidPayload, iosPayload, wpPayload);
      },
      function(err) {
        logger.error(err);
      }
    );
  });

  return true;
}

app.use(function(err, req, res, next) {
  res.status(500);
  res.render('error', {error: err});
  // To do something with next as it is required?! and jshint is not OK.
  next.toString();
});

app.post('/*', function(req, res, next) {
  if (req.is('application/json')) {
    next();
  } else {
    res.status(406).send();
  }
});

// Main API
app.post('/subscribe', function(req, res) {
  var deviceInfo = req.body;
  push.subscribe(deviceInfo).done(function() {
    res.send();
  }, function() {
    res.status(503).send();
  });
});

app.post('/unsubscribe', function(req, res) {
  var data = req.body;

  var deferred;
  if (data.user && data.token) {
    deferred = push.unsubscribeUserDevice(data.user, data.token);
  } else if (data.user) {
    deferred = push.unsubscribeUser(data.user);
  } else if (data.token) {
    deferred = push.unsubscribeDevice(data.token);
  } else {
    return res.status(503).send();
  }

  deferred.done(function() {
    res.send();
  }, function() {
    res.status(503).send();
  });
});

app.post('/send', function(req, res) {
  var notifs = [req.body];

  var notificationsValid = sendNotifications(notifs);

  res.status(notificationsValid ? 200 : 400).send();
});

app.post('/sendBatch', function(req, res) {
  var notifs = req.body.notifications;

  var notificationsValid = sendNotifications(notifs);

  res.status(notificationsValid ? 200 : 400).send();
});

// Utils API
app.get('/users/:user', function(req, res) {
  pushAssociations.getForUser(req.params.user).then(function(items) {
      res.send({associations: items});
    }, function(err) {
      logger.error(err);
      res.status(503).send();
    }
  );
});

app.get('/users', function(req, res) {
  pushAssociations.getAll()
    .then(function(pushAss) {
      var users = _(pushAss).map('user').unique().value();
      res.send({users: users});
    }, function(err) {
      logger.error(err);
      res.status(503).send();
    }
  );
});

app.get('/usersComplete', function(req, res) {
  pushAssociations.getAll()
    .then(function(users) {
      res.send({users: users});
    }, function(err) {
      logger.error(err);
      res.status(503).send();
    }
  );
});

app.get('/logs', function(req, res) {
  try {
    var logConfig = require(config.get('logConfigFile'));
    var logs = [];
    logConfig.appenders.forEach(function(appender) {
      if (appender.filename) {
        var log = fs.readFileSync(config.get('logPath') + appender.filename, {'encoding': 'UTF-8'});
        logs.push({fileName: appender.filename, log: log});
      }
    });
    res.send({logs: logs});
  } catch (e) {
    logger.error(e);
    res.status(503).send();
  }
});

app.delete('/users/:user', function(req, res) {
  push.unsubscribeUser(req.params.user);
  res.send('ok');
});

exports.start = function() {
  app.listen(config.get('webPort'));
  logger.debug('Listening on port ' + config.get('webPort') + '...');
};
