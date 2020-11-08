## How it Works
>- [bot.js](https://github.com/Miapolis/OasisBot/blob/master/bot.js) is the starting point of the application (commonly index.js or main.js in others)
>- This bot uses a command handler based on this [Advanced Command Handler](https://www.youtube.com/watch?v=lbpUc17InkM) (also a great channel if you want to learn Discord.js)
>- All commands are stored in the [commands folder](https://github.com/Miapolis/OasisBot/tree/master/commands) in their respective subfolder 
>- Commands commonly interact with systems in the root folder such as [add-custom-command.js](https://github.com/Miapolis/OasisBot/blob/master/commands/Custom%20Commands/add-custom-command.js) (in the commands folder) interacting with [custom-commands.js](https://github.com/Miapolis/OasisBot/blob/master/custom-commands.js)
>- Most important constants are stored in [config.json](https://github.com/Miapolis/OasisBot/blob/master/config.json)
>- Database schemas are all in the [schema folder](https://github.com/Miapolis/OasisBot/tree/master/schema)

## Basic Architecture
>- [bot.js](https://github.com/Miapolis/OasisBot/blob/master/bot.js) initializes all services 
>- [load-commands.js](https://github.com/Miapolis/OasisBot/blob/master/commands/load-commands.js) loads in all the commands from the [commands](https://github.com/Miapolis/OasisBot/tree/master/commands) folder (again, there is a great tutorial on [this command handler](https://www.youtube.com/watch?v=lbpUc17InkM))
>- [command-base.js](https://github.com/Miapolis/OasisBot/blob/master/commands/command-base.js) and [custom-commands.js](https://github.com/Miapolis/OasisBot/blob/master/custom-commands.js) are the **two primary listeners that listen to commands**
>- Commands are called and executed as needed 
>- A lot of commands are handled in the command file, but others (such as [add-custom-command.js](https://github.com/Miapolis/OasisBot/blob/master/commands/Custom%20Commands/add-custom-command.js)) call external services to retrieve information
>- Some services such as [polling-system.js](https://github.com/Miapolis/OasisBot/blob/master/Polls/polling-system.js) and [message-pin.js](https://github.com/Miapolis/OasisBot/blob/master/message-pin.js) have an ongoing update loop or their own listener for certain events (these function independently)
