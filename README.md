# Hugh.js

This is a simple actor-like framework for JavaScript.
Instantiate "actors" on a "stage" that can only interact with each other by sending messages.

I wrote this for fun based on my experiences with Elixir's actor model.

## Usage

### Actors
In the actor model, actors store know only their own state.
They cannot interact with each other directly and communicate by passing massages back and forth.

Actors do their work on a stage, so we start by creating one of those.

```javascript
import Stage from 'hughjs';

// Create a stage for our actors
const stage = Stage();
```

Actors consist of three parts: a name, a state, and a handler.
We can register a new actor onto our stage with the `register` method.

But before they do that, let's talk about the handler.

Actors, at their core, perform some action.
This is encapsulated by a single function that receives the following arguments:

- `message` : The message sent into the actor that triggered the action
- `context` : General context to which the actor has access
    - `name` : The name of the actor
    - `state` : The current state of the actor
    - `send` : Callback that allows the actor to send messages to other actors
- `from` : The name of the actor that made this call

The function must return an array of two elements.
The first element is the "result" of the actor's actions and the second is the actor's updated state.
Below, we can just carry through the original value from the context.

```javascript
const actorAction = (message, { state }, from) => {
    console.log(message, state.value);
    return [true, state];
};
```

The state of an actor is a way of having an actor hold on to something that it keeps secret from other actors.

```javascript
const initState = {
    value: "world"
};
```

Now, we register an actor onto the stage.
This will give us back an array of two elements; the name of the registered actor and a function that allows us to send messages.
This is the same function that the actor has in it's `context`, allowing us to send messages into the system from the outside.

```javascript
const [self, send] = stage.register("sampleActor", initState, actorAction);
```

Finally, we can send a message to the actor.
This will send a message to an actor whose name matches the first value, with the second argument as the message.
In this example, we're sending a message to the actor we just created _from_ the actor we just created.
The `send` function always sends messages on behalf of the actor it was created for.

```javascript
send("sampleActor", "Hello!")
```

## Example

So for a complete example, we will create an actor that will increment and decrement a counter and it will store the counter in another actor.


```javascript
// This is all in `readme.js`
import Stage from "./index.js";

const stage = Stage();

const values = {
    INCREMENT: 1,
    DECREMENT: -1
};

const [, send] = stage.register("Counter", values, async (message, { state, send }) => {
    send("Storage", { action: "add", add: state[message] || 0 });
    return [true, state];
});

stage.register("Storage", 0, async ({ action, add }, { state }) => {
    switch (action) {
    case "add":
        return [true, state + add];
    case "peek":
        return [state, state];
    default:
        return [false, state];
    }
});

(async () => {
    await send("Counter", "INCREMENT");
    await send("Counter", "INCREMENT");
    await send("Counter", "INCREMENT");
    const result = await send("Storage", { action: "peek" });
    console.log("This should be 3 ::", result);
})();
```

# Resources
- https://en.wikipedia.org/wiki/Actor_model

# Roadmap
- Usage documentation
- Real world examples
