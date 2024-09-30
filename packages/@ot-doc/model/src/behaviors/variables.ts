declare const symVar: unique symbol;
export type $Var = { [symVar]: typeof symVar };

declare const symOp: unique symbol;
export type $OpVar = { [symOp]: typeof symOp };

declare const symAct: unique symbol;
export type $ActVar = { [symAct]: typeof symAct };