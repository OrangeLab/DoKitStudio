import { onUnmounted } from "vue";

export function useCommand(inputData, focusData) {
    const state = {
        current: -1,
        queue: [],
        commands: {},
        commandArray: [],
        destroyList: []
    }

    const registry = (command) => {
        state.commandArray.push(command);
        state.commands[command.name] = (...args) => {
            const { redo, undo } = command.execute(...args);
            redo();
            if (!command.pushQueue) {
                return
            }
            let { queue, current } = state
            if (queue.length > 0) {
                queue.slice(0, current + 1);
                state.queue = queue;
            }
            queue.push({ redo, undo })
            state.current = current + 1
        }
    }

    registry({
        name: 'redo',
        execute() {
            return {
                redo() {
                    let item = state.queue[state.current + 1];
                    if (item) {
                        item.redo && item.redo();
                        state.current++;
                    }
                }
            }
        }
    });

    registry({
        name: 'undo',
        execute() {
            return {
                redo() {
                    if (state.current === -1) return;
                    let item = state.queue[state.current];
                    if (item) {
                        item.undo && item.undo();
                        state.current--;
                    }
                }
            }
        }
    });

    registry({
        name: 'paste',
        pushQueue: true,
        execute(newValue) {
            let state = {
                before: inputData.value,
                after: inputData.value ? inputData.value + newValue : newValue
            }
            return {
                redo: () => {
                    inputData.value = state.after
                },
                undo: () => {
                    inputData.value = state.before
                }
            }
        }
    });
    
    registry({
        name: 'input',
        pushQueue: true,
        execute(beforeValue, newValue) {
            let state = {
                before: beforeValue,
                after: newValue
            }
            return {
                redo: () => {
                    inputData.value = state.after
                },
                undo: () => {
                    inputData.value = state.before
                }
            }
        }
    });

    registry({
        name: 'clear',
        pushQueue: true,
        execute() {
            let state = {
                before: inputData.value,
                after: null
            }
            return {
                redo: () => {
                    inputData.value = state.after
                },
                undo: () => {
                    inputData.value = state.before
                }
            }
        }
    });

    registry({
        name: 'format',
        pushQueue: true,
        execute() {
            let state = {
                before: inputData.value,
                after: JSON.stringify(JSON.parse(inputData.value), null, '\t')
            }
            return {
                redo: () => {
                    inputData.value = state.after
                },
                undo: () => {
                    inputData.value = state.before
                }
            }
        }
    });

    registry({
        name: 'load',
        pushQueue: true,
        execute(newValue) {
            let state = {
                before: inputData.value,
                after: newValue
            }
            return {
                redo: () => {
                    inputData.value = state.after
                },
                undo: () => {
                    inputData.value = state.before
                }
            }
        }
    });

    onUnmounted(() => {
        state.destroyList.forEach(fn => fn && fn())
    });

    return state
}