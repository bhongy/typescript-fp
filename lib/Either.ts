/**
 * Design notes:
 *
 * - currently keep `isLeft` and `isRight` out from the public interface (hence it's not on the instance)
 *   because I want users to "fork" the result (intended interface) rather than relying on
 *   the internal knowledge about Left vs Right. I might change my mind if there're reasonable cases.
 */

import * as Functor from './Functor';
import * as Apply from './Apply';

/** Internal implementation. Do not export. */

// consumers never works with the contained value directly
const $value = Symbol('Either.value');
const $type = Symbol('Either.type');
const $Left = Symbol('Either.Left');
const $Right = Symbol('Either.Right');

class Left<E> implements Functor.Interface<E>, Apply.Interface<E> {
  // otherwise test: `expect(left(x)).toEqual(right(x))` will not fail
  private readonly [$type] = $Left;
  private readonly [$value]: E;

  constructor(value: E) {
    this[$value] = value;
  }

  chain(f: any): Left<E> {
    return this;
  }

  map(f: any): Left<E> {
    return this;
  }

  // `.ap` spec: `b` must be an Apply of a function
  ap<B extends Function>(b: Left<B>): Left<B>;
  ap(b: Right<Function>): Left<E>;
  ap(b: Either): Left<any> {
    return isLeft(b) ? b : this;
  }
}

class Right<T> implements Functor.Interface<T>, Apply.Interface<T> {
  private readonly [$type] = $Right;
  private readonly [$value]: T;
  // constructor(private readonly value: T) {}

  constructor(value: T) {
    this[$value] = value;
  }

  // bind
  // flatMap
  chain<U>(f: (x: T) => U): U {
    return f(this[$value]);
  }

  map<U>(f: (x: T) => U): Right<U> {
    // is .chain or .fold correct here?
    return right(this.chain(f));
    // return this.ap(of(f));
  }

  ap<B extends Function>(b: Left<B>): Left<B>;
  ap<U>(b: Right<(x: T) => U>): Right<U>;
  ap(b: Either): Either {
    return isLeft(b) ? b.chain(left) : b.chain(f => this.map(f));
  }

  // join :: Monad m => m (m a) -> m a
}

const isLeft = <E>(either: Either<E, any>): either is Left<E> =>
  either instanceof Left;
const isRight = <T>(either: Either<any, T>): either is Right<T> =>
  either instanceof Right;

/** Public Interfaces */

export type Either<E = any, T = any> = Left<E> | Right<T>;
export const left = <E>(e: E) => new Left(e);
export const right = <T>(x: T) => new Right(x);
// permit "lifting" `null` and `undefined`
// of :: (Applicative f) => a -> f a
export const of = right;

// type Diff<T, U> = T extends U ? never : T;
// type NonNullable<T> = Diff<T, null | undefined>;
export const fromNullable = <T>(
  x: undefined | null | T
): Left<null> | Right<T> => (x != null ? right(x) : left(null));

// export const liftA = (fn, m1) => m1.map(fn);
// export const liftA2 = (fn, m1, m2) => m2.ap(liftA(fn, m1));
// export const liftA3 = (fn, m1, m2, m3) => m3.ap(liftA2(fn, m1, m2));
// const liftAN = (fn, m1, ...ms) =>
//   ms.reduce((prev, curr) => curr.ap(prev), liftA(fn, m1));

// const fromLeft = <E, T>(either: Either<E, any>, defaultValue: T): Left<E> | T =>
//   isLeft(either) ? either.chain((x: E) => x) : defaultValue;