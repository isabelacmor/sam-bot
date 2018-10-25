# sam-bot
Developed during Microsoft's OneWeek Hackathon 2017.

## Tech Overview
The main front end of the chat bot is a Microsoft Edge extension (https://docs.microsoft.com/en-us/microsoft-edge/extensions).  When users click the extension button, they're greeted with a chat bot that knows who they are, what they like, and what they talked about last time. Users can chat with Sam to talk about their day and how they're feeling. Sam also analyzes sentiment based on what the user is reading in their browser and prompts a conversation if the tone seems negative. Sam can intercept these negative feelings and provide a listening ear, distraction (such as playing music or starting a meditation session), or reach out to the user's trusted friend to help the user engage in some human interaction.

The bot itself uses the Microsoft Bot Framework (https://docs.microsoft.com/en-us/bot-framework/). It is hosted on Azure and communicates with the extension via the Direct Line API. Microsoft Cognitive Services is used for the sentiment analysis and Twilio is used for texting trusted friends. Since the Bot Framework supports many more endpoints, a future goal is to open up other channels of communication, such as Facebook Messenger, Microsoft Teams, an original website, and more. 

## Story
We all have bad days when we feel overwhelmed, anxious or sad. 
These feelings can strike at any time without warning, so you need someone who will always be there for you.

Meet Sam. Sam is your virtual emotional support. Sam will always be here to listen and comfort you, so you'll never feel alone.

Sam helps you catch those bad feelings early when they first start and can help break the cycle of stress, anxiety and depression.

You can tell Sam how you're feeling or rely on Sam to organically detect what you might be feeling. 
Sam suggests things you can do to feel better right away like meditation, listening to music or taking a walk outside.

If that doesn't help, and what you really need is someone you trust to talk to, Sam can connect you with your trusted network of friends for support. All you need to do is hit a button and Sam will text your friends to let them know you need some love.

Happiness is within reach for all of us, with a little bit of help from Sam and your friends.

We all need somebody to lean on. #leanonSam 