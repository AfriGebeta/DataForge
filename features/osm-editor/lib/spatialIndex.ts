// rbush-backed spatial index over the current graph — map-editor-full-spec.md
// §1.2's "spatial index... supports fast 'what's near this point'
// queries, independent of the undo history." Used purely for snapping
// hit-tests (lib/snapping.ts); rebuilt whenever the graph changes
// (cheap at bbox-loaded sizes — a few thousand nodes/segments at most).

import RBush from "rbush";
import type { BBox } from "rbush";
import type { Graph, NodeEntity, WayEntity } from "./graph";

interface NodeItem extends BBox {
  node: NodeEntity;
}

interface SegmentItem extends BBox {
  way: WayEntity;
  segmentIndex: number;
  a: NodeEntity;
  b: NodeEntity;
}

export class SpatialIndex {
  private nodeTree = new RBush<NodeItem>();
  private segTree = new RBush<SegmentItem>();

  constructor(graph: Graph) {
    const nodeItems: NodeItem[] = graph.visibleNodes().map((node) => ({
      minX: node.lon,
      minY: node.lat,
      maxX: node.lon,
      maxY: node.lat,
      node,
    }));
    this.nodeTree.load(nodeItems);

    const segItems: SegmentItem[] = [];
    for (const way of graph.visibleWays()) {
      const nodes = graph.childNodes(way);
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        segItems.push({
          minX: Math.min(a.lon, b.lon),
          minY: Math.min(a.lat, b.lat),
          maxX: Math.max(a.lon, b.lon),
          maxY: Math.max(a.lat, b.lat),
          way,
          segmentIndex: i,
          a,
          b,
        });
      }
    }
    this.segTree.load(segItems);
  }

  nearbyNodes(lat: number, lon: number, marginDeg: number): NodeEntity[] {
    return this.nodeTree.search({ minX: lon - marginDeg, minY: lat - marginDeg, maxX: lon + marginDeg, maxY: lat + marginDeg }).map((i) => i.node);
  }

  nearbySegments(lat: number, lon: number, marginDeg: number): SegmentItem[] {
    return this.segTree.search({ minX: lon - marginDeg, minY: lat - marginDeg, maxX: lon + marginDeg, maxY: lat + marginDeg });
  }
}
