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
import Zoom = require('./zoom');
import Culling = require('./culling');

var config: Config = {
  geometries: Geoms.defaults
};

var $win = $(window);
var $chooser = $('#example-chooser');
var $chart = $('#chart');
var $dummy = $('#dummy-chart');
var $error = $('#error');
var plot: Plot;
var view: Vega.View;

// Load the examples
$.get('examples/specs/').then(html => {
  var $links = $.makeArray($(html).find('tr a'));
  $links.shift(); // remove '..'
  return $links.map(elem => elem.textContent);
}).done((examples: string[]) => {
  examples.forEach(e => {
    $('<option>')
      .attr('value', e)
      .text(e.substring(0, e.lastIndexOf('.')))
      .appendTo($chooser);
  });

  function setExample() {
    $.ajax('examples/specs/' + $chooser.val(), {dataType:'text'}).done(input => {
      codeMirror.getDoc().setValue(input);
      makeChart(input);
    });
  }

  $chooser.change(setExample);

  setExample();
});

// Set up the input editor
var codeMirror = CodeMirror.fromTextArea(<HTMLTextAreaElement>$('#input')[0], {
  mode:  'yaml',
  theme: (() => {
    // get the theme that was loaded in the html
    var href = $('#cm-theme-link').attr('href');
    var theme = href.substring(href.lastIndexOf('/') + 1, href.lastIndexOf('.'));
    return theme;
  })(),
  // lineNumbers: true,
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

// Listen for changes to the input
(function () {
  var tid: number;
  var dfd: JQueryDeferred<void>;
  codeMirror.on('change', editor => {
    if (tid) {
      clearTimeout(tid);
      tid = null;
    }
    if (dfd) {
      dfd.reject();
      dfd = null;
    }
    tid = setTimeout(() => {
      dfd = makeChart(editor.getDoc().getValue()).always(() => {
        tid = null;
        dfd = null;
      });
    }, 500);
  });
})();

export function redraw() {
  var ratio = 1/3;
  var w = $win.width();
  var h = $win.height() - 60;
  codeMirror.setSize(ratio*w, h);

  if (view) {
    var pad = view.padding();
    var viewWidth = (1-ratio) * w - pad.left - pad.right - 20;
    var v: any = view;
    var model = v.model();
    var group = model.scene().items[0];
    var viewHeight = h - pad.top - pad.bottom;

    // Rewrite some aspects of the scale definitions so that updating the
    // view doesn't reset to the initial domain
    var currentScales = group.scales;
    view['defs']().marks.scales.forEach((scale: Vega.Scale) => {
      scale.nice = false;
      scale.zero = false;
      scale.domain = currentScales[scale.name].domain();
    });

    $chart.css({
      'margin-left': ratio*w + 5
    });

    view
      .width(viewWidth)
      .height(viewHeight)
      ;

    model.encode();

    // cull items that shouldn't be rendered
    group.items.forEach(node => {
      var items = node._itemsBackup = node.items;
      var isText = node.marktype === 'text';
      var inRangeTest = isText ? Culling.VisTest.RANGE_ENCLOSES : Culling.VisTest.RANGE_INTERSECTS;
      items = Culling.filterVisible(items, node, inRangeTest);
      if (isText)
        items = Culling.filterOverlaps(items);
      node.items = items;
    });
    
    view.render();

    // restore culled items
    group.items.forEach(node => {
      node.items = node._itemsBackup;
      delete node._itemsBackup;
    });
  }
}

function setSize() {
  redraw();
  if (view)
    Zoom.configZoom(view);
}

// Listen for the user resizing the window
$win.resize(setSize);

// Initialize the layout
setSize();

function makeChart(input: string): JQueryDeferred<void> {
  var deferred = $.Deferred();

  try {
    var json = JsYaml.safeLoad(input);
    var oldPlot = plot;
    plot = Parse.parse(json, config);

    function innerParse() {
      try {
        Infer.infer(plot);
        var spec = Generate.genSpec(plot, config);
        spec.data.forEach(set => {
          if (set.url) {
            delete set.url;
            delete set.format;
            set.values = plot.rtDataSets[set.name].map(d => d['data']);
          }
        });
        vg.parse.spec(spec, chart => {
          if (deferred.state() === 'rejected')
            return;
          deferred.resolve();
          $error.text('');
          view = chart({
            el: $chart[0],
            renderer: 'canvas'
          }).update();
          view.padding().left += 20;
          setSize();
        });
      } catch (e) {
        $error.text(e);
        deferred.fail();
      }
    }

    if (oldPlot && _.isEqual(oldPlot.data, plot.data)) {
      plot.rtDataSets = oldPlot.rtDataSets;
      innerParse();
    } else {
      vg.parse.spec({data: plot.data, marks: []}, chart => {
        if (deferred.state() === 'rejected')
          return;
          plot.rtDataSets = chart({el:$dummy[0]})['_model']['_data'];
          innerParse();
      });
    }
  } catch (e) {
    var err: Parse.Error = e;
    $error.text('[' + ['spec'].concat(err.path).join('.') + '] ' + err.message);
    deferred.fail();
  }

  return deferred;
}
