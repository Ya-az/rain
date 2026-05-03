/**
 * getInspectionStatus — pure function, extracted verbatim from original App.jsx
 * CRITICAL: insp[k] === true (tri-state: null/true/false)
 */
export function getInspectionStatus(categoryId, isInitial, insp) {
  let passed = true;
  const check = (keys) => keys.every(k => insp[k] === true);
  const isNum = (v) => v !== undefined && v !== '' && !isNaN(parseFloat(v));

  if (categoryId === 'c1_fastbot') {
    if (isInitial && !check(['autonomy', 'irSensor', 'lineFollow', 'startPos'])) passed = false;
    if (!check(['safety', 'operator'])) passed = false;
    if (isNum(insp.width) && isNum(insp.height) && isNum(insp.depth)) {
      const v = parseFloat(insp.width) * parseFloat(insp.height) * parseFloat(insp.depth);
      if (v > 65030) passed = false;
    } else { passed = false; }
  } else if (categoryId === 'c1_linefollow') {
    if (isInitial && !check(['autonomy', 'irSensor', 'lineFollow', 'startPos', 'stopTower', 'deliveryMech'])) passed = false;
    if (!check(['safety', 'operator', 'payloadBalls'])) passed = false;
    if (isNum(insp.width) && isNum(insp.height) && isNum(insp.depth)) {
      const v = parseFloat(insp.width) * parseFloat(insp.height) * parseFloat(insp.depth);
      if (v > 65030) passed = false;
    } else { passed = false; }
  } else if (categoryId === 'c1_amazeing') {
    if (isInitial && !check(['autonomy', 'autoForward', 'minTurn', 'forwardPost'])) passed = false;
    if (!check(['safety', 'operator', 'sensorRestr'])) passed = false;
    if (isNum(insp.width) && isNum(insp.height) && isNum(insp.depth)) {
      const w = parseFloat(insp.width);
      const v = w * parseFloat(insp.height) * parseFloat(insp.depth);
      if (v > 65030 || w > 24) passed = false;
    } else { passed = false; }
  } else if (categoryId === 'c2_sumo') {
    if (isInitial && !check(['autonomy', 'edgeDetect', 'oppSearch', 'startPos'])) passed = false;
    if (!check(['safety', 'operator'])) passed = false;
    if (isNum(insp.width) && isNum(insp.length) && isNum(insp.weight) && isNum(insp.maxWeight)) {
      if (parseFloat(insp.width) > 18 || parseFloat(insp.length) > 25 || parseFloat(insp.weight) > parseFloat(insp.maxWeight)) passed = false;
    } else { passed = false; }
  } else if (categoryId === 'c2_soccer') {
    if (isInitial && !check(['twoRobots', 'r1_autonomy', 'r1_hardware', 'r2_autonomy', 'r2_hardware'])) passed = false;
    if (!check(['r1_safety', 'r2_safety', 'operator'])) passed = false;
    if (isNum(insp.r1_w) && isNum(insp.r1_l) && isNum(insp.r1_h) && isNum(insp.r2_w) && isNum(insp.r2_l) && isNum(insp.r2_h)) {
      if (parseFloat(insp.r1_w) > 15 || parseFloat(insp.r1_l) > 15 || parseFloat(insp.r1_h) > 15) passed = false;
      if (parseFloat(insp.r2_w) > 15 || parseFloat(insp.r2_l) > 15 || parseFloat(insp.r2_h) > 15) passed = false;
    } else { passed = false; }
  }
  return passed;
}
