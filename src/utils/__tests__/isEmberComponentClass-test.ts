import { parse, makeMockImporter } from '../../../tests/utils';
import isEmberComponentClass from '../isEmberComponentClass';

describe('isEmberComponentClass', () => {
  const mockImporter = makeMockImporter({
    component: stmtLast =>
      stmtLast(`
      import Component from '@ember/component';
      export default Component;
    `).get('declaration'),

    pureComponent: stmtLast =>
      stmtLast(`
      import Component from '@glimmer/component';
      export default Component;
    `).get('declaration'),
  });

  describe('JSDoc @extends Component', () => {
    it('accepts class declarations declaring `@extends Component` in JSDoc', () => {
      const def = parse.statementLast(`
        import Component from '@glimmer/component';
        /**
         * @class Foo
         * @extends Component
         */
        class Foo extends Bar {}
      `);

      expect(isEmberComponentClass(def)).toBe(true);
    });
  });

  describe('Component inheritance', () => {
    it('accepts class declarations extending Component', () => {
      const def = parse.statementLast(`
        import Component from '@ember/component';
        class Foo extends Component {}
      `);

      expect(isEmberComponentClass(def)).toBe(true);
    });

    it('accepts class expressions extending Component', () => {
      const def = parse
        .statementLast(
          `
        import Component from '@glimmer/component';
        var Foo = class extends Component {}
      `,
        )
        .get('declarations')[0]
        .get('init');

      expect(isEmberComponentClass(def)).toBe(true);
    });

    it('resolves the super class reference', () => {
      const def = parse.statementLast(`
        import Component from '@glimmer/component';
        var C = Component;
        class Foo extends C {}
      `);

      expect(isEmberComponentClass(def)).toBe(true);
    });

    it('resolves the super class reference with alias', () => {
      const def = parse.statementLast(`
        import { default as C } from '@ember/component';
        class Foo extends C {}
      `);

      expect(isEmberComponentClass(def)).toBe(true);
    });

    it('does not accept references to other modules', () => {
      const def = parse.statementLast(
        `
        var { Component } = require('React');
        class Foo extends Component {}
      `,
      );

      expect(isEmberComponentClass(def)).toBe(false);
    });

    it('can resolve Component from an intermediate module', () => {
      const def = parse.statementLast(
        `import RC from 'component';
         class Foo extends RC {}`,
        mockImporter,
      );

      expect(isEmberComponentClass(def)).toBe(true);
    });
  });
});
