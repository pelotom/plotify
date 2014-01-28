/// <reference path="declarations"/>
/// <amd-dependency path='codemirror-yaml'/>
/// <amd-dependency path='js-yaml'/>

import $ = require('jquery');
import _ = require('underscore');
import vg = require('vega');
import CodeMirror = require('codemirror');
import JsYaml = require('js-yaml');
import Geoms = require('./geometries');
import Parse = require('./parse');
import Infer = require('./infer');
import Generate = require('./generate');

var config: Config = {
  geometries: Geoms.defaults
};

var $win = $(window);
var $chart = $('#chart');
var $dummy = $('#dummy-chart');
var $error = $('#error');
var view: Vega.View;

var codeMirror = CodeMirror.fromTextArea(<HTMLTextAreaElement>$('#input')[0], {
  mode:  'yaml',
  theme: 'base16-light',
  indentUnit: 2,
  smartIndent: true,
  indentWithTabs: false,
  lineWrapping: true,
  extraKeys: {
    Tab: function(cm) {
      var spaces = new Array(cm.getOption("indentUnit") + 1).join(" ");
      cm.replaceSelection(spaces, "end", "+input");
    }
  }
});

function setSize() {
  if (view) {
    var ratio = 1/3;
    var w = $win.width();
    var h = $win.height() - 40;
    codeMirror.setSize(ratio*w, h);

    var pad = view.padding();
    var viewWidth = (1-ratio) * w - pad.left - pad.right - 20;
    var viewHeight = h - pad.top - pad.bottom + 10;

    var scales = _.object((<Vega.Scale[]>view['_model']['_defs']['marks']['scales']).map(s => [s.name, s.name]));
    view
      .width(viewWidth)
      .height(viewHeight)
      .update();

    $chart.css({
      'margin-left': ratio*w + 5
    });
  }
}

$win.resize(setSize);

function makeChart(input: string) {
  var plot: Plot;
  try {
    var json = JsYaml.safeLoad(input);
    // console.log('json input', JSON.stringify(json, null, 4));
    plot = Parse.parse(json, config);
  } catch (e) {
    var err: Parse.Error = e;
    $error.text('[' + ['spec'].concat(err.path).join('.') + '] ' + err.message);
    return;
  }
  var result = vg.parse.spec({data: plot.data, marks: []}, chart => {
    try {
      plot.rtDataSets = chart({el:$dummy[0]})['_model']['_data'];
      plot.data.forEach(set => {
        if (set.url)
          set.values = plot.rtDataSets[set.name].map(d => d['data']);
      });
      Infer.infer(plot);
      var spec = Generate.genSpec(plot, config);
      // console.log('generated', JSON.stringify(spec, null, 4));
      vg.parse.spec(spec, chart => {
        $error.text('');
        view = chart({
          el: $chart[0],
          renderer: 'canvas'
        }).update();
        setSize();
      });
    } catch (e) {
      $error.text(e);
    }
  });
}

codeMirror.on('change', editor => {
  makeChart(editor.getDoc().getValue());
});

$.ajax('examples/tutorial.yaml', {dataType:'text'}).done(input => {
  codeMirror.getDoc().setValue(input);
  makeChart(input);
});


