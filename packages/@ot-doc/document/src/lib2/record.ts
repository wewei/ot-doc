import { $Eq } from "./algebra";
import { $BaseDoc, $FullDoc, $Idn, $InvDoc } from "./document";
import { just, nothing } from "./maybe";

export const $baseDocRecord =
  <Cp>({ equals }: $Eq<Cp>) =>
  <Op>({
    initial,
    compose,
  }: $BaseDoc<Cp, Op>): $BaseDoc<Record<string, Cp>, Record<string, Op>> => {
    const cpI = initial();

    return {
      initial: () => ({}),
      compose: (op) => (cp) =>
        Object.keys(op).reduce((cpT, key) => {
          if (cpT.$ === 'Nothing') {
            return cpT;
          }
          const cpK = cpT.v[key] ?? cpI;
          const opK = op[key];
          const mNewCpK = compose(opK)(cpK);
          if (mNewCpK.$ === 'Nothing') {
            return nothing();
          }
          const { v: newCpK } = mNewCpK;
          if (!equals(newCpK)(cpK)) {
            if (cpT.v === cp) {
              cpT.v = { ...cp };
            }
            if (equals(newCpK)(cpI)) {
              delete cpT.v[key];
            } else {
              cpT.v[key] = newCpK;
            }
          }
          return cpT;
        }, just(cp)),
    };
  };

export const $invDocRecord =
  <Cp>({ equals }: $Eq<Cp>) =>
  <Op>({ initial, compose, invert }: $InvDoc<Cp, Op>): $InvDoc<Record<string, Cp>, Record<string, Op>> => {
    return {
      ...$baseDocRecord({ equals })({ initial, compose }),
      invert: (op) => Object.keys(op).reduce((opT, key) => {
        opT[key] = invert(op[key]);
        return opT;
      }, {} as Record<string, Op>),
    };
  };

export const $fullDocRecord =
  <Op>(clsOp: $Eq<Op> & $Idn<Op>) =>
  <Cp>(clsCp: $Eq<Cp>) =>
  ({ initial, compose, invert, transform }: $FullDoc<Cp, Op>): $FullDoc<Record<string, Cp>, Record<string, Op>> => {
    const opI = clsOp.identity();

    return {
      ...$invDocRecord(clsCp)({ initial, compose, invert }),
      identity: () => ({}),
      transform: (opA) => (opB) => Object.keys(opA).reduce((mOpT, key) => {
        if (mOpT.$ === 'Nothing' || !(key in opB)) {
          return mOpT;
        }
        const opKA = mOpT.v[key];
        const opKB = opB[key];
        const mNewOpKA = transform(opKA)(opKB);
        if (mNewOpKA.$ === 'Nothing') {
          return nothing();
        }
        const { v: newOpKA } = mNewOpKA;
        if (!clsOp.equals(newOpKA)(opKA)) {
          if (mOpT.v === opA) {
            mOpT.v = { ...opA };
          }
          if (clsOp.equals(newOpKA)(opI)) {
            delete mOpT.v[key];
          } else {
            mOpT.v[key] = newOpKA;
          }
        }
        return mOpT;
      }, just(opA)),
    };
  };
