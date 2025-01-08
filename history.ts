import { createStore } from "@xstate/store";

interface IStack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  size(): number;
}

class historyStack<T> implements IStack<T> {
  private storage: T[] = [];
  push(item: T): void {
    this.storage.push(item);
  }

  pop(): T | undefined {
    return this.storage.pop();
  }

  peek(): T | undefined {
    return this.storage[this.size() - 1];
  }

  size(): number {
    return this.storage.length;
  }
}

type Event = {
  "increment": null,
  "decrement": null,
  "redo": null,
  "undo": null,
}

type Context ={
  count: number,
  history: historyStack<{
    count: number,
    event: keyof Event
  }>
}

const store = createStore({
  types: {
    emitted: {} as { type: "new action", count: number,event: keyof Event }
  },
  context: {
    count: 0,
    history: new historyStack()  
  } as Context,
  on: {
    increment: ({count}, _, {emit}) => {
      emit({
        type: "new action",
        count,
        event: "increment"
      })
      return {
        count: count+1
      }
    },
    decrement: ({count}, _, {emit}) => {
      emit({
        type: "new action",
        count,
        event: "decrement"
      })
      return {
        count: count-1
      }
    },
    redo: ({history}) => {
      const last = history.peek()
      if(last){
        store.send({type:last?.event })
      }
      return {}
    },
    undo: ({history}) => {
      const last = history.pop()
      if(last) {
        return {
          count: last.count
        }
      }
      return {}
    }  
  }
})

store.on("new action", (e) => {
  store.getSnapshot().context.history.push({
    count: e.count,
    event: e.event
  })
})

store.subscribe(({context}) => {
  console.log(context.count)
})
// 0
store.send({type: "increment"})
// 1
store.send({type: "decrement"})
// 0
store.send({type: "increment"})
// 1
store.send({type: "increment"})
// 2
store.send({type: "undo"})
// 1
store.send({type: "decrement"})
// 0
store.send({type: "increment"})
// 1
store.send({type: "increment"})
// 2
store.send({type: "redo"})
// 3
// 2
store.send({type: "undo"})
// 2
store.send({type: "undo"})
// 1
