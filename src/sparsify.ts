
declare var rbush: any;

import _ = require('underscore');

function sparsify1(items, group) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    for (var j = i + 1; j < items.length; j++) {
      if (item.bounds.intersects(items[j].bounds)) {
        item.text = '';
        break;
      }
    }
  }
}

function sparsify2(items, group) {
  /* global rbush */
  var tree = rbush(9, ['.bounds.x1', '.bounds.y1', '.bounds.x2', '.bounds.y2']);
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var overlaps = tree.search([item.bounds.x1, item.bounds.y1, item.bounds.x2, item.bounds.y2]);
    if (overlaps.length === 0)
      tree.insert(item);
    else
      item.text = '';
  }
}

function sparsify3(items, group) {
  var tree = rbush(9, ['.bounds.x1', '.bounds.y1', '.bounds.x2', '.bounds.y2']);
  tree.load(items);
  var scales = group.scales;
  var xr = scales.x.range();
  var yr = scales.y.range();
  var query = [xr[0], yr[1], xr[1], yr[0]];
  var visible = tree.search(query);
  for (var i = 0; i < visible.length; i++) {
    var item = visible[i];
    tree.remove(item);
    var overlaps = tree.search([item.bounds.x1, item.bounds.y1, item.bounds.x2, item.bounds.y2]);
    if (overlaps.length > 0)
      item.text = '';
  }
}

function sparsify(group) {
  var items = _.flatten(group.items.map(item => item.marktype === 'text' ? item.items : []), true);
  return sparsify2(items, group);
}

export = sparsify;