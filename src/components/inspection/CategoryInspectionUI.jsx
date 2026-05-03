import { getInspectionStatus } from './inspectionLogic';

/**
 * CheckItem — tri-state button: null(gray ○) → true(green ✓) → false(red ✗, stays)
 */
function CheckItem({ id, label, insp, updateInsp, disabled }) {
  const val = insp[id];

  const handleClick = () => {
    if (disabled) return;
    if (val === null || val === undefined) updateInsp(id, true);
    else if (val === true) updateInsp(id, false);
    else if (val === false) updateInsp(id, true);
  };

  const stateStyle =
    val === true
      ? 'border-saudi-400 bg-saudi-50 text-saudi-800 hover:bg-saudi-100'
      : val === false
      ? 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100'
      : 'border-ink-200 bg-ink-50 text-ink-600 hover:bg-ink-100 hover:border-ink-300';

  const icon = val === true ? '✓' : val === false ? '✗' : '○';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-150 text-start select-none ${stateStyle} ${disabled ? 'opacity-70' : ''}`}
    >
      <span className={`text-base leading-none w-5 text-center shrink-0 font-bold ${
        val === true ? 'text-saudi-600' : val === false ? 'text-red-500' : 'text-ink-400'
      }`}>{icon}</span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function DimInput({ placeholder, value, onChange, disabled }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9.]*"
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-2 border-2 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-ink-100 text-center font-mono placeholder:text-ink-300 focus:border-brand-400"
    />
  );
}

export default function CategoryInspectionUI({ categoryId, isInitial, insp, updateInsp, disabled }) {
  const isNum = (v) => v !== undefined && v !== '' && !isNaN(parseFloat(v));

  if (categoryId === 'c2_soccer') {
    const r1Pass = isNum(insp.r1_w) && isNum(insp.r1_l) && isNum(insp.r1_h) &&
      parseFloat(insp.r1_w) <= 15 && parseFloat(insp.r1_l) <= 15 && parseFloat(insp.r1_h) <= 15;
    const r2Pass = isNum(insp.r2_w) && isNum(insp.r2_l) && isNum(insp.r2_h) &&
      parseFloat(insp.r2_w) <= 15 && parseFloat(insp.r2_l) <= 15 && parseFloat(insp.r2_h) <= 15;

    return (
      <div className="space-y-4 mb-4">
        <h5 className="text-xs font-bold text-ink-500 uppercase tracking-wider border-b pb-1">SoccerBot Inspection</h5>
        {isInitial && <CheckItem id="twoRobots" label="Team presents exactly two robots" insp={insp} updateInsp={updateInsp} disabled={disabled} />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Robot 1 */}
          <div className="border border-ink-200 p-3 rounded-xl bg-white">
            <h6 className="font-bold text-xs text-ink-500 mb-2 border-b pb-1">ROBOT 1</h6>
            <div className="space-y-2 mb-3">
              {isInitial && <CheckItem id="r1_autonomy" label="Autonomy" insp={insp} updateInsp={updateInsp} disabled={disabled} />}
              {isInitial && <CheckItem id="r1_hardware" label="Hardware Compliance" insp={insp} updateInsp={updateInsp} disabled={disabled} />}
              <CheckItem id="r1_safety" label="Safety Checks" insp={insp} updateInsp={updateInsp} disabled={disabled} />
            </div>
            <div className="bg-ink-50 p-2 rounded-lg border">
              <p className="text-xs font-bold text-ink-400 mb-2">Dimensions W, L, H ≤15cm</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <DimInput placeholder="W" value={insp.r1_w} onChange={e => updateInsp('r1_w', e.target.value)} disabled={disabled} />
                <DimInput placeholder="L" value={insp.r1_l} onChange={e => updateInsp('r1_l', e.target.value)} disabled={disabled} />
                <DimInput placeholder="H" value={insp.r1_h} onChange={e => updateInsp('r1_h', e.target.value)} disabled={disabled} />
              </div>
              <div className={`text-xs text-center font-bold py-1 rounded ${r1Pass ? 'bg-saudi-100 text-saudi-800' : 'bg-red-100 text-red-800'}`}>
                {r1Pass ? 'R1 PASS' : 'FAIL'}
              </div>
            </div>
          </div>
          {/* Robot 2 */}
          <div className="border border-ink-200 p-3 rounded-xl bg-white">
            <h6 className="font-bold text-xs text-ink-500 mb-2 border-b pb-1">ROBOT 2</h6>
            <div className="space-y-2 mb-3">
              {isInitial && <CheckItem id="r2_autonomy" label="Autonomy" insp={insp} updateInsp={updateInsp} disabled={disabled} />}
              {isInitial && <CheckItem id="r2_hardware" label="Hardware Compliance" insp={insp} updateInsp={updateInsp} disabled={disabled} />}
              <CheckItem id="r2_safety" label="Safety Checks" insp={insp} updateInsp={updateInsp} disabled={disabled} />
            </div>
            <div className="bg-ink-50 p-2 rounded-lg border">
              <p className="text-xs font-bold text-ink-400 mb-2">Dimensions W, L, H ≤15cm</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <DimInput placeholder="W" value={insp.r2_w} onChange={e => updateInsp('r2_w', e.target.value)} disabled={disabled} />
                <DimInput placeholder="L" value={insp.r2_l} onChange={e => updateInsp('r2_l', e.target.value)} disabled={disabled} />
                <DimInput placeholder="H" value={insp.r2_h} onChange={e => updateInsp('r2_h', e.target.value)} disabled={disabled} />
              </div>
              <div className={`text-xs text-center font-bold py-1 rounded ${r2Pass ? 'bg-saudi-100 text-saudi-800' : 'bg-red-100 text-red-800'}`}>
                {r2Pass ? 'R2 PASS' : 'FAIL'}
              </div>
            </div>
          </div>
        </div>
        <CheckItem id="operator" label="Operator Restrictions" insp={insp} updateInsp={updateInsp} disabled={disabled} />
        <div>
          <label className="block text-xs font-bold text-ink-400 mb-1">Referee Notes (Optional)</label>
          <textarea value={insp.notes || ''} onChange={e => updateInsp('notes', e.target.value)} disabled={disabled} className="w-full p-2 border rounded-lg text-sm h-16 focus:ring-1 focus:ring-brand-500 outline-none disabled:bg-ink-100" />
        </div>
      </div>
    );
  }

  // Build checklist items for non-soccer categories
  let reqItems = [];
  if (isInitial) reqItems.push({ id: 'autonomy', label: 'Autonomy' });

  if (categoryId === 'c1_fastbot' || categoryId === 'c1_linefollow') {
    if (isInitial) {
      reqItems.push({ id: 'irSensor', label: 'IR Sensor Usage & Status' });
      reqItems.push({ id: 'lineFollow', label: 'Line-following Demonstration' });
      reqItems.push({ id: 'startPos', label: 'Start Position Compliance' });
    }
  }

  if (categoryId === 'c1_linefollow') {
    if (isInitial) reqItems.push({ id: 'stopTower', label: 'Stopping at Tower Demonstration' });
    reqItems.push({ id: 'payloadBalls', label: 'Validation of Payload Balls (Ping-pong)' });
    if (isInitial) reqItems.push({ id: 'deliveryMech', label: 'Delivery Mech Independence' });
  }

  if (categoryId === 'c1_amazeing') {
    reqItems.push({ id: 'sensorRestr', label: 'Sensor Restrictions (Wheel Encoders Only)' });
    if (isInitial) {
      reqItems.push({ id: 'autoForward', label: 'Autonomous Forward Movement' });
      reqItems.push({ id: 'minTurn', label: 'Minimum 45-degree Turning' });
      reqItems.push({ id: 'forwardPost', label: 'Forward Movement Post-turn' });
    }
  }

  if (categoryId === 'c2_sumo') {
    if (isInitial) {
      reqItems.push({ id: 'edgeDetect', label: 'Edge Detection & Avoidance Sensor' });
      reqItems.push({ id: 'oppSearch', label: 'Opponent-Searching Program' });
      reqItems.push({ id: 'startPos', label: 'Start Position Compliance' });
    }
  }

  reqItems.push({ id: 'safety', label: 'Safety Checks' });
  reqItems.push({ id: 'operator', label: 'Operator Restrictions' });

  return (
    <div className="space-y-3 mb-4">
      <h5 className="text-xs font-bold text-ink-500 uppercase tracking-wider border-b pb-1">Inspection Checklist</h5>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {reqItems.map(item => (
          <CheckItem key={item.id} id={item.id} label={item.label} insp={insp} updateInsp={updateInsp} disabled={disabled} />
        ))}
      </div>

      {/* Dimensions block */}
      {categoryId === 'c2_sumo' ? (
        <div className="bg-ink-50 p-3 rounded-xl border">
          <p className="text-xs font-bold text-ink-400 mb-2">Dimensions (W≤18cm, L≤25cm, Wgt≤MaxWgt)</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <DimInput placeholder="W" value={insp.width} onChange={e => updateInsp('width', e.target.value)} disabled={disabled} />
            <DimInput placeholder="L" value={insp.length} onChange={e => updateInsp('length', e.target.value)} disabled={disabled} />
            <DimInput placeholder="Wgt" value={insp.weight} onChange={e => updateInsp('weight', e.target.value)} disabled={disabled} />
            <DimInput placeholder="MaxWgt" value={insp.maxWeight} onChange={e => updateInsp('maxWeight', e.target.value)} disabled={disabled} />
          </div>
          <div className={`text-xs text-center font-bold py-1 rounded ${
            (isNum(insp.width) && isNum(insp.length) && isNum(insp.weight) && isNum(insp.maxWeight) &&
              parseFloat(insp.width) <= 18 && parseFloat(insp.length) <= 25 && parseFloat(insp.weight) <= parseFloat(insp.maxWeight))
              ? 'bg-saudi-100 text-saudi-800' : 'bg-red-100 text-red-800'
          }`}>
            {(isNum(insp.width) && isNum(insp.length) && isNum(insp.weight) && isNum(insp.maxWeight) &&
              parseFloat(insp.width) <= 18 && parseFloat(insp.length) <= 25 && parseFloat(insp.weight) <= parseFloat(insp.maxWeight))
              ? 'PASS' : 'FAIL'}
          </div>
        </div>
      ) : (
        <div className="bg-ink-50 p-3 rounded-xl border">
          <p className="text-xs font-bold text-ink-400 mb-2">
            Volume {categoryId === 'c1_amazeing' ? '(W≤24cm, Vol≤65030cm³)' : '(Vol≤65030cm³)'}
          </p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <DimInput placeholder="W (cm)" value={insp.width} onChange={e => updateInsp('width', e.target.value)} disabled={disabled} />
            <DimInput placeholder="H (cm)" value={insp.height} onChange={e => updateInsp('height', e.target.value)} disabled={disabled} />
            <DimInput placeholder="D (cm)" value={insp.depth} onChange={e => updateInsp('depth', e.target.value)} disabled={disabled} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-ink-500">
              Vol: <strong>{isNum(insp.width) && isNum(insp.height) && isNum(insp.depth)
                ? (parseFloat(insp.width) * parseFloat(insp.height) * parseFloat(insp.depth)).toFixed(0)
                : '--'}</strong> cm³
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              (isNum(insp.width) && isNum(insp.height) && isNum(insp.depth) &&
                (parseFloat(insp.width) * parseFloat(insp.height) * parseFloat(insp.depth)) <= 65030 &&
                (categoryId === 'c1_amazeing' ? parseFloat(insp.width) <= 24 : true))
                ? 'bg-saudi-100 text-saudi-800' : 'bg-red-100 text-red-800'
            }`}>
              {(isNum(insp.width) && isNum(insp.height) && isNum(insp.depth) &&
                (parseFloat(insp.width) * parseFloat(insp.height) * parseFloat(insp.depth)) <= 65030 &&
                (categoryId === 'c1_amazeing' ? parseFloat(insp.width) <= 24 : true))
                ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-ink-400 mb-1">Referee Notes (Optional)</label>
        <textarea
          value={insp.notes || ''}
          onChange={e => updateInsp('notes', e.target.value)}
          disabled={disabled}
          className="w-full p-2 border rounded-lg text-sm h-14 focus:ring-1 focus:ring-brand-500 outline-none disabled:bg-ink-100"
        />
      </div>
    </div>
  );
}
