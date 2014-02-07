
declare var rbush: any;

import _ = require('underscore');
import vg = require('vega');
import d3 = require('d3');

export enum VisTest {
  RANGE_INTERSECTS,
  RANGE_ENCLOSES
}

export function filterVisible(items, node, test?: VisTest) {
  if (!test)
    test = VisTest.RANGE_INTERSECTS;
  var scales = node.group.scales;
  var xr = scales.x.range();
  var yr = scales.y.range();
  var range = new vg['Bounds']().set(d3.min(xr), d3.min(yr), d3.max(xr), d3.max(yr));
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

export function filterOverlaps(items) {
  /* global rbush */
  var tree = rbush(9, ['.bounds.x1', '.bounds.y1', '.bounds.x2', '.bounds.y2']);
  return items.filter(item => {
    var bounds = item.bounds;
    var overlaps = tree.search([bounds.x1, bounds.y1, bounds.x2, bounds.y2]);
    return overlaps.length === 0 && (tree.insert(item), true);
  });
}