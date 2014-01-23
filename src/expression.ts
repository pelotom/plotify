/// <reference path="declarations"/>

export enum Type {
  constant,
  variable
}

export interface Expr {
  type: Type;
  vals: any[]; // the values this expression can take (one element in the case of constants)
}

export interface Const extends Expr {}

export interface Var extends Expr {
  data: string; // data source name
  path: string[]; // the paths within the data object
}

export function match<T>(expr: Expr, ifConst: (c: Const) => T, ifVar: (v: Var) => T): T {
  if (expr.type === Type.constant)
    return ifConst(expr);
  else
    return ifVar(<Var>expr);
}

export function parse(dataSet: Vega.Data[], input: any): Expr {
  if (typeof input !== 'string' || input.indexOf('$') !== 0) {
    return {
      type: Type.constant,
      vals: [input]
    };
  } else {
    var s = (<string>input).substring(1);
    var firstDot = s.indexOf('.');
    if (firstDot < 0)
      throw 'Invalidly formatted data accessor: ' + input + ' (should have the form $<dataset>.<path.to.values>)';
    var dataName = s.substring(0, firstDot);
    var path = s.substring(firstDot+1).split('.');
  }
}