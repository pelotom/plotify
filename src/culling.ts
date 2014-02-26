
declare var rbush: any;

import _ = require('underscore');
import vg = require('./vega-patch');
import d3 = require('d3');

export enum VisTest {
  RANGE_INTERSECTS,
  RANGE_ENCLOSES
}

function rangeExtent(scale): number[] {
  return scale.type === 'ordinal' ? [-Infinity, Infinity] : d3.extent<number, number>(scale.range());
}

export function filterVisible(items, node, test?: VisTest) {
  if (!test)
    test = VisTest.RANGE_INTERSECTS;
  var scales = node.group.scales;
  var xr = rangeExtent(scales.x);
  var yr = rangeExtent(scales.y);
  var range = new vg.Bounds().set(xr[0], yr[0], xr[1], yr[1]);
  return items.filter(item => {
    var bounds = item.bounds;
    switch (test) {
      case VisTest.RANGE_INTERSECTS:
        return range.intersects(bounds);
      case VisTest.RANGE_ENCLOSES:
        return range.encloses(bounds);
    }
  });
}

export function filterOverlaps(items: Vega.Node[]) {
  /* global rbush */
  var tree = rbush(9, ['.bounds.x1', '.bounds.y1', '.bounds.x2', '.bounds.y2']);
  return items.filter(item => {
    var bounds = item.bounds;
    var overlaps = tree.search([bounds.x1, bounds.y1, bounds.x2, bounds.y2]);
    return overlaps.length === 0 && (tree.insert(item), true);
  });
}