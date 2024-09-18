import { $Eq } from "./algebra";
import { $BaseDoc, $FullDoc, $InvDoc } from "./document";

export type Stt$Eq<T extends Record<string, unknown>> = {
  [K in keyof T]: $Eq<T[K]>;
};

export type Stt$BaseDoc<Cp extends Record<string, unknown>, Op extends Record<keyof Cp, unknown>> = {
  [K in keyof Cp]: $BaseDoc<Cp[K], Op[K]>;
};

export type Stt$InvDoc<Cp extends Record<string, unknown>, Op extends Record<keyof Cp, unknown>> = {
  [K in keyof Cp]: $InvDoc<Cp[K], Op[K]>;
};

export type Stt$FullDoc<Cp extends Record<string, unknown>, Op extends Record<keyof Cp, unknown>> = {
  [K in keyof Cp]: $FullDoc<Cp[K], Op[K]>;
};

export const $baseDocStruct = 
  <Cp extends Record<string, unknown>>(stt$eq: Stt$Eq<Cp>) =>
  <Op extends Record<keyof Cp, unknown>>(stt$baseDoc: Stt$BaseDoc<Cp, Op>): $BaseDoc<Cp, Op> => {
    return {};
  };
    
export const $invDocStruct = 
  <Cp extends Record<string, unknown>>(stt$eq: Stt$Eq<Cp>) =>
  <Op extends Record<keyof Cp, unknown>>(stt$invDoc: Stt$InvDoc<Cp, Op>): $InvDoc<Cp, Op> => {
    return {};
  };
    
export const $fullDocStruct = 
  <Cp extends Record<string, unknown>>(stt$eq: Stt$Eq<Cp>) =>
  <Op extends Record<keyof Cp, unknown>>(stt$fullDoc: Stt$FullDoc<Cp, Op>): $FullDoc<Cp, Op> => {
    return {};
  };
    