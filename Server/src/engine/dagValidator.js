import { Parser } from 'expr-eval';

/**
 * Validates salary rules dependency graph using Kahn's Topological Sort Algorithm.
 * Identifies direct or indirect circular dependencies (e.g. A -> B -> A, or NET -> BONUS -> NET)
 * and verifies syntax of all mathematical formulas.
 *
 * @param {Array} rules - Array of rules { code, type, base_code, formula }
 * @returns {Object} { isValid: boolean, hasCycle: boolean, cycleNodes: string[], topologicalOrder: string[], error?: string }
 */
export function validateSalaryRulesDAG(rules) {
  const parser = new Parser();
  const ruleCodes = new Set(rules.map((r) => r.code));
  
  // graph[u] = list of rule codes that DEPEND on u (u -> v where v needs u)
  const graph = {};
  // inDegree[v] = number of rules that v depends on
  const inDegree = {};
  // Track direct dependency map for tracing error paths
  const dependsOn = {};

  for (const r of rules) {
    graph[r.code] = [];
    inDegree[r.code] = 0;
    dependsOn[r.code] = [];
  }

  // System context variables that do not need to be computed by other rules
  const systemContextVariables = new Set([
    'CONTRACT_WAGE',
    'SCHEDULE_DAYS',
    'WORKED_DAYS',
    'UNPAID_LEAVE_DAYS',
    'OVERTIME_HOURS',
    'HOURLY_RATE'
  ]);

  for (const r of rules) {
    let deps = [];

    if (r.type === 'PERCENTAGE' && r.base_code) {
      deps.push(r.base_code);
    } else if (r.type === 'FORMULA' && r.formula) {
      try {
        const parsedVars = parser.parse(r.formula).variables();
        for (const v of parsedVars) {
          // If the variable matches another rule code, it's a dependency
          if (ruleCodes.has(v)) {
            deps.push(v);
          } else if (!systemContextVariables.has(v)) {
            // Variable is neither a known rule nor a system context variable
            // Warning or note, but might be allowed or flagged
          }
        }
      } catch (syntaxErr) {
        return {
          isValid: false,
          hasCycle: false,
          error: `Formula syntax error in rule '${r.code}': ${syntaxErr.message}`
        };
      }
    }

    // Deduplicate dependencies
    deps = [...new Set(deps)];
    dependsOn[r.code] = deps;

    // Check for self-reference
    if (deps.includes(r.code)) {
      return {
        isValid: false,
        hasCycle: true,
        cycleNodes: [r.code],
        error: `Circular dependency: Rule '${r.code}' directly references itself.`
      };
    }

    for (const dep of deps) {
      if (graph[dep]) {
        graph[dep].push(r.code);
        inDegree[r.code]++;
      }
    }
  }

  // Kahn's Algorithm: Queue of nodes with in-degree 0 (no unresolved dependencies)
  const queue = [];
  for (const code of ruleCodes) {
    if (inDegree[code] === 0) {
      queue.push(code);
    }
  }

  const topologicalOrder = [];
  while (queue.length > 0) {
    const current = queue.shift();
    topologicalOrder.push(current);

    for (const neighbor of graph[current] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If sorted elements count is less than total rules, a cycle exists
  if (topologicalOrder.length < rules.length) {
    const cycleNodes = rules
      .filter((r) => !topologicalOrder.includes(r.code))
      .map((r) => r.code);

    return {
      isValid: false,
      hasCycle: true,
      cycleNodes,
      topologicalOrder,
      error: `Circular dependency detected involving rules: ${cycleNodes.join(' ⇄ ')}`
    };
  }

  return {
    isValid: true,
    hasCycle: false,
    cycleNodes: [],
    topologicalOrder
  };
}

export default {
  validateSalaryRulesDAG
};
