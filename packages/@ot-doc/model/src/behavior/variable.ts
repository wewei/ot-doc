declare const symVar: unique symbol;
export type $Var = { [symVar]: typeof symVar };
