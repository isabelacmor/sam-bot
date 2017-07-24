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
var HelpMessage = '\n * This is the help message';
var username_key = 'UserName';
var userWelcomed_key = 'UserWelcomed';
var currentFeeling_key = "CurrentFeeling";


// This is a dinner reservation bot that uses multiple dialogs to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    function (session) {
        //session.send("Welcome to the dinner reservation.");
        // is user's name set?
        var userName = session.userData[username_key];
        if (!userName) {
            return session.beginDialog('greet');
        }

        // has the user been welcomed to the conversation?
        if (!session.privateConversationData[userWelcomed_key]) {
            session.privateConversationData[userWelcomed_key] = true;
            session.send('Welcome back %s! Remember the rules: %s', userName, HelpMessage);
        }

        session.beginDialog('askForFeeling');
    },
    function (session, results) {
        session.userData[currentFeeling_key] = results.response;
        session.beginDialog('processFeeling');
    },
    function (session, results) {
        // Process request and do action request by user.
        session.send("You were feeling: %s. You chose: %s",
            session.userData[currentFeeling_key], results.response);
        session.endDialog();
    }
]);

// Greet dialog
bot.dialog('greet', new builder.SimpleDialog(function (session, results) {
    if (results && results.response) {
        session.userData[username_key] = results.response;
        session.privateConversationData[userWelcomed_key] = true;
        return session.endDialog('Welcome %s! %s', results.response, HelpMessage);
    }

    builder.Prompts.text(session, 'Before get started, please tell me your name?');
}));

// Dialog to ask user how they are feeling
bot.dialog('askForFeeling', [
    function (session) {
        builder.Prompts.text(session, "How are you feeling right now?");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

// Dialog to process the user's feelings and offer suggestions
bot.dialog('processFeeling', [
    function (session) {
        var prompt = "I understand you're feeling " + session.userData[currentFeeling_key] + ". Do you want to listen to music?";
        builder.Prompts.text(session, prompt);
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

bot.set('persistConversationData', true);
