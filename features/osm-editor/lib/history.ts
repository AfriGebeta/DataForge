// Undo/redo over Graph snapshots — map-editor-full-spec.md §1.2/§C12.
//
// Every *committed* edit pushes one new graph onto the stack (not every
// intermediate drag frame — callers only call `commit` once an
// operation finishes). Undo/redo is pure pointer movement + re-render,
// no per-action undo logic. Making a new edit after undoing discards
// the redo branch beyond the pointer (linear history, not branching).

import type { Graph } from "./graph";

export class History {
  private constructor(
    private readonly stack: Graph[],
    private readonly pointer: number,
  ) {}

  static init(base: Graph): History {
    return new History([base], 0);
  }

  get current(): Graph {
    return this.stack[this.pointer];
  }

  get canUndo(): boolean {
    return this.pointer > 0;
  }

  get canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  commit(graph: Graph): History {
    const truncated = this.stack.slice(0, this.pointer + 1);
    return new History([...truncated, graph], truncated.length);
  }

  undo(): History {
    if (!this.canUndo) return this;
    return new History(this.stack, this.pointer - 1);
  }

  redo(): History {
    if (!this.canRedo) return this;
    return new History(this.stack, this.pointer + 1);
  }

  // Used after a successful save: replaces the whole stack with a
  // single entry so undo can't reach across a save boundary back into
  // graphs full of now-stale negative placeholder ids.
  resetTo(graph: Graph): History {
    return new History([graph], 0);
  }
}
