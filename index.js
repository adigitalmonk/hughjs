export default () => {
    const actors = {};

    const sendFactory = (from) => async (target, message) => {
        const actor = actors[target];
        if (!actor) {
            return false;
        }

        return actor(message, from);
    };

    const actorFactory = (name, init_state, send, handler) => {
        const context = {
            name: name,
            state: init_state,
            send: send
        };

        return async (message, from) => {
            const [response, new_state] = 
                await handler(message, context, from);

            context.state = new_state;
            return response;
        };
    };

    const register = (name, init_state, handler) => {
        if (actors[name]) {
            return false;
        }
        const send = sendFactory(name);
        actors[name] = actorFactory(name, init_state, send, handler);
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
