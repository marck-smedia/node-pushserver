'use strict';

var config = require('./Config'),
  compression = require('compression'),
  bodyParser = require('body-parser'),
  express = require('express'),
  _ = require('lodash'),
  pushAssociations = require('./PushAssociations'),
  push = require('./PushController'),
  logger = config.log4js.getLogger('Web'),
  fs = require('fs');

var app = express();

// Middleware
app.use(compression());
app.use(bodyParser.json());

app.use(express.static(__dirname + '/../dist'));

app.use(function (err, req, res, next) {
  res.status(500);
  res.render('error', {error: err});
});

app.post('/*', function (req, res, next) {
  if (req.is('application/json')) {
    next();
  } else {
    res.status(406).send();
  }
});

// Main API
app.post('/subscribe', function (req, res) {
  var deviceInfo = req.body;
  push.subscribe(deviceInfo).done(function () {
    res.send();
  }, function () {
    res.status(503).send();
  });
});

app.post('/unsubscribe', function (req, res) {
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

  deferred.done(function () {
    res.send();
  }, function () {
    res.status(503).send();
  });
});

app.post('/send', function (req, res) {
  var notifs = [req.body];

  var notificationsValid = sendNotifications(notifs);

  res.status(notificationsValid ? 200 : 400).send();
});

app.post('/sendBatch', function (req, res) {
  var notifs = req.body.notifications;

  var notificationsValid = sendNotifications(notifs);

  res.status(notificationsValid ? 200 : 400).send();
});

// Utils API
app.get('/users/:user', function (req, res) {
  pushAssociations.getForUser(req.params.user).then(function (items) {
      res.send({associations: items});
    }, function (err) {
      logger.error(err);
      res.status(503).send();
    }
  );
});

app.get('/users', function (req, res) {
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

app.get('/usersComplete', function (req, res) {
  pushAssociations.getAll()
    .then(function(users) {
        res.send({users: users});
      }, function(err) {
        logger.error(err);
        res.status(503).send();
      }
    );
});

app.get('/logs', function (req, res) {
  try {
    var logConfig = require(config.get('logConfigFile'));
    var logs = [];
    logConfig.appenders.forEach(function (appender) {
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


app.delete('/users/:user', function (req, res) {
  push.unsubscribeUser(req.params.user);
  res.send('ok');
});


// Helpers
function sendNotifications(notifs) {
  var areNotificationsValid = _.every(notifs, validateNotification);

  if (!areNotificationsValid) return false;

  notifs.forEach(function (notif) {
    var users = notif.users,
      androidPayload = notif.android,
      iosPayload = notif.ios,
      wpPayload = notif.wp;

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
      function(pushAssociations){
        push.send(pushAssociations, androidPayload, iosPayload, wpPayload);
      },
      function(err){
        logger.error(err);
      }
    );
  });

  return true;
}

function validateNotification(notif) {
  var valid = true;

  valid = valid && (!!notif.ios || !!notif.android || !!notif.wp);
  // TODO: validate content

  return valid;
}

exports.start = function () {
  app.listen(config.get('webPort'));
  logger.debug('Listening on port ' + config.get('webPort') + '...');
};
