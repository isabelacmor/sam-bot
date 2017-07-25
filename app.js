var restify = require('restify');
var builder = require('botbuilder');
var secret = require('./secret.json');

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

// Feelings definitions
var feelingsArray = ["Sad", 'Lonely', 'Anxious'];
var msg = new builder.Message()
  .addAttachment({
      text: '',
      thumbnailUrl: 'http://i.imgur.com/a4RlGrv.png',
      actions: [ { title: 'Sad', message: 'Sad' }]
   })
  .addAttachment({
      text: '',
      thumbnailUrl: 'http://imgur.com/lyF5JK5.png',
      actions: [ { title: 'Lonely', message: 'Lonely' }]
   })
  .addAttachment({
      text: '',
      thumbnailUrl: 'http://imgur.com/caVlZJZ.png',
      actions: [ { title: 'Anxious', message: 'Anxious' }]
  });

// Phrases
var phrases = {
  validating: [
    "Of course you're feeling this way. It must be a difficult situation.",
    "It's okay to feel this way and it means you're human.",
    "I can see how difficult this is for you. No one should have to go through that.",
    "You're not wrong for feeling the way you do and no one blames you for it."
  ],
  prompt: [
    "Do you want to talk about it?",
    "Would you like to talk about it?",
    "Do you want to tell me more about what you're feeling?",
    "Would you like to tell me more?"
  ],
  terminating: [
    "That's okay. I'll be here if you change your mind.",
    "I know this can be difficult to talk about. If you decide to share more with me, I'll be here.",
    "I understand. I'll be here for you when you're ready.",
    "You're not alone in this. I'm here if you need me.",
    "Take your time. No one is rushing you to feel better. I'll be where when you need me."
  ],
  action: [
    "Would you like to watch a cute video to take your mind off things?",
    "Would you like me to play an upbeat song?",
    "Would you like to start a short meditation session?",
    "Going for a walk outside might help you clear your mind for a bit.",
    "Eating a sweet snack will give your brain a good-feeling boost."
  ]
};

// Main bot flow
var bot = new builder.UniversalBot(connector, [
    // Ask for feeling
    function (session) {
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
    },  // Initial validation + prompt response
    function (session, results) {
        session.userData[currentFeeling_key] = results.response.entity.toLowerCase();
        session.send(phrases.validating[getRandomInt(0, phrases.validating.length-1)]);
        session.beginDialog('promptDiscussion');
        // switch (results.response.entity) {
        //     case 'Sad':
        //         session.beginDialog('processFeeling');
        //         break;
        //     case 'Lonely':
        //         session.beginDialog('processFeeling');
        //         break;
        //     case 'Anxious':
        //         session.beginDialog('processFeeling');
        //         break;
        //     default:
        //         session.send('invalid choice');
        //         break;
        //}
        //session.beginDialog('processFeeling');
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
        //builder.Prompts.choice(session, msg, feelingsArray);
        builder.Prompts.choice(session, 'How are you feeling right now?', msg, {listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

// Dialog to ask the user if they want to talk about their feeling
bot.dialog('promptDiscussion', [
    function (session) {
        var prompt = phrases.prompt[getRandomInt(0, phrases.prompt.length-1)];
        builder.Prompts.choice(session, prompt, "yes|no", {listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        session.send(results.response.entity);
        switch (results.response.entity) {
          case 'yes':
            session.beginDialog('doDiscussion');
            break;
          case 'no':
            // Continue to prompt for suggestion
            session.endDialogWithResult(results);
            break;
        }
    }
]);

// Dialog to ask the user to talk more about their feelings
bot.dialog('doDiscussion', [
    function (session) {
        builder.Prompts.text(session, "I'm listening. Go ahead.");
    },
    function (session, results) {
        session.send(phrases.validating[getRandomInt(0, phrases.validating.length-1)]);
        session.beginDialog('promptDiscussion');
    }
]);

bot.set('persistConversationData', true);

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('playMusic', function (session, args, next) {
    var reply = createEvent("playMusic", "", session.message.address);
    session.endDialog(reply);
    //session.endDialog("This would start playing music right away.<br/>For now, say 'next' to continue.");
})
.triggerAction({
    matches: /^play music$/i,
});

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('startMeditation', function (session, args, next) {
    var reply = createEvent("startMeditation", "", session.message.address);
    session.endDialog(reply);
    //session.endDialog("This would start meditation right away.<br/>For now, say 'next' to continue.");
})
.triggerAction({
    matches: /^start meditation$/i,
});

//Bot listening for inbound backchannel events - in this case it only listens for events named "buttonClicked"
bot.on("event", function (event) {
    var handledEvent = false;
    var msg = new builder.Message().address(event.address);
    msg.textLocale("en-us");
    if (event.name === "buttonClicked") {
        msg.text("I see that you just pushed that button");
        handledEvent = true;
    }
    else if (event.name === "webSentiment")
    {
        msg.text("Sam is feeling sad \u1F622 want to look at some happier sites?");
        handledEvent = true;
    }

    if (handledEvent)
    {
        bot.send(msg);
    }
})

// Example for communicating from bot to extension
// session.message.text.split(" ")[1] -> access arguments typed after the triggerAction word
// "changeBackground" -> event name matches the event name in the extensions code
bot.dialog('changeBackground', function (session, args, next) {
  var reply = createEvent("changeBackground", session.message.text.split(" ")[1], session.message.address);
  session.endDialog(reply);
})
.triggerAction({
    matches: /^changebg\s[a-zA-Z]*$/i,
});

// Generic method for creating a backchannel event
const createEvent = (eventName, value, address) => {
    var msg = new builder.Message().address(address);
    msg.data.type = "event";
    msg.data.name = eventName;
    msg.data.value = value;
    return msg;
}
