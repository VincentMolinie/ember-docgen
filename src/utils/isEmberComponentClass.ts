import type { NodePath } from '@babel/traverse';
import type {
  ClassDeclaration,
  ClassExpression,
  ImportDeclaration,
} from '@babel/types';
import resolveToValue from './resolveToValue';

/**
 * Returns `true` of the path represents a class definition which either extends
 * `React.Component` or has a superclass and implements a `render()` method.
 */
export default function isEmberComponentClass(
  path: NodePath,
): path is NodePath<ClassDeclaration | ClassExpression> {
  if (!path.isClassDeclaration() && !path.isClassExpression()) {
    return false;
  }

  // extends something
  if (!path.node.superClass) {
    return false;
  }

  // Ember.Component or Glimmer.Component
  const superClass = resolveToValue(path.get('superClass') as NodePath);

  if (
    superClass.node.type === 'ImportDeclaration' &&
    ['@glimmer/component', '@ember/component'].includes(
      (superClass.node as ImportDeclaration).source.value,
    )
  ) {
    return true;
  }

  // check for @extends Component in docblock
  if (
    path.node.leadingComments &&
    path.node.leadingComments.some(function (comment) {
      return /@extends\s+Component/.test(comment.value);
    })
  ) {
    return true;
  }

  return false;
}
