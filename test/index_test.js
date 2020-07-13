import assert from "assert";
import Stage from "../index.js";

const noop = () => {};

describe("actors : spawn", () => {
    describe("registration gives sender", () => {
        const stage = Stage();
        const self_name = "Alpha";
        const [self, send] = stage.register(self_name);
        assert.equal(self, self_name);
        assert.equal(typeof(send), "function");
    });

    describe("names must be unique", () => {
        const stage = Stage();
        stage.register("alpha");
        assert.equal(stage.register("alpha"), false);
    });

    describe("stages have unique actors", () => {
        const stageA = Stage();
        const stageB = Stage();
        const actorName = "alpha";
        const [, actorASender] = stageA.register(actorName);
        const [, actorBSender] = stageB.register(actorName);
        assert.equal(typeof(actorASender), "function");
        assert.equal(typeof(actorBSender), "function");
    });

    describe("init state is passed to handler", async () => {
        const stage = Stage();
        const initState = "someTestValue";
        const whoAmI = "Mocha";
        
        const [registeredName, send] = stage.register(
            whoAmI,
            initState,
            (message, state, from) => [[message, state, from], "Done"]
        );
        assert.equal(registeredName, whoAmI);

        const testMessage = "Hello!";
        const [message, state, from] = await send(whoAmI, testMessage);
        assert.equal(state, initState);
        assert.equal(from, from);
        assert.equal(testMessage, message);
    });

    describe("shutdown removes actor from stage", async () => {
        const stage = Stage();
        const actorName = "Alpha";
        const [, send] = stage.register(actorName, {}, noop);
        stage.shutdown(actorName);
        assert.equal(await send(actorName), false);
    });

    describe("messages sent between actors", async () => {
        const stage = Stage();
        const actorA = "Alpha";
        const actorB = "Beta";
        const [, sendFromA] = stage.register(
            actorA, 
            {},
            async (message, state, _from, send) => {
                const response = await send(message.target, message.content);
                return [response, state];
            }
        );
        
        stage.register(actorB, {}, (message, state) => {
            return [message, state];
        });

        const testMessage = "UnitTesting";

        const result = await sendFromA(actorA, { 
            target: actorB,
            content: testMessage
        });
        
        assert.equal(testMessage, result);
    });
});
