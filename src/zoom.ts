/// <reference path="declarations"/>

import _ = require('underscore');
import d3 = require('d3');
import Infer = require('./infer');

export function configZoom(view: Vega.View, plot: Plot) {
  var model = view['model']();

  var zoom = d3.behavior.zoom()
    // .scaleExtent([0.5,Infinity]);
  zoom['size']([view.width(), view.height()]);

  var onZooms = [];

  function addZoom(scaleName) {
    var scale = model.scene().items[0].scales[scaleName];
    // update() will regenerate the scene from the definition,
    // including the scales in the definition, but we want the
    // scales to be driven by the dynamic zoom behavior.
    var marks = model.defs().marks;
    marks.scales = marks.scales.filter((s: Vega.Scale) => s.name !== scaleName);

    zoom[scaleName](scale);
    onZooms.push(function() {
      // Prevent panning/zooming from bringing us outside our
      // original domain. This works in concert with setting
      // the min scaleExtent to 1.
      var magnification = d3.event.scale;
      var trans = d3.event.translate;

      var dom = scale.domain();
      var delta = scale(dom[1]) - scale(dom[0]);
      var minTrans = delta * (1 - magnification);
      var transIdx = scaleName === 'x' ? 0 : 1;
      // trans[transIdx] = Math.min(0, Math.max(minTrans, trans[transIdx]));
      console.log(scaleName, trans[transIdx]);
      zoom.translate(trans);
    });
  }

  addZoom('x');
  addZoom('y');

  console.log(model.defs().marks.scales);

  zoom.on('zoom', function() {
    _.each(onZooms, function(f) { f(); });
    // update the scene to reflect the zoom
    // console.log(_.object(_.pairs(plot.rtDataSets).map(pair => [pair[0], pair[1].map(d => d.data)])));
    // var domain = view['model']().scene().items[0].scales['x'].domain();
    // var dataPairs = _.pairs(plot.rtDataSets).map(pair => {
    //   var filtered = pair[1]
    //     // TODO: filter elements no longer within the visible domain
    //     // .filter(d => true);
    //   return [pair[0], filtered];
    // });
    // var foo = _.object(dataPairs.map(pair => [pair[0], pair[1].map(d => d.data)]));
    // view.data(foo);
    // var newPlot = _.extend({}, plot, { rtDataSets: _.object(dataPairs) });
    // console.log('newPlot', newPlot);
    // var scale = Infer.inferScale(newPlot, 'y');
    // var newDomain = scale.domain;
    // console.log('newDomain', newDomain);
    // console.log(view['defs']().marks.scales)
    // view['defs']().marks.scales[0].domain = newDomain;
    view.update();
  });

  zoom(d3.select(view['_el']));
}