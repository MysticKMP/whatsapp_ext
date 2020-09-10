
///////////////////////
//	For read messages and reply
//////////////////////

(function(document) {   
    var selector = {
        chats_unread:        "span > div > span[class]:not([class='']):not(:empty)",

        chat_title:          "span[title]",

        chat_switch:         "span[title='xxx']",

        message:             ".selectable-text",
        message_in:          ".message-in",
        message_out:         ".message-out",
        message_all:         ".message-in, .message-out",
        message_box:         "footer div[contenteditable]",
        message_data:        "[data-pre-plain-text]",
        message_ignore:      "[role='button'], a, img, [data-icon='media-play'], [data-icon='media-gif'], [data-icon='media-download'], [data-icon='media-cancel']",
        message_send_btn:    "footer span[data-icon='send']",

        new_message_info:    ":scope > div > span[class]",

        selected_chat_title: "header span[title]"
    };

    var commandList = {
        hello: "Hey {name}!",
        abc:  "Hey {name}"
    };

    function getCommand( text, obj ) {
        var command, regex, output  = "", prefix = "@";
        
        if ( text.charAt(0) === prefix ) {
            command = commandList[text.slice(1).toLowerCase()];

            if ( command ) {
                for ( data in obj ) {
                    if ( obj.hasOwnProperty(data) ) {
                        regex   = new RegExp(`{${data}}`, "ig");
                        command = command.replace(regex, obj[data]);
                    }
                }

                output = command;
            }
        }

        return output;
    }
    
    function find( name, context, all ) {
        var context = context || document;
        var method  = "querySelector" + (all ? "All" : "");
        return context[method](selector[name]);
    }

    function next( element, findEl, level ) {
        while ( element && (findEl ? element !== findEl : level--) ) element = element.nextSibling;
        return element;
    }

    function parent( element, level ) {
        while ( element && level-- ) element = element.parentNode;
        return element;
    }

    function last( element ) {
        return element[element.length - 1];
    }

    /**
     * Because this function only use around this.
     * Will make it easy to call.
     * Only use for single class from selector.
     */    
    function hasClass( element, $class ) {
        return element.classList.contains(selector[$class].slice(1));
    }

    function fireMouse( element, eventType ) {
        element && element.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
    }

    function fireEvent( element, eventType ) {
        element && element.dispatchEvent(new Event(eventType, { bubbles: true }));
    }

    function objSetter( element, $interface, property, data ) {
        Object.getOwnPropertyDescriptor($interface.prototype, property).set.call(element, data);
    }

    function repeat( fn, delay = 300 ) {
        setTimeout(function() {
            fn() || repeat(fn, delay);
        }, delay);
    }

    function getUnreadChats() {
        var unreads  = [];
        var elements = find("chats_unread", null, true);

        elements.forEach(function( element ) {
            unreads.push({
                chat: parent(element, 6),
                span: element
            });
        });

        return unreads;
    }

    function selectChat( element, done ) {
        if ( !element.chat ) return;

        fireMouse(element.chat, "mousedown");
        
        if ( !done ) return;
        if ( element.span ) element.span.innerHTML = "";

        var titleMain, title = find("chat_title", element.chat).title;
        
        repeat(function() {
            titleMain = find("selected_chat_title").title;
            if ( titleMain === title ) return done(), true;
        });
    }

    function getUnreadMessages() {
        var messages = parent(find("message_all"), 1);
        var unreads  = [];

        if ( messages && !find("message_out", messages.lastElementChild) ) {
            var newMessageInfo = parent(find("new_message_info", messages), 1);

            if ( newMessageInfo || find("message_all", messages, true).length === find("message_in", messages, true).length ) {
                var newMessageStart = next(newMessageInfo, null, 1);
                var lastMessageOut  = last(find("message_out", messages, true));
                var afterMessageOut = next(newMessageStart, lastMessageOut);
                var newMessage      = false;
                var noRepeatMessage = false;

                messages.childNodes.forEach(function( message ) {
                    if ( !newMessageStart || (!newMessage && message === newMessageStart) ) newMessage = true;
                    if ( !afterMessageOut || (!noRepeatMessage && newMessage && message === afterMessageOut) ) noRepeatMessage = true;
                    if ( newMessage && noRepeatMessage && hasClass(message, "message_in") && !find("message_ignore", message) ) unreads.push(message);
                });
            }
        }

        return unreads;
    }

    function replayUnreadMessages() {
        var messages = getUnreadMessages();
        var regName  = /\](.*?)\:/;
        var text, name, command;

        messages.forEach(function( message ) {
            name = find("message_data", message).getAttribute(selector.message_data.slice(1, -1)).match(regName)[1].trim();
            text = find("message", message).innerText.trim();
            command = getCommand(text, { name: name });

            if ( command ) sendMessage(command);
        });
    }

    function sendMessage( message ) {
        var box = find("message_box");
        objSetter(box, Element, "innerHTML", message);
        fireEvent(box, "input");
        var btn = parent(find("message_send_btn"), 1);
        fireMouse(btn, "click");
    }

    function chatSwitch() {
        selectChat({
            chat: parent(find("chat_switch"), 4)
        });
    }

    function startReplayBot() {
        var unreadChats = getUnreadChats();
        var lengthChats = unreadChats.length;
        var i = 0;

        var process = function() {
            selectChat(unreadChats[i], function() {
                replayUnreadMessages(i++);

                if ( i === lengthChats ) {
                    chatSwitch();
                    repeat(startReplayBot);
                } else {
                    repeat(process);
                }
            });
            
            return true;
        };

        if ( lengthChats ) repeat(process);
        else repeat(startReplayBot);
        
        return true;
    }

    repeat(startReplayBot);
})(document);
