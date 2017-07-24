var restify = require('restify');
var builder = require('botbuilder');
var secret = require('./secret.json');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: secret.bot.app_id,
    appPassword: secret.bot.app_password
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Local storage
var username_key = 'UserName';
var userWelcomed_key = 'UserWelcomed';

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    //session.send("You said: %s", session.message.text);

    // is user's name set?
    var userName = session.userData[username_key];
    if (!userName) {
        return session.beginDialog('greet');
    }

    // has the user been welcomed to the conversation?
    if (!session.privateConversationData[userWelcomed_key]) {
        session.privateConversationData[userWelcomed_key] = true;
        return session.send('Welcome back %s! Remember the rules: %s', userName, HelpMessage);
    }
});

bot.set('persistConversationData', true);

// reset bot dialog
bot.dialog('reset', function (session) {
    // reset data
    delete session.userData[UserNameKey];
    delete session.conversationData[CityKey];
    delete session.privateConversationData[CityKey];
    delete session.privateConversationData[UserWelcomedKey];
    session.endDialog('Ups... I\'m suffering from a memory loss...');
}).triggerAction({ matches: /^reset/i });

// Greet dialog
bot.dialog('greet', new builder.SimpleDialog(function (session, results) {
    if (results && results.response) {
        session.userData[username_key] = results.response;
        session.privateConversationData[userWelcomed_key] = true;
        return session.endDialog('Welcome %s! %s', results.response, HelpMessage);
    }

    builder.Prompts.text(session, 'Before get started, please tell me your name?');
}));
