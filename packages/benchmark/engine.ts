/* eslint-disable */
import { bench, do_not_optimize, group, run, summary } from 'mitata';
/*
group('access style', () => {
  summary(() => {
    // ! NODE: ~same, BUN: dot ~1.3x faster
    bench('dot', function* (state: any) {
      const obj = state.get('obj');
      yield () => do_not_optimize(obj.name);
    }).args('obj', [{name: 'SX3'}]).gc('inner');

    bench('bracket', function* (state: any) {
      const obj = state.get('obj');
      yield () => do_not_optimize(obj['name']);
    }).args('obj', [{name: 'SX3'}]).gc('inner');
  });
});

group('equality', () => {
  // ! NODE: ~same, BUN: == ~1.5x faster
  summary(() => {
    bench('typeof ==', function* (state: any) {
      const val = state.get('val');
      yield () => do_not_optimize(typeof val == 'number');
    }).args('val', [5]).gc('inner');

    bench('typeof ===', function* (state: any) {
      const val = state.get('val');
      yield () => do_not_optimize(typeof val === 'number');
    }).args('val', [5]).gc('inner');
  });

  // ! NODE: ~same, BUN: == ~3.2x faster
  summary(() => {
    bench('typeof == failed', function* (state: any) {
      const val = state.get('val');
      yield () => do_not_optimize(typeof val == 'number');
    }).args('val', ['s']).gc('inner');

    bench('typeof === failed', function* (state: any) {
      const val = state.get('val');
      yield () => do_not_optimize(typeof val === 'number');
    }).args('val', ['s']).gc('inner');
  });
});

group('arrow vs normal', () => {
  const arrow = () => Math.random();
  const normal = function () { return Math.random(); };

  // ! NODE: ~same, BUN: arrow ~1.3x faster
  summary(() => {
    bench('arrow', function* () {
      yield () => do_not_optimize(arrow());
    }).gc('inner');

    bench('normal', function* () {
      yield () => do_not_optimize(normal());
    }).gc('inner');
  });
});

group('define', () => {
  // ! NODE: ~same but destructure stabled results, BUN: destructure - const ~1.7x faster
  summary(() => {
    bench('destructure - const', function* (state: any) {
      const user = state.get('user');
      yield () => {
        const { id, name, age } = user;
        do_not_optimize(id);
        do_not_optimize(name);
        do_not_optimize(age);
      };
    }).args('user', [{ id: '333', name: 'SX3', age: 3 }]).gc('inner');

    bench('destructure - let', function* (state: any) {
      const user = state.get('user');
      yield () => {
        let { id, name, age } = user;
        do_not_optimize(id);
        do_not_optimize(name);
        do_not_optimize(age);
      };
    }).args('user', [{ id: '333', name: 'SX3', age: 3 }]).gc('inner');

    bench('access - let', function* (state: any) {
      const user = state.get('user');
      yield () => {
        let id = user.id, name = user.name, age = user.age;
        do_not_optimize(id);
        do_not_optimize(name);
        do_not_optimize(age);
      };
    }).args('user', [{ id: '333', name: 'SX3', age: 3 }]).gc('inner');

    bench('access - const', function* (state: any) {
      const user = state.get('user');
      yield () => {
        const id = user.id, name = user.name, age = user.age;
        do_not_optimize(id);
        do_not_optimize(name);
        do_not_optimize(age);
      };
    }).args('user', [{ id: '333', name: 'SX3', age: 3 }]).gc('inner');
  });
});

*/


await run();
