export default () => {
    const actors = [];

    const sendFactory = (from) => async (target, message) => {
        const actor = actors[target];
        if (!actor) {
            return false;
        }

        const [response, new_state] = await actor.handler(message, actor.state, from, actor.send);
        actors[target].state = new_state;
        return response;
    };

    const register = (name, init_state, handler) => {
        if (actors[name]) {
            return false;
        }

        const send = sendFactory(name);
        actors[name] = {
            name: name,
            state: init_state,
            send: send,
            handler: handler
        };

        return [ name,  send ];
    };

    const shutdown = (name) => {
        delete actors[name];
    };

    return {
        register,
        shutdown
    };
};
