import getNameOrValue from '../utils/getNameOrValue';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import type Documentation from '../Documentation';
import type { NodePath } from '@babel/traverse';
import type { Identifier } from '@babel/types';
import type { Handler } from '.';
import type { ComponentNode } from '../resolver';

function getDisplayNameFromPath(filename?: string | null) {
  if (!filename || !filename.includes('/components/')) {
    return null;
  }

  const mustacheComponentName = filename
    .substring(filename.includes('/app/') ? filename.indexOf('/app/') + 5 : 0)
    .replace(/\/components\//g, '/')
    .replace(/^legacy\/pods\//g, '')
    .replace('/component.js', '');

  return mustacheComponentName
    .split('/')
    .map(mustachePath =>
      mustachePath
        .split('-')
        .map(word => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
        .join(''),
    )
    .join('::');
}

const displayNameHandler: Handler = function (
  documentation: Documentation,
  componentDefinition: NodePath<ComponentNode>,
  filename?: string | null,
): void {
  const displayName = getDisplayNameFromPath(filename);

  if (displayName) {
    documentation.set('displayName', displayName);

    return;
  }

  // Function and class declarations need special treatment. The name of the
  // function / class is the displayName
  if (
    (componentDefinition.isClassDeclaration() ||
      componentDefinition.isFunctionDeclaration()) &&
    componentDefinition.has('id')
  ) {
    documentation.set(
      'displayName',
      getNameOrValue(componentDefinition.get('id') as NodePath<Identifier>),
    );
  } else if (
    componentDefinition.isArrowFunctionExpression() ||
    componentDefinition.isFunctionExpression() ||
    isReactForwardRefCall(componentDefinition)
  ) {
    let currentPath: NodePath = componentDefinition;

    while (currentPath.parentPath) {
      if (currentPath.parentPath.isVariableDeclarator()) {
        documentation.set(
          'displayName',
          getNameOrValue(currentPath.parentPath.get('id')),
        );

        return;
      } else if (currentPath.parentPath.isAssignmentExpression()) {
        const leftPath = currentPath.parentPath.get('left');

        if (leftPath.isIdentifier() || leftPath.isLiteral()) {
          documentation.set('displayName', getNameOrValue(leftPath));

          return;
        }
      }
      currentPath = currentPath.parentPath;
    }
  }
};

export default displayNameHandler;
