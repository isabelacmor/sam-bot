var restify = require('restify');
var builder = require('botbuilder');
var secret = require('./secret.json');
var twilio = require('twilio');

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Setup Twilio
var accountSid = 'AC5c58512b18c1c3f4ee2c0e386bee48f6'; // Your Account SID from www.twilio.com/console
var authToken = 'dc8840fa46616237c602b5386eea45eb';   // Your Auth Token from www.twilio.com/console
var client = new twilio(accountSid, authToken);

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
var HelpMessage = '\n * Play music\n * Play video\n * Start meditation\n * Text a friend';
var username_key = 'UserName';
var userWelcomed_key = 'UserWelcomed';
var currentFeeling_key = "CurrentFeeling";
var currentActivity_key = "CurrentActivity";
var address_key = "AddressKey";
var friend_key = "FriendKey";
var friendnames_key = "FriendNamesKey";
var savedAddress;

// Feelings definitions
var feelingsArray = ["Sad", 'Lonely', 'Anxious'];
var feelingMessage = new builder.Message()
  .text("How are you feeling?")
  .addAttachment({
      text: '',
      thumbnailUrl: 'https://github.com/isabellacmor/sam-bot/blob/master/images/sad.png?raw=true',
      actions: [ { title: 'Sad', message: 'Sad' }]
   })
  .addAttachment({
      text: '',
      thumbnailUrl: 'https://github.com/isabellacmor/sam-bot/blob/master/images/ok.png?raw=true',
      actions: [ { title: 'Lonely', message: 'Lonely' }]
   })
  .addAttachment({
      text: '',
      thumbnailUrl: 'https://github.com/isabellacmor/sam-bot/blob/master/images/depressed.png?raw=true',
      actions: [ { title: 'Anxious', message: 'Anxious' }]
  });

// Phrases
var greeting = "It's great to meet you ";
var aboutSam = "Hi, I'm Sam!";
var tipSam = "I'm the buddy in your browser, looking out for you and making sure you're happy as a clam!\n\nIf you're not feeling your best, you can always come here to chat with me.\n\nI'll also keep an eye on your mood throughout the day and let you know if I think you need a little emotional break.";
var samActions = "You can ask me to 'play music', 'play video', and 'start meditation' at any time if you're not feeling your best.";

var phrases = {
  validating: [
    "Of course you\'re feeling this way. It must be a difficult situation.",
    "It\'s okay to feel this way and it means you\'re human.",
    "I can see how difficult this is for you. No one should have to go through that.",
    "You\'re not wrong for feeling the way you do and no one blames you for it."
  ],
  prompt: [
    "Do you want to talk about it more?",
    "Would you like to talk about it more?",
    "Do you want to tell me more about what you're feeling?",
    "Would you like to tell me more?"
  ],
  terminating: [
    "That\'s okay. I\'ll be here if you change your mind.",
    "I know this can be difficult to talk about. If you decide to share more with me, I\'ll be here.",
    "I understand. I\'ll be here for you when you\'re ready.",
    "You\'re not alone in this. I\'m here if you need me.",
    "Take your time. No one is rushing you to feel better. I\'ll be where when you need me."
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
var bot = new builder.UniversalBot(connector
  , [
  function(session) {
    savedAddress = session.message.address;
    if(session.userData[username_key]) {
      session.beginDialog("askForFeeling");
    } else {
      session.beginDialog("OOBE");
    }
  },  // Initial validation + prompt response
      function (session, results) {
          session.userData[currentFeeling_key] = results.response.entity.toLowerCase();
          session.send(phrases.validating[getRandomInt(0, phrases.validating.length-1)]);
          session.beginDialog('promptDiscussion');
      },
      function (session, results) {
          // Process request and do action request by user.
          session.beginDialog('promptActivity');
      }, function (session, results) {
        session.send(phrases.terminating[getRandomInt(0, phrases.terminating.length-1)]);
        session.endDialog();
      }
]);

// OOBE dialog
bot.dialog('OOBE', [
    function (session) {
      // Welcome message + about Sam
      var card = new builder.AnimationCard(session)
        .title(aboutSam)
        .subtitle(tipSam)
        .image(builder.CardImage.create(session, 'https://github.com/isabellacmor/sam-bot/blob/master/images/allbunnies.png?raw=true'))
        .media([
            { url: 'https://github.com/isabellacmor/sam-bot/blob/master/images/bunny.gif?raw=true' }
        ])
        ;
        // Attach the card to the reply message
        var welcomeMessage = new builder.Message(session).addAttachment(card);
        session.send(welcomeMessage);

        session.sendTyping();
        setTimeout(function(){
          builder.Prompts.text(session, "What's your name?");
        }, 3000);
    },
    function (session, results) {
        session.send("Nice to meet you, %s!", results.response);
        session.userData[username_key] = results.response;
        var reply = createEvent("updateName", session.userData[username_key], session.message.address);
        session.send(reply);

        // Ask to add friends
        session.beginDialog('promptAddFriend');
    }
    , function (session, results) {
        session.beginDialog('askForFeeling');
    }
])
.triggerAction({
    matches: /^test oobe$/i,
});

// Dialog to ask user how they are feeling
bot.dialog('askForFeeling', [
    function (session) {
        builder.Prompts.choice(session, feelingMessage, feelingsArray, {listStyle: builder.ListStyle.button});
        //builder.Prompts.choice(session, 'How are you feeling right now?', feelingsArray, {listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

// Dialog to ask the user if they want to add a friend
bot.dialog('promptAddFriend', [
    function (session) {
      // Timeout to make this a little more human-like
      session.sendTyping();
      setTimeout(function(){
        builder.Prompts.choice(session, "You can ask me to reach out to a friend if you're needing some human attention.  Would you like to add a friend's phone number now?", "yes|no", {listStyle: builder.ListStyle.button});
      }, 3000);
    },
    function (session, results) {
        switch (results.response.entity) {
          case 'yes':
            session.beginDialog('promptAskFriendInfo');
            break;
          case 'no':
            // Continue to prompt for suggested activity
            session.endDialogWithResult(results);
            //session.beginDialog('promptActivity');
            break;
        }
    }
]);

// Dialog to ask the user to talk more about their feelings
bot.dialog('promptAskFriendInfo', [
    function (session) {
        builder.Prompts.text(session, "What's your friend's name?");
    },
    function (session, results) {
        // Save friend's name
        if (session.userData[friend_key] == null){
          session.userData[friend_key] = [];
        }
        if (session.userData[friendnames_key] == null){
          session.userData[friendnames_key] = [];
        }
        session.userData[friend_key].push({"name": results.response, "phone_number": ""});
        session.userData[friendnames_key].push(results.response);
        builder.Prompts.text(session, "What's " + results.response + "'s mobile number?");
    },
    function (session, results) {
        // Save friend's phone number
        var num = results.response.replace(/[^0-9]/g, "");
        session.userData[friend_key][session.userData[friend_key].length-1].phone_number = num;
        session.send("Great! To ask me to reach out to " + session.userData[friend_key][session.userData[friend_key].length-1].name + ", you can say 'Text a friend' at any time.");
        session.endDialogWithResult(results);
    }
])
.triggerAction({
  matches: /^add [a]?[\s]?friend$/i,
});;;

// Dialog to ask the user if they want to talk about their feeling
bot.dialog('promptDiscussion', [
    function (session) {
      // Timeout to make this a little more human-like
      session.sendTyping();
      setTimeout(function(){
        var prompt = phrases.prompt[getRandomInt(0, phrases.prompt.length-1)];
        builder.Prompts.choice(session, prompt, "yes|no", {listStyle: builder.ListStyle.button});
      }, 3000);
    },
    function (session, results) {
        switch (results.response.entity) {
          case 'yes':
            session.beginDialog('doDiscussion');
            break;
          case 'no':
            // Continue to prompt for suggested activity
            session.endDialogWithResult(results);
            //session.beginDialog('promptActivity');
            break;
        }
    }
]);

// Dialog to ask user how they are feeling
bot.dialog('promptActivity', [
    function (session) {
        var chosenActivity = getRandomInt(0, phrases.action.length-1);
        session.userData[currentActivity_key] = chosenActivity;
        // First 3 prompts require a response.
        if(chosenActivity < 3) {
          builder.Prompts.choice(session, phrases.action[chosenActivity], "yes|no", {listStyle: builder.ListStyle.button});
        } else {
          session.endDialog(phrases.action[chosenActivity]);
        }
    },
    function (session, results) {
      if(results.response.entity === 'yes') {
          // Video
          if(session.userData[currentActivity_key] == 0) {
            session.beginDialog('playVideo');
          } else if(session.userData[currentActivity_key] == 1) {
            session.beginDialog('playMusic');
          } else if(session.userData[currentActivity_key] == 2) {
            session.beginDialog('startMeditation');
          }
      } else {
        //session.send(phrases.terminating[getRandomInt(0, phrases.terminating.length-1)]);
        session.endDialogWithResult(results);
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
bot.dialog('playVideo', function (session, args, next) {
    var reply = createEvent("playVideo", "", session.message.address);
    session.endDialog(reply);
})
.triggerAction({
    matches: /^play video$/i,
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

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('help', function (session, args, next) {
    session.endDialog(samActions);
    //session.endDialog("This would start meditation right away.<br/>For now, say 'next' to continue.");
})
.triggerAction({
    matches: /^help$/i,
});

//Bot listening for inbound backchannel events
bot.on("event", function (event) {
    var handledEvent = false;
    savedAddress = event.address;
    var msg = new builder.Message().address(event.address);
    msg.textLocale("en-us");
    if (event.name === "buttonClicked") {
      msg.text("I see that you just pushed that button");
      handledEvent = true;
    }
    else if (event.name === "webSentiment") {
      msg.text("Sam is feeling sad 🙁  Want to look at some happier sites?");
      handledEvent = true;
    } else if(event.name === "startState") {
      if(event.value) {
        bot.beginDialog("askForFeeling");
      } else {
        bot.beginDialog("OOBE");
      }
      handledEvent = false;
    }

    if (handledEvent) {
        bot.send(msg);
    }
});

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

// Util method to clear data before demo
bot.dialog('/delete', function (session) {
  session.userData[username_key] = null;
  session.userData[friend_key] = null;
  session.userData[friendnames_key] = null;
  session.endDialog('User data cleared.')
})
.triggerAction({
  matches: /^delete all$/i,
});

// Dialog to prompt user which friend to text
bot.dialog('promptSendText', [
    function (session) {
      if(session.userData[friendnames_key] && session.userData[friendnames_key].length > 0) {
        builder.Prompts.choice(session, "Who would you like me to reach out to?", session.userData[friendnames_key], {listStyle: builder.ListStyle.button});
      } else {
        session.send("You don't have any friends added.");
        session.beginDialog("promptAddFriend");
      }
    },
    function (session, results) {
      // Send text
      var pn = null;
      for(var i = 0; i < session.userData[friend_key].length; i++) {
        if(session.userData[friend_key][i].name == results.response.entity) {
          pn = session.userData[friend_key][i].phone_number;
          break;
        }
      }

      if(pn){
        var message = "Hey there, it's Sam-Bot! Your friend " + session.userData[username_key] + " could use someone to talk to. Why don't you send them a message when you have some time? 😊";

        client.messages.create({
            body: message,
            to: pn,  // Text this number
            from: '+12062025015' // From a valid Twilio number
        })
        .then((message) => console.log(message.sid));
        session.endDialog("I've reached out to " + results.response.entity + ". They'll reach out to you directly as soon as they can! We care about you 😊");
      }
    }
])
.triggerAction({
  matches: /^text [a]?[\s]?friend$/i,
});
