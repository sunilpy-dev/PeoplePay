/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY RULE DAG VALIDATOR
 * ==============================================================================
 * 
 * WHAT THIS FILE DOES IN SIMPLE WORDS:
 * Imagine you are calculating a payslip:
 * - You cannot calculate "House Rent Allowance (HRA)" before you calculate "Basic Salary",
 *   because HRA is 40% of Basic Salary!
 * - You cannot calculate "Net Salary" before you calculate "Gross Salary" and "Total Deductions".
 * 
 * This file acts as a "traffic controller" (using Kahn's Topological Sort Algorithm):
 * 1. It scans all salary rule formulas to see which rules depend on which other rules.
 * 2. It checks if there is any circular trap (e.g. Rule A needs Rule B, but Rule B needs Rule A).
 *    If there's a circular trap, the math would loop forever! This file catches that immediately.
 * 3. It ensures rules are ordered in a clean step-by-step pipeline (Sequence 10 -> 20 -> 100 -> 200).
 */

// These are built-in context variables provided by the system from the employee's contract and attendance.
// They are NOT other salary rules, so we don't treat them as rule dependencies.
const SYSTEM_CONTEXT_VARS = new Set([
  'CONTRACT_WAGE',      // The agreed monthly salary on the contract (e.g. 120,000)
  'SCHEDULE_DAYS',      // Standard working days in the month (e.g. 22 days)
  'WORKED_DAYS',        // How many days the employee actually worked
  'UNPAID_LEAVE_DAYS',  // Days taken as unpaid leave / Loss of Pay
  'OVERTIME_HOURS',     // Total overtime hours clocked in attendance
  'HOURLY_RATE'         // Wage divided by standard scheduled hours
]);

// Math functions allowed inside formulas (we don't confuse these with rule names)
const MATH_FUNCTIONS = new Set([
  'min', 'max', 'abs', 'round', 'ceil', 'floor', 'sqrt', 'pow', 'log', 'sin', 'cos', 'tan', 'true', 'false', 'null'
]);

/**
 * Helper function: extractDependencies
 * 
 * WHAT IT DOES:
 * Looks at a single rule and finds what other rule names it mentions.
 * 
 * Example:
 * If a rule is GROSS and its formula is "BASIC + HRA + CONV",
 * this function will return: ['BASIC', 'HRA', 'CONV'].
 */
export function extractDependencies(rule, allRuleCodes) {
  const dependencies = new Set();

  // If the rule is a percentage (e.g., PF is 12% of BASIC), it depends on the base_code ('BASIC')
  if (rule.type === 'PERCENTAGE' && rule.base_code) {
    if (allRuleCodes.has(rule.base_code)) {
      dependencies.add(rule.base_code);
    }
  } 
  // If the rule is a formula (e.g. 'BASIC + HRA'), search for words that match other rule codes
  else if (rule.type === 'FORMULA' && rule.formula) {
    // Regex matches any valid variable identifier (letters, numbers, underscore)
    const tokens = rule.formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
    for (const token of tokens) {
      if (
        allRuleCodes.has(token) && 
        token !== rule.code && 
        !SYSTEM_CONTEXT_VARS.has(token) && 
        !MATH_FUNCTIONS.has(token.toLowerCase())
      ) {
        dependencies.add(token);
      }
    }
  }

  return Array.from(dependencies);
}

/**
 * Main function: validateRuleDAG
 * 
 * WHAT IT DOES:
 * Takes an array of all rules in a salary structure and runs "Kahn's Algorithm":
 * 1. Counts how many prerequisites each rule needs (its "in-degree").
 * 2. Starts with rules that need NO prerequisites (like BASIC which only uses contract wage).
 * 3. Once those are calculated, unlocks rules that depend on them (like HRA and PF).
 * 4. Repeats until all rules are sorted into a valid execution order.
 * 5. If any rules are left stuck in a loop, it reports a "Circular Dependency Detected" error!
 * 
 * @param {Array} rules - List of salary rule objects
 * @returns {Object} { isValid: boolean, topologicalOrder?: string[], cycle?: string[], errors?: string[] }
 */
export function validateRuleDAG(rules) {
  const ruleCodes = new Set(rules.map(r => r.code));
  const ruleMap = new Map(rules.map(r => [r.code, r]));
  const errors = [];

  // Adjacency list: Graph where "A -> B" means "Rule A must finish before Rule B can run"
  const adjList = new Map();
  // In-degree: How many prerequisites must finish before this rule can run
  const inDegree = new Map();
  // Prerequisites lookup map
  const prerequisites = new Map();

  // Initialize maps for each rule
  for (const rule of rules) {
    adjList.set(rule.code, []);
    inDegree.set(rule.code, 0);
    prerequisites.set(rule.code, []);
  }

  // Build the graph connections
  for (const rule of rules) {
    const deps = extractDependencies(rule, ruleCodes);
    prerequisites.set(rule.code, deps);

    for (const dep of deps) {
      // Check 1: Did someone type a rule name that doesn't exist?
      if (!ruleMap.has(dep)) {
        errors.push(`Rule '${rule.code}' depends on non-existent rule '${dep}'.`);
        continue;
      }

      // Check 2: Sequence check. If Rule B depends on Rule A, Rule A's sequence number must be smaller!
      const depRule = ruleMap.get(dep);
      if (depRule.sequence >= rule.sequence) {
        errors.push(
          `Sequence ordering error: Rule '${rule.code}' (Seq ${rule.sequence}) depends on '${dep}' (Seq ${depRule.sequence}), but prerequisite must have a lower sequence number.`
        );
      }

      // Record dependency: 'dep' leads to 'rule.code'
      adjList.get(dep).push(rule.code);
      inDegree.set(rule.code, inDegree.get(rule.code) + 1);
    }
  }

  // Step 2: Find all rules that have 0 prerequisites to start with
  const queue = [];
  for (const [code, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(code);
    }
  }

  // Step 3: Process the queue in topological order
  const topologicalOrder = [];
  while (queue.length > 0) {
    // Sort queue by rule sequence so rules execute in neat numerical order
    queue.sort((a, b) => (ruleMap.get(a)?.sequence || 0) - (ruleMap.get(b)?.sequence || 0));
    const current = queue.shift();
    topologicalOrder.push(current);

    // For every rule that depended on 'current', reduce its remaining prerequisite count by 1
    const neighbors = adjList.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDegree);
      // When all prerequisites for a neighbor are satisfied, add it to the queue
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Step 4: Circular dependency check
  // If the number of processed rules is less than the total rules, it means some rules are trapped in a circle!
  if (topologicalOrder.length !== rules.length) {
    const cyclicRules = [];
    for (const [code, deg] of inDegree.entries()) {
      if (deg > 0) {
        cyclicRules.push(code);
      }
    }

    errors.push(
      `Circular dependency detected involving rules: ${cyclicRules.join(', ')}`
    );

    return {
      isValid: false,
      cycle: cyclicRules,
      errors
    };
  }

  // If there were sequence errors or missing dependencies, report them
  if (errors.length > 0) {
    return {
      isValid: false,
      topologicalOrder,
      errors
    };
  }

  // All clean! The graph is valid and ready for calculation
  return {
    isValid: true,
    topologicalOrder,
    dependencies: Object.fromEntries(prerequisites)
  };
}
