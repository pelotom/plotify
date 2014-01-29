/// <reference path="declarations"/>

import $ = require('jquery');
import _ = require('underscore');
import d3 = require('d3');
import Infer = require('./infer');
import Main = require('./main');

var zoom = d3.behavior.zoom();

export function configZoom(view: Vega.View) {

  var overlay = d3.select('#chart').selectAll('.zoom-overlay').data([1]);
  overlay.enter().append('div')
    .classed('zoom-overlay', true)
    .style('position', 'absolute')
    .style('z-index', 100)
    .each(sel => {
      zoom.on('zoom', Main.redraw);
    })
    ;
  var padding = view.padding();
  overlay.style(<any>{
    top: padding.top + 'px',
    right: (padding.right - 1) + 'px',
    bottom: (padding.bottom + 3) + 'px',
    left: padding.left + 'px'
  });

  zoom['size']([view.width(), view.height()]);

  ['x', 'y'].forEach(scaleName => {
    zoom[scaleName](view['model']().scene().items[0].scales[scaleName]);
  });

  zoom(overlay);
}