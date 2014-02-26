/// <reference path="declarations"/>

export interface Match {
  <T>(cases: Cases<T>): T;
}

export interface Expr {
  match: Match;
  evaluate: (data: RtDatum[]) => any[];
}

export interface Const {
  val: any;
}

export interface Var {
  field: string;
}

export interface Cases<T> {
  ifConst: (c: Const) => T;
  ifVar: (v: Var) => T;
}

function enhance(match: Match): Expr {
  return {
    match: match,
    evaluate: data => match({
      ifConst: (c:Const) => [c.val],
      ifVar: (v:Var) => {
        var path = v.field.split('.');
        return data.map(d => {
          path.forEach(segment => {
            d = d[segment];
          });
          return d;
        });
      }
    })
  };
}

export function parse(input: any): Expr {
  if (typeof input !== 'string' || input.indexOf('$') !== 0)
    return enhance(cases => cases.ifConst({val: input}));
  else {
    var val: Vega.ValueRef = {};
    if (input.length === 1) // it's just '$' -- use the datum itself
      val.field = 'data';
    else {
      var rest = (<string>input).substring(1);
      if (rest.indexOf('$') === 0) // $$ is used to access derived data
        val.field = rest.substring(1);
      else
        val.field = 'data.' + rest;
    }
    return enhance(cases => cases.ifVar(val));
  }
}
