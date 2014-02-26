/// <reference path="declarations"/>

import _ = require('underscore');
import U = require('./util');

function genScales(plot: Plot, scaleName: string): Vega.Scale[] {
  var scale: Scale = plot.scales[scaleName];
  var result: Vega.Scale = {
    name: scaleName
  };
  var type = scale.type;
  var vegaScale: Vega.Scale = {
    name: scaleName,
    type: type,
    domain: scale.domain,
    range: scale.range
  };

  if ('nice' in scale)
    vegaScale.nice = scale.nice;

  // vegaScale.zero = false;

  var results = [vegaScale];
  if ((scaleName === 'x' || scaleName === 'y') && type === 'ordinal') {
    results.push(_.extend({}, vegaScale, {
      name: scaleName + '-bands',
      points: false
    }));
    vegaScale.points = true;
    vegaScale.padding = 1.65;
  }
  return results;
}

function genAxes(scales: Vega.Scale[]) {
  return scales.filter(s => {
    switch (s.name) {
    case 'x':
    case 'y':
      return true;
    default:
      return false;
    }
  }).map(s => {
    var axis: Vega.Axis = {
      type: s.name,
      scale: s.name,
      grid: s.type !== 'ordinal',
      layer: 'front',
      properties: {
        grid: {
          stroke: { value: 'black' },
          strokeOpacity: { value: 0.1 }
        }
      }
    };
    return axis;
  });
}

export function genSpec(plot: Plot, config: Config): Vega.Spec {
  var scales = _.flatten(_.keys(plot.scales).map(scaleName => genScales(plot, scaleName)));

  return {
    data: plot.data.map(set => _.clone(set)),
    scales: scales,
    axes: genAxes(scales),
    // legends: [
    //   {
    //     title: 'foo',
    //     fill: 'fill',
    //     stroke: 'fill',
    //     offset: 50
    //   }
    // ],
    marks: plot.layers.map(layer => {
      var args: Geometry.GenerateArgs = {
        data: plot.rtDataSets[layer.from.data],
        mapping: _.extend({}, plot.mapping, layer.mapping),
        isCategorical: attr => {
          var scale = _.find(scales, scale => {
            return scale.name === attr;
          });
          return scale && scale.type === 'ordinal';
        }
      };
      var mark: Vega.Mark = config.geometries[layer.type].generate(args);
      mark.from = layer.from;
      return mark;
    })
  };
}