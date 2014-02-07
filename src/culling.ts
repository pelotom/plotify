
declare var rbush: any;

import _ = require('underscore');
import vg = require('vega');

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
  var range = new vg['Bounds']().set(xr[0], yr[0], xr[xr.length - 1], yr[yr.length - 1]);
  return items.filter(item => {
    switch (test) {
      case VisTest.RANGE_INTERSECTS:
        return range.intersects(item.bounds);
      case VisTest.RANGE_ENCLOSES:
        return range.encloses(item.bounds);
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