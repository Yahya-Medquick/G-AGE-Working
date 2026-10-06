import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'server.ts');
const baselinePath = path.join(root, 'tests', 'route-baseline.json');
const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);

function pathsFromNode(node) {
  if (ts.isStringLiteralLike(node) || (ts.isNoSubstitutionTemplateLiteral(node))) return [node.text];
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.flatMap((element) => pathsFromNode(element));
  }
  return [];
}

export function getOrderedRegisteredRoutes(source = fs.readFileSync(sourcePath, 'utf8')) {
  const file = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const routes = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'app' &&
      methods.has(node.expression.name.text) &&
      node.arguments.length > 0
    ) {
      for (const routePath of pathsFromNode(node.arguments[0])) {
        routes.push({ method: node.expression.name.text.toUpperCase(), path: routePath });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return routes;
}

export function getRegisteredRoutes(source = fs.readFileSync(sourcePath, 'utf8')) {
  return getOrderedRegisteredRoutes(source)
    .sort((a, b) => a.method.localeCompare(b.method) || a.path.localeCompare(b.path));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(getRegisteredRoutes(), null, 2)}\n`);
  console.log(`Wrote ${getRegisteredRoutes().length} route registrations to tests/route-baseline.json`);
}
