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

