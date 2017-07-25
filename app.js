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
var HelpMessage = '\n * Play music\n * Start meditation\n * Text a friend';
var username_key = 'UserName';
var userWelcomed_key = 'UserWelcomed';
var currentFeeling_key = "CurrentFeeling";

var feelingsArray = ['Tired', 'Frustrated', 'Sad', 'Anxious'];

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
            session.send('Welcome back %s! Remember you can ask me to do the following at any time: %s', userName, HelpMessage);
        }

        session.beginDialog('askForFeeling');
    },
    function (session, results) {
        session.userData[currentFeeling_key] = results.response.entity.toLowerCase();
        switch (results.response.entity) {
            case 'Tired':
                session.beginDialog('processFeeling');
                break;
            case 'Frustrated':
                session.beginDialog('processFeeling');
                break;
            case 'Sad':
                session.beginDialog('processFeeling');
                break;
            case 'Anxious':
                session.beginDialog('processFeeling');
                break;
            default:
                session.send('invalid choice');
                break;
        }
        //session.beginDialog('processFeeling');
    },
    function (session, results) {
        // Process request and do action request by user.
        session.send("You were feeling: %s. You chose: %s",
            session.userData[currentFeeling_key], results.response);
        session.beginDialog('changebg');
        // session.endDialog();
    },
    function (session, results) {
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
        //builder.Prompts.text(session, "How are you feeling right now?");
        builder.Prompts.choice(session, 'How are you feeling right now?', feelingsArray, {listStyle: builder.ListStyle.button});
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

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('playMusic', function (session, args, next) {
    session.endDialog("This would start playing music right away.<br/>For now, say 'next' to continue.");
})
.triggerAction({
    matches: /^play music$/i,
});

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('startMeditation', function (session, args, next) {
    session.endDialog("This would start meditation right away.<br/>For now, say 'next' to continue.");
})
.triggerAction({
    matches: /^start meditation$/i,
});

//Bot listening for inbound backchannel events - in this case it only listens for events named "buttonClicked"
bot.on("event", function (event) {
    var msg = new builder.Message().address(event.address);
    msg.textLocale("en-us");
    if (event.name === "buttonClicked") {
        msg.text("I see that you just pushed that button");
    }
    bot.send(msg);
})

//Basic root dialog which takes an inputted color and sends a changeBackground event. No NLP, regex, validation here - just grabs input and sends it back as an event.
bot.dialog('changebg', [
    function (session) {
        var reply = createEvent("changeBackground", session.message.text, session.message.address);
        session.endDialog(reply);
    }
]);

//Creates a backchannel event
const createEvent = (eventName, value, address) => {
    var msg = new builder.Message().address(address);
    msg.data.type = "event";
    msg.data.name = eventName;
    msg.data.value = value;
    return msg;
}
