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
            (message, { state }, from) => [[message, state, from], "Done"]
        );
        assert.equal(registeredName, whoAmI);

        const testMessage = "Hello!";
        const [message, state, from] = await send(whoAmI, testMessage);
        assert.equal(state, initState);
        assert.equal(from, from);
        assert.equal(testMessage, message);
    });

    describe("stores updated state", async () => {
        const stage = Stage();
        const [, send] = stage.register("Storage", 0, async ({ action, add }, { state }) => {
            switch (action) {
            case "add":
                return [true, state + add];
            case "peek":
                return [state, state];
            default:
                return [false, state];
            }
        });

        // If you don't `await` a `send`, the state on the next one
        // will be the state at the time that you called it not after the previous call
        await send("Storage", { action: "add", add: 1 });
        await send("Storage", { action: "add", add: 1 });
        assert.equal(2, await send("Storage", { action: "peek" }));
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
            async ({ target, content }, { send, state }) => {
                const response = await send(target, content);
                return [response, state];
            }
        );
        
        stage.register(actorB, {}, (message, { state }, from) => {
            return [{ from, message }, state];
        });

        const testMessage = "UnitTesting";

        const { from, message } = await sendFromA(actorA, { 
            target: actorB,
            content: testMessage
        });

        assert.equal(actorA, from);
        assert.equal(testMessage, message);
    });
});
