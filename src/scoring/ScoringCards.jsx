import { useState, useEffect } from 'react';
import { AlertCircle, Edit3, Check as CheckIcon, ShieldCheck, Clock, CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import PrecisionTimer from '../components/ui/PrecisionTimer';
import CategoryInspectionUI from '../components/inspection/CategoryInspectionUI';
import { getInspectionStatus } from '../components/inspection/inspectionLogic';

function FsmButton({ fsmState, onAction, showScore, lang = 'en' }) {
  if (!showScore) return null;
  if (fsmState === 'PENDING_ADMIN') return null;
  return (
    <button
      onClick={onAction}
      className={`w-full font-bold py-4 px-4 rounded-2xl transition-all text-white flex items-center justify-center gap-2.5 press-effect text-sm tracking-wide ${
        fsmState === 'AWAITING_SUBMISSION'
          ? 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg shadow-brand-600/25'
          : fsmState === 'SUBMITTED'
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/25'
          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20'
      }`}
    >
      {fsmState === 'AWAITING_SUBMISSION' && <><CheckCircle2 size={16} /> {lang === 'ar' ? 'إرسال النتيجة' : 'Submit Score'}</>}
      {fsmState === 'SUBMITTED' && <><Edit3 size={16} /> {lang === 'ar' ? 'طلب تعديل' : 'Request Edit'}</>}
      {fsmState === 'EDIT_REQUESTED' && <><ShieldCheck size={16} /> {lang === 'ar' ? 'إرسال للموافقة' : 'Submit for Admin Approval'}</>}
    </button>
  );
}

// ─── FastBotAttemptCard ──────────────────────────────────────────────────────

export function FastBotAttemptCard({ title, categoryId, teamDivision, attemptNumber, initialScoreObj, onSaveScore, onEditRequest, systemConfig, participationId, teamName: teamNameProp, lang }) {
  const initFSM = !initialScoreObj ? 'AWAITING_SUBMISSION'
    : initialScoreObj.status === 'VALID' ? 'SUBMITTED'
    : initialScoreObj.status === 'PENDING' ? 'PENDING_ADMIN'
    : 'AWAITING_SUBMISSION';
  const minLaps = systemConfig?.fastbotLaps?.[teamDivision] || { ES: 1, MS: 2, HS: 3, US: 4 }[teamDivision] || 1;
  const buildInitialData = (scoreObj) => scoreObj?.rawInput || { reqLaps: minLaps, finishedLaps: false, touched: false, exceeded180: false, elapsedTime: '', notes: '' };

  const [fsmState, setFsmState] = useState(initFSM);
  const [insp, setInsp] = useState(initialScoreObj ? (initialScoreObj.proposedInspection || initialScoreObj.inspectionData || {}) : {});
  const [data, setData] = useState(buildInitialData(initialScoreObj));
  const [photo, setPhoto] = useState(initialScoreObj?.rawInput?.photo || null);
  const [elapsedFromTimer, setElapsedFromTimer] = useState(null);
  const [step, setStep] = useState(initFSM !== 'AWAITING_SUBMISSION' ? 'scoring' : 'inspection');
  const [editMode, setEditMode] = useState(null);

  useEffect(() => {
    const nextFSM = !initialScoreObj ? 'AWAITING_SUBMISSION'
      : initialScoreObj.status === 'VALID' ? 'SUBMITTED'
      : initialScoreObj.status === 'PENDING' ? 'PENDING_ADMIN'
      : 'AWAITING_SUBMISSION';

    setFsmState(nextFSM);
    setInsp(initialScoreObj ? (initialScoreObj.proposedInspection || initialScoreObj.inspectionData || {}) : {});
    setData(buildInitialData(initialScoreObj));
    setPhoto(initialScoreObj?.rawInput?.photo || null);
    setElapsedFromTimer(null);
    setStep(nextFSM !== 'AWAITING_SUBMISSION' ? 'scoring' : 'inspection');
    setEditMode(null);
  }, [initialScoreObj, minLaps, attemptNumber]);

  const isInitial = attemptNumber === 1;
  const isInspectionPassed = getInspectionStatus(categoryId, isInitial, insp);
  const disabled = fsmState === 'SUBMITTED' || fsmState === 'PENDING_ADMIN';

  const calculateScore = () => {
    if (data.touched) return { score: 180.00, reason: 'Robot was touched' };
    if (data.exceeded180) return { score: 180.00, reason: 'Exceeded 180 seconds' };
    if (!data.finishedLaps) return { score: 180.00, reason: 'Did not finish required laps' };
    return { score: parseFloat(elapsedFromTimer || data.elapsedTime || 180.00), reason: null };
  };
  const result = calculateScore();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const showScore = isInspectionPassed || fsmState !== 'AWAITING_SUBMISSION';

  return (
    <div className={`scoring-card ${isInspectionPassed ? 'scoring-card-active' : 'border-ink-200'} animate-slide-up`}>
      <div className="p-4 sm:p-5 pb-3 sm:pb-4">
        <CardHeader title={title} inspPassed={isInspectionPassed} />
        {fsmState === 'PENDING_ADMIN' && <PendingBanner />}
      </div>

      {/* Step progress — AWAITING_SUBMISSION only */}
      {fsmState === 'AWAITING_SUBMISSION' && (
        <div className="px-5 pb-3 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${
            step === 'inspection' ? 'text-brand-600' : 'text-saudi-600'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              step === 'inspection' ? 'bg-brand-600 text-white' : 'bg-saudi-500 text-white'
            }`}>1</span>
            {lang === 'ar' ? 'الفحص' : 'Inspect'}
          </div>
          <div className="flex-1 h-0.5 bg-ink-100 rounded-full overflow-hidden">
            <div className={`h-full bg-saudi-500 rounded-full transition-all duration-500 ${step === 'scoring' ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${
            step === 'scoring' ? 'text-brand-600' : 'text-ink-300'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              step === 'scoring' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400'
            }`}>2</span>
            {lang === 'ar' ? 'التسجيل' : 'Score'}
          </div>
        </div>
      )}

      {/* EDIT_REQUESTED: 2-card section selector */}
      {fsmState === 'EDIT_REQUESTED' && editMode === null && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <p className="text-[10px] font-black text-ink-400 uppercase tracking-widest mb-3">
            {lang === 'ar' ? 'اختر القسم الذي تريد تعديله:' : 'Select section to edit:'}
          </p>
          <div className="space-y-3 mb-4">
            {/* Inspection card */}
            <button
              onClick={() => setEditMode('inspection')}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-ink-200 hover:border-brand-300 hover:bg-brand-50 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <CheckIcon size={18} className="text-brand-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-ink-800 text-sm">{lang === 'ar' ? 'قائمة الفحص' : 'Inspection Checklist'}</p>
                  <p className={`text-xs mt-0.5 font-semibold ${isInspectionPassed ? 'text-saudi-600' : 'text-rose-500'}`}>
                    {isInspectionPassed ? (lang === 'ar' ? '✓ ناجح' : '✓ Passed') : (lang === 'ar' ? '✗ غير ناجح' : '✗ Not passed')}
                  </p>
                </div>
              </div>
              <span className="text-ink-300 text-xl">›</span>
            </button>
            {/* Scoring card */}
            <button
              onClick={() => { setPhoto(null); setEditMode('scoring'); }}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-ink-200 hover:border-amber-300 hover:bg-amber-50 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Edit3 size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-ink-800 text-sm">{lang === 'ar' ? 'التسجيل' : 'Scoring'}</p>
                  <p className="text-xs mt-0.5 font-black text-brand-700">
                    {lang === 'ar' ? 'النتيجة النهائية' : 'Final Score'}: {parseFloat(initialScoreObj?.score ?? result.score).toFixed(2)}s
                  </p>
                </div>
              </div>
              <span className="text-ink-300 text-xl">›</span>
            </button>
          </div>
          <button
            onClick={() => { setData(initialScoreObj?.rawInput || data); setPhoto(initialScoreObj?.rawInput?.photo || null); setFsmState('SUBMITTED'); setEditMode(null); }}
            className="w-full py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 font-bold rounded-xl text-sm transition-colors border border-ink-200"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      )}

      {/* Inspection step */}
      {((fsmState === 'AWAITING_SUBMISSION' && step === 'inspection') || (fsmState === 'EDIT_REQUESTED' && editMode === 'inspection')) && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <CategoryInspectionUI categoryId={categoryId} isInitial={isInitial} insp={insp} updateInsp={(k, v) => setInsp(p => ({ ...p, [k]: v }))} disabled={disabled} lang={lang} />
          {fsmState === 'AWAITING_SUBMISSION' && isInspectionPassed && (
            <button
              onClick={() => setStep('scoring')}
              className="w-full mt-3 py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md shadow-brand-600/20 press-effect"
            >
              <ChevronRight size={16} /> {lang === 'ar' ? 'التالي: التسجيل' : 'Continue to Scoring'}
            </button>
          )}
          {fsmState === 'EDIT_REQUESTED' && (
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setEditMode(null)}
                className="flex-none px-5 py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 font-bold rounded-xl text-sm transition-colors border border-ink-200"
              >
                {lang === 'ar' ? '→ رجوع' : '← Back'}
              </button>
              <button
                onClick={() => { if (onEditRequest && initialScoreObj) { onEditRequest(initialScoreObj.id, result.score, insp, { ...data, photo: initialScoreObj?.rawInput?.photo || photo }); setFsmState('PENDING_ADMIN'); setEditMode(null); } }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                {lang === 'ar' ? 'إرسال تعديل الفحص' : 'Submit Inspection Edit'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scoring step */}
      {((fsmState !== 'EDIT_REQUESTED' && step === 'scoring') || (fsmState === 'EDIT_REQUESTED' && editMode === 'scoring')) && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <button
            onClick={() => fsmState === 'EDIT_REQUESTED' ? setEditMode(null) : setStep('inspection')}
            className="w-full mb-4 py-2.5 bg-ink-50 hover:bg-ink-100 text-ink-600 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors border border-ink-200 press-effect"
          >
            {lang === 'ar' ? '→' : '←'} {fsmState === 'EDIT_REQUESTED' ? (lang === 'ar' ? 'رجوع لاختيار القسم' : 'Back to section selection') : isInspectionPassed ? (lang === 'ar' ? 'الفحص ✓ — اضغط للمراجعة' : 'Inspection ✓ — tap to review') : (lang === 'ar' ? 'رجوع للفحص' : 'Back to Inspection')}
          </button>
          {showScore && (
            <>
              <div className="space-y-3 mb-4 text-sm">
                <SectionLabel>{lang === 'ar' ? 'تسجيل FastBot' : 'FastBot Scoring'}</SectionLabel>
                <div className="flex justify-between bg-ink-50 p-2.5 rounded-xl font-semibold text-ink-700 text-sm"><span>{lang === 'ar' ? 'الدورات المطلوبة:' : 'Required laps:'}</span><span>{minLaps}</span></div>
                <PrecisionTimer
                  initialSeconds={180.00}
                  onStop={(elapsed) => { setElapsedFromTimer(elapsed); setData(d => ({ ...d, elapsedTime: elapsed })); }}
                  disabled={disabled}
                  disableControls={!disabled}
                  lang={lang}
                />
                <Check label={lang === 'ar' ? 'هل أكمل الروبوت الدورات المطلوبة؟' : 'Did robot finish required laps?'} checked={data.finishedLaps} onChange={v => setData(d => ({ ...d, finishedLaps: v }))} disabled={disabled} />
                <Check label={lang === 'ar' ? 'هل لمس أحد أعضاء الفريق الروبوت؟' : 'Was robot touched by any team member?'} checked={data.touched} onChange={v => setData(d => ({ ...d, touched: v }))} disabled={disabled} danger />
                <Check label={lang === 'ar' ? 'هل تجاوز الروبوت 180 ثانية؟' : 'Did robot exceed 180 seconds?'} checked={data.exceeded180} onChange={v => setData(d => ({ ...d, exceeded180: v }))} disabled={disabled} danger />
                <div>
                  <label className="block text-xs text-ink-400 mb-1">{lang === 'ar' ? 'الوقت المنقضي (ثانية):' : 'Elapsed time (seconds):'}</label>
                  <input type="text" inputMode="decimal" value={data.elapsedTime} onChange={e => setData(d => ({ ...d, elapsedTime: e.target.value }))} disabled={disabled} className="w-full p-2.5 border-2 rounded-xl disabled:bg-ink-100 focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>

                {/* Photo capture — required for submission */}
                {!disabled && (
                  <div className={`rounded-xl border-2 p-4 transition-all ${photo ? 'border-saudi-300 bg-saudi-50/40' : 'border-rose-200 bg-rose-50/40'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2.5 ${photo ? 'text-saudi-700' : 'text-rose-600'}`}>
                      📷 {lang === 'ar' ? 'صورة النتيجة — مطلوبة' : 'Result Photo — Required'}
                    </p>
                    {photo ? (
                      <div className="flex items-center gap-3">
                        <img src={photo} alt="result" className="w-14 h-14 object-cover rounded-xl border-2 border-saudi-200" />
                        <div className="flex-1">
                          <p className="text-xs text-saudi-700 font-bold">{lang === 'ar' ? 'الصورة مرفوعة ✓' : 'Photo attached ✓'}</p>
                          <button onClick={() => setPhoto(null)} className="text-xs text-rose-500 underline mt-1">{lang === 'ar' ? 'حذف' : 'Remove'}</button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-rose-300 rounded-xl cursor-pointer hover:bg-rose-100/50 transition-colors">
                        <span className="text-sm font-bold text-rose-600">📷 {lang === 'ar' ? 'التقط صورة' : 'Take Photo'}</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    )}
                  </div>
                )}

                {/* Read-only submitted photo */}
                {disabled && photo && (
                  <div className="rounded-xl border border-saudi-200 p-3 bg-saudi-50">
                    <p className="text-[10px] font-black text-saudi-600 uppercase tracking-widest mb-2">📷 {lang === 'ar' ? 'الصورة المرسلة' : 'Submitted Photo'}</p>
                    <img src={photo} alt="submitted result" className="w-20 h-20 object-cover rounded-xl border-2 border-saudi-200" />
                  </div>
                )}

                <NotesField value={data.notes} onChange={v => setData(d => ({ ...d, notes: v }))} disabled={disabled} lang={lang} />
              </div>
              <ScoreResult label={lang === 'ar' ? 'النتيجة النهائية' : 'Final Score'} value={`${result.score.toFixed(2)}s`} warning={result.reason ? `${lang === 'ar' ? 'التغيير لـ180.00' : 'Forced to 180.00'}: ${result.reason}` : null} />
            </>
          )}

          {/* AWAITING_SUBMISSION: photo-gated submit */}
          {fsmState === 'AWAITING_SUBMISSION' && showScore && (
            <button
              onClick={() => { if (onSaveScore) onSaveScore(result.score, insp, { ...data, photo }); }}
              disabled={!photo}
              className="w-full font-bold py-4 px-4 rounded-2xl transition-all text-white flex items-center justify-center gap-2.5 press-effect text-sm tracking-wide bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg shadow-brand-600/25 disabled:from-ink-200 disabled:to-ink-300 disabled:text-ink-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {!photo ? (lang === 'ar' ? '📷 التقط صورة النتيجة أولاً' : '📷 Capture result photo first') : (lang === 'ar' ? 'إرسال النتيجة' : 'Submit Score')}
            </button>
          )}

          {/* EDIT_REQUESTED scoring: back + photo-gated submit */}
          {fsmState === 'EDIT_REQUESTED' && showScore && (
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setEditMode(null)}
                className="flex-none px-5 py-3.5 bg-ink-100 hover:bg-ink-200 text-ink-700 font-bold rounded-xl text-sm transition-colors border border-ink-200"
              >
                {lang === 'ar' ? '→ رجوع' : '← Back'}
              </button>
              <button
                onClick={() => { if (onEditRequest && initialScoreObj) { onEditRequest(initialScoreObj.id, result.score, insp, { ...data, photo }); setFsmState('PENDING_ADMIN'); setEditMode(null); } }}
                disabled={!photo}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-ink-200 disabled:text-ink-400 text-white font-bold rounded-xl text-sm transition-colors disabled:cursor-not-allowed"
              >
                {!photo ? (lang === 'ar' ? '📷 أضف صورة إثبات أولاً' : '📷 Add evidence photo first') : (lang === 'ar' ? 'إرسال التعديل للموافقة' : 'Submit Edit for Approval')}
              </button>
            </div>
          )}

          {/* SUBMITTED: Edit Requested button */}
          {fsmState === 'SUBMITTED' && showScore && (
            <button
              onClick={() => { setEditMode(null); setFsmState('EDIT_REQUESTED'); }}
              className="w-full font-bold py-4 px-4 rounded-xl transition-colors text-white flex items-center justify-center gap-2 press-effect text-base bg-amber-600 hover:bg-amber-700"
            >
              <Edit3 size={16} /> {lang === 'ar' ? 'طلب تعديل' : 'Edit Requested'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LineFollowingAttemptCard ────────────────────────────────────────────────

export function LineFollowingAttemptCard({ title, categoryId, teamDivision, attemptNumber, initialScoreObj, onSaveScore, onEditRequest, systemConfig, lang = 'en' }) {
  const initFSM = !initialScoreObj ? 'AWAITING_SUBMISSION'
    : initialScoreObj.status === 'VALID' ? 'SUBMITTED'
    : initialScoreObj.status === 'PENDING' ? 'PENDING_ADMIN' : 'AWAITING_SUBMISSION';

  const [fsmState, setFsmState] = useState(initFSM);
  const [insp, setInsp] = useState(initialScoreObj ? (initialScoreObj.proposedInspection || initialScoreObj.inspectionData || {}) : {});
  const maxBalls = systemConfig?.linefollowBalls?.[teamDivision] || { ES: 2, MS: 3, HS: 4, US: 5 }[teamDivision] || 2;
  const [step, setStep] = useState(initFSM !== 'AWAITING_SUBMISSION' ? 'scoring' : 'inspection');
  const [data, setData] = useState(initialScoreObj?.rawInput || {
    leavesHome: false, turns1stT: false, turns2ndT: false, reachTower: false,
    deliver1Ball: false, returnHome: false, bonusStart: false, bonus1stT: false,
    bonus2ndT: false, towerViolation: false, bonusBallsDelivered: 0, notes: ''
  });

  useEffect(() => {
    if (initialScoreObj) {
      setData(initialScoreObj.rawInput || data);
      setInsp(initialScoreObj.proposedInspection || initialScoreObj.inspectionData || {});
      if (initialScoreObj.status === 'VALID') setFsmState('SUBMITTED');
      else if (initialScoreObj.status === 'PENDING') setFsmState('PENDING_ADMIN');
    }
  }, [initialScoreObj]);

  const isInitial = attemptNumber === 1;
  const isInspectionPassed = getInspectionStatus(categoryId, isInitial, insp);
  const disabled = fsmState === 'SUBMITTED' || fsmState === 'PENDING_ADMIN';

  const isNAt1 = teamDivision === 'ES';
  const isNAt2 = ['ES', 'MS'].includes(teamDivision);
  const effTurns1stT = isNAt1 ? true : data.turns1stT;
  const effTurns2ndT = isNAt2 ? true : data.turns2ndT;
  const effBonus1stT = isNAt1 ? true : data.bonus1stT;
  const effBonus2ndT = isNAt2 ? true : data.bonus2ndT;

  const calculateScores = () => {
    let base = 0;
    if (data.leavesHome) base += (teamDivision === 'ES' ? 50 : 25);
    if (effTurns1stT && !isNAt1) base += 25;
    if (effTurns2ndT && !isNAt2) base += 25;
    if (data.reachTower) base += (['ES', 'MS'].includes(teamDivision) ? 100 : 50);
    if (data.deliver1Ball) base += 100;
    if (data.returnHome) base += 100;
    const successfulBaseRun = data.leavesHome && effTurns1stT && effTurns2ndT && data.reachTower && data.deliver1Ball && data.returnHome;
    let bonusBalls = 0, bonusCheckpoints = 0;
    const D = parseInt(data.bonusBallsDelivered || 0);
    if (successfulBaseRun) {
      if (D < maxBalls) bonusBalls = D;
      else if (D === maxBalls) bonusBalls = maxBalls;
      else bonusBalls = Math.max(0, maxBalls - (D - maxBalls));
      if (data.bonusStart) bonusCheckpoints += (teamDivision === 'ES' ? 50 : 25);
      if (effBonus1stT && !isNAt1) bonusCheckpoints += 25;
      if (effBonus2ndT && !isNAt2) bonusCheckpoints += 25;
    }
    let final = base + bonusBalls + bonusCheckpoints;
    if (data.towerViolation) final = 400;
    return { base, bonusBalls, bonusCheckpoints, total: bonusBalls + bonusCheckpoints, final, successfulBaseRun };
  };
  const res = calculateScores();

  const handleAction = () => {
    if (fsmState === 'AWAITING_SUBMISSION') { if (onSaveScore) onSaveScore(res.final, insp, data); }
    else if (fsmState === 'SUBMITTED') { setFsmState('EDIT_REQUESTED'); }
    else if (fsmState === 'EDIT_REQUESTED') { if (onEditRequest && initialScoreObj) { onEditRequest(initialScoreObj.id, res.final, insp, data); setFsmState('PENDING_ADMIN'); } }
  };
  const showScore = isInspectionPassed || fsmState !== 'AWAITING_SUBMISSION';

  return (
    <div className={`scoring-card ${isInspectionPassed ? 'scoring-card-active' : 'border-ink-200'} animate-slide-up`}>
      <div className="p-4 sm:p-5 pb-3 sm:pb-4">
        <CardHeader title={title} inspPassed={isInspectionPassed} lang={lang} />
        {fsmState === 'PENDING_ADMIN' && <PendingBanner lang={lang} />}
      </div>
      {step === 'inspection' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <CategoryInspectionUI categoryId={categoryId} isInitial={isInitial} insp={insp} updateInsp={(k, v) => setInsp(p => ({ ...p, [k]: v }))} disabled={disabled} lang={lang} />
          {isInspectionPassed && (
            <button onClick={() => setStep('scoring')} className="w-full mt-3 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
              {lang === 'ar' ? 'التالي: التسجيل ←' : 'Next: Scoring →'}
            </button>
          )}
        </div>
      )}
      {step === 'scoring' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <button onClick={() => setStep('inspection')} className="w-full mb-4 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors border border-ink-200">
            {lang === 'ar' ? '→' : '←'} {isInspectionPassed ? (lang === 'ar' ? 'الفحص ✓ — اضغط للمراجعة' : 'Inspection ✓ — tap to review') : (lang === 'ar' ? 'رجوع للفحص' : 'Back to Inspection')}
          </button>
          {showScore && (
            <>
              <div className="space-y-2 mb-4 text-sm">
                <SectionLabel>{lang === 'ar' ? 'تسجيل LineFollowing' : 'LineFollowing Scoring'}</SectionLabel>
                <div className="flex justify-between bg-ink-50 p-2.5 rounded-xl font-semibold text-ink-700"><span>{lang === 'ar' ? 'الكرات المطلوبة:' : 'Required balls:'}</span><span>{maxBalls}</span></div>
                <PrecisionTimer initialSeconds={180.00} onStop={() => {}} disabled={disabled} lang={lang} />
                <SectionLabel sub>{lang === 'ar' ? 'الجولة الأساسية' : 'Base Run'}</SectionLabel>
                <Check label={lang === 'ar' ? 'هل غادر الروبوت البداية؟' : 'Did robot leaves home?'} checked={data.leavesHome} onChange={v => setData(d => ({ ...d, leavesHome: v }))} disabled={disabled} />
                <Check label={`${lang === 'ar' ? 'دوران عند "T" الأولى؟' : 'Turns at 1st "T"?'} ${isNAt1 ? '(N/A)' : ''}`} checked={effTurns1stT} onChange={v => setData(d => ({ ...d, turns1stT: v }))} disabled={disabled || isNAt1} />
                <Check label={`${lang === 'ar' ? 'دوران عند "T" الثانية؟' : 'Turns at 2nd "T"?'} ${isNAt2 ? '(N/A)' : ''}`} checked={effTurns2ndT} onChange={v => setData(d => ({ ...d, turns2ndT: v }))} disabled={disabled || isNAt2} />
                <Check label={lang === 'ar' ? 'هل وصل إلى البرج؟' : 'Reach the tower?'} checked={data.reachTower} onChange={v => setData(d => ({ ...d, reachTower: v }))} disabled={disabled} />
                <Check label={lang === 'ar' ? 'هل سلّم كرة أو أكثر في الرحلة الأولى؟' : 'Deliver ≥1 ball on first trip?'} checked={data.deliver1Ball} onChange={v => setData(d => ({ ...d, deliver1Ball: v }))} disabled={disabled} />
                <Check label={lang === 'ar' ? 'هل عاد للبداية بعد التسليم؟' : 'Return home after first delivery?'} checked={data.returnHome} onChange={v => setData(d => ({ ...d, returnHome: v }))} disabled={disabled} />
                <p className="text-xs font-bold text-ink-400">{lang === 'ar' ? 'جولة أساسية ناجحة:' : 'Successful base run:'} {res.successfulBaseRun ? (lang === 'ar' ? '✓ نعم' : '✓ Yes') : (lang === 'ar' ? '✗ لا' : '✗ No')}</p>
                <SectionLabel sub>{lang === 'ar' ? 'جولات الكرات الإضافية' : 'Bonus Ball Runs'}</SectionLabel>
                <Check label={lang === 'ar' ? 'بدأ من البداية مرة أخرى؟' : 'Starts back from home?'} checked={data.bonusStart} onChange={v => setData(d => ({ ...d, bonusStart: v }))} disabled={disabled} />
                <Check label={`${lang === 'ar' ? 'دوران عند "T" الأولى؟' : 'Turns at 1st "T"?'} ${isNAt1 ? '(N/A)' : ''}`} checked={effBonus1stT} onChange={v => setData(d => ({ ...d, bonus1stT: v }))} disabled={disabled || isNAt1} />
                <Check label={`${lang === 'ar' ? 'دوران عند "T" الثانية؟' : 'Turns at 2nd "T"?'} ${isNAt2 ? '(N/A)' : ''}`} checked={effBonus2ndT} onChange={v => setData(d => ({ ...d, bonus2ndT: v }))} disabled={disabled || isNAt2} />
                <SectionLabel sub>{lang === 'ar' ? 'قواعد عامة' : 'General Rules'}</SectionLabel>
                <Check label={lang === 'ar' ? 'هل لمس أحد البرج؟' : 'Did any person touch or reach into the tower?'} checked={data.towerViolation} onChange={v => setData(d => ({ ...d, towerViolation: v }))} disabled={disabled} danger />
                <div>
                  <label className="block text-xs text-ink-400 mb-1">{lang === 'ar' ? 'الكرات الإضافية المسلّمة بعد الجولة الناجحة:' : 'Bonus balls delivered after successful base run:'}</label>
                  <input type="text" inputMode="numeric" value={data.bonusBallsDelivered} onChange={e => setData(d => ({ ...d, bonusBallsDelivered: e.target.value }))} disabled={disabled} className="w-full p-2.5 border-2 rounded-xl disabled:bg-ink-100 focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <NotesField value={data.notes} onChange={v => setData(d => ({ ...d, notes: v }))} disabled={disabled} lang={lang} />
              </div>
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl mb-4 text-sm space-y-1">
                <div className="text-ink-600">{lang === 'ar' ? 'أساسي' : 'Base'}: {res.base} | {lang === 'ar' ? 'نقاط إضافية' : 'Bonus Checkpoints'}: {res.bonusCheckpoints} | {lang === 'ar' ? 'كرات إضافية' : 'Bonus Balls'}: {res.bonusBalls}</div>
                <div className="font-black text-brand-800 text-xl">{lang === 'ar' ? 'النتيجة النهائية' : 'Final Score'}: {res.final}</div>
                {!res.successfulBaseRun && data.bonusBallsDelivered > 0 && <div className="text-amber-600 text-xs font-bold">{lang === 'ar' ? 'تحذير: الكرات الإضافية تم تجاهلها — الجولة الأساسية غير مكتملة.' : 'Warning: Bonus balls ignored — base run not complete.'}</div>}
                {data.towerViolation && <div className="text-rose-600 text-xs font-bold">{lang === 'ar' ? 'تحذير: النتيجة محسوبة بـ400 (مخالفة البرج).' : 'Warning: Score capped at 400 (tower violation).'}</div>}
              </div>
            </>
          )}
          <FsmButton fsmState={fsmState} onAction={handleAction} showScore={showScore} lang={lang} />
        </div>
      )}
    </div>
  );
}

// ─── AMazeIngAttemptCard ─────────────────────────────────────────────────────

export function AMazeIngAttemptCard({ title, categoryId, teamDivision, attemptNumber, initialScoreObj, onSaveScore, onEditRequest, lang = 'en' }) {
  const initFSM = !initialScoreObj ? 'AWAITING_SUBMISSION'
    : initialScoreObj.status === 'VALID' ? 'SUBMITTED'
    : initialScoreObj.status === 'PENDING' ? 'PENDING_ADMIN' : 'AWAITING_SUBMISSION';

  const [fsmState, setFsmState] = useState(initFSM);
  const [insp, setInsp] = useState(initialScoreObj ? (initialScoreObj.proposedInspection || initialScoreObj.inspectionData || {}) : {});
  const maxS = teamDivision === 'ES' ? 4 : (teamDivision === 'MS' ? 6 : 8);
  const maxA = teamDivision === 'ES' ? 3 : (teamDivision === 'MS' ? 5 : 7);
  const [data, setData] = useState(initialScoreObj?.rawInput || { completedStraights: 0, completedAngles: 0, notes: '' });
  const [remainingFromTimer, setRemainingFromTimer] = useState(0);
  const [step, setStep] = useState(initFSM !== 'AWAITING_SUBMISSION' ? 'scoring' : 'inspection');

  useEffect(() => {
    if (initialScoreObj) {
      setData(initialScoreObj.rawInput || data);
      setInsp(initialScoreObj.proposedInspection || initialScoreObj.inspectionData || {});
      if (initialScoreObj.status === 'VALID') setFsmState('SUBMITTED');
      else if (initialScoreObj.status === 'PENDING') setFsmState('PENDING_ADMIN');
    }
  }, [initialScoreObj]);

  const isInitial = attemptNumber === 1;
  const isInspectionPassed = getInspectionStatus(categoryId, isInitial, insp);
  const disabled = fsmState === 'SUBMITTED' || fsmState === 'PENDING_ADMIN';

  const isFull = data.completedStraights >= maxS && data.completedAngles >= maxA;
  const baseScore = (Math.min(data.completedStraights, maxS) * 50) + (Math.min(data.completedAngles, maxA) * 100);
  const timeBonus = isFull ? Math.floor(remainingFromTimer) : 0;
  const finalScore = baseScore + timeBonus;

  const handleAction = () => {
    if (fsmState === 'AWAITING_SUBMISSION') { if (onSaveScore) onSaveScore(finalScore, insp, data); }
    else if (fsmState === 'SUBMITTED') { setFsmState('EDIT_REQUESTED'); }
    else if (fsmState === 'EDIT_REQUESTED') { if (onEditRequest && initialScoreObj) { onEditRequest(initialScoreObj.id, finalScore, insp, data); setFsmState('PENDING_ADMIN'); } }
  };
  const showScore = isInspectionPassed || fsmState !== 'AWAITING_SUBMISSION';

  return (
    <div className={`scoring-card ${isInspectionPassed ? 'scoring-card-active' : 'border-ink-200'} animate-slide-up`}>
      <div className="p-4 sm:p-5 pb-3 sm:pb-4">
        <CardHeader title={title} inspPassed={isInspectionPassed} lang={lang} />
        {fsmState === 'PENDING_ADMIN' && <PendingBanner lang={lang} />}
      </div>
      {step === 'inspection' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <CategoryInspectionUI categoryId={categoryId} isInitial={isInitial} insp={insp} updateInsp={(k, v) => setInsp(p => ({ ...p, [k]: v }))} disabled={disabled} lang={lang} />
          {isInspectionPassed && (
            <button onClick={() => setStep('scoring')} className="w-full mt-3 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
              {lang === 'ar' ? 'التالي: التسجيل ←' : 'Next: Scoring →'}
            </button>
          )}
        </div>
      )}
      {step === 'scoring' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <button onClick={() => setStep('inspection')} className="w-full mb-4 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors border border-ink-200">
            {lang === 'ar' ? '→' : '←'} {isInspectionPassed ? (lang === 'ar' ? 'الفحص ✓ — اضغط للمراجعة' : 'Inspection ✓ — tap to review') : (lang === 'ar' ? 'رجوع للفحص' : 'Back to Inspection')}
          </button>
          {showScore && (
            <>
              <div className="space-y-3 mb-4 text-sm">
                <SectionLabel>{lang === 'ar' ? 'تسجيل a-Maze-ing' : 'A-Maze-ing Scoring'}</SectionLabel>
                <PrecisionTimer initialSeconds={120.00} onStop={(_el, rem) => setRemainingFromTimer(parseFloat(rem))} disabled={disabled} lang={lang} />
                <div>
                  <label className="block text-xs text-ink-400 mb-1">{lang === 'ar' ? `الأقسام المستقيمة المكتملة (الحد الأقصى ${maxS}):` : `Completed straight sections (max ${maxS}):`}</label>
                  <input type="text" inputMode="numeric" value={data.completedStraights} onChange={e => setData(d => ({ ...d, completedStraights: parseInt(e.target.value) || 0 }))} disabled={disabled} className="w-full p-2.5 border-2 rounded-xl disabled:bg-ink-100 focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-ink-400 mb-1">{lang === 'ar' ? `الأقسام المنحنية المكتملة (الحد الأقصى ${maxA}):` : `Completed angled sections (max ${maxA}):`}</label>
                  <input type="text" inputMode="numeric" value={data.completedAngles} onChange={e => setData(d => ({ ...d, completedAngles: parseInt(e.target.value) || 0 }))} disabled={disabled} className="w-full p-2.5 border-2 rounded-xl disabled:bg-ink-100 focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <p className="text-xs font-bold text-ink-400">{lang === 'ar' ? 'إكمال المتاهة الكاملة:' : 'Full Maze Completed:'} {isFull ? (lang === 'ar' ? '✓ نعم' : '✓ Yes') : (lang === 'ar' ? '✗ لا' : '✗ No')}</p>
                <NotesField value={data.notes} onChange={v => setData(d => ({ ...d, notes: v }))} disabled={disabled} lang={lang} />
              </div>
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl mb-4 text-sm space-y-1">
                <div className="text-ink-600">{lang === 'ar' ? 'أساسي' : 'Base'}: {baseScore} | {lang === 'ar' ? 'مكافأة وقتية' : 'Time Bonus'}: {timeBonus}</div>
                <div className="font-black text-brand-800 text-xl">{lang === 'ar' ? 'النتيجة النهائية' : 'Final Score'}: {finalScore}</div>
              </div>
            </>
          )}
          <FsmButton fsmState={fsmState} onAction={handleAction} showScore={showScore} lang={lang} />
        </div>
      )}
    </div>
  );
}

// ─── SumoMatchCard ───────────────────────────────────────────────────────────

export function SumoMatchCard({ title, match, categoryId, attemptNumber, initialScoreObj, onSaveScore, onEditRequest, lang = 'en' }) {
  const initFSM = !initialScoreObj ? 'AWAITING_SUBMISSION'
    : initialScoreObj.status === 'VALID' ? 'SUBMITTED'
    : initialScoreObj.status === 'PENDING' ? 'PENDING_ADMIN' : 'AWAITING_SUBMISSION';

  const [fsmState, setFsmState] = useState(initFSM);
  const [inspA, setInspA] = useState(initialScoreObj ? (initialScoreObj.proposedInspectionA || initialScoreObj.inspectionA || {}) : {});
  const [inspB, setInspB] = useState(initialScoreObj ? (initialScoreObj.proposedInspectionB || initialScoreObj.inspectionB || {}) : {});
  const [data, setData] = useState(initialScoreObj?.rawInput || { showA: false, showB: false, r1: null, r2: null, r3: null, notes: '' });
  const [step, setStep] = useState(initFSM !== 'AWAITING_SUBMISSION' ? 'scoring' : 'inspection');

  useEffect(() => {
    if (initialScoreObj) {
      setData(initialScoreObj.rawInput || data);
      setInspA(initialScoreObj.proposedInspectionA || initialScoreObj.inspectionA || {});
      setInspB(initialScoreObj.proposedInspectionB || initialScoreObj.inspectionB || {});
      if (initialScoreObj.status === 'VALID') setFsmState('SUBMITTED');
      else if (initialScoreObj.status === 'PENDING') setFsmState('PENDING_ADMIN');
    }
  }, [initialScoreObj]);

  const isInitial = attemptNumber === 1;
  const passA = getInspectionStatus(categoryId, isInitial, inspA);
  const passB = getInspectionStatus(categoryId, isInitial, inspB);
  const isInspectionPassed = passA && passB;
  const forfeitWinA = passA && !passB;
  const forfeitWinB = !passA && passB;
  const isForfeit = forfeitWinA || forfeitWinB;
  const forfeitWinner = forfeitWinA ? match.teamA : forfeitWinB ? match.teamB : null;
  const disabled = fsmState === 'SUBMITTED' || fsmState === 'PENDING_ADMIN';

  const scoreA = [data.r1, data.r2, data.r3].reduce((acc, v) => acc + (v === 'A' ? 3 : v === 'Draw' ? 1 : 0), 0);
  const scoreB = [data.r1, data.r2, data.r3].reduce((acc, v) => acc + (v === 'B' ? 3 : v === 'Draw' ? 1 : 0), 0);
  const winsA = [data.r1, data.r2, data.r3].filter(v => v === 'A').length;
  const winsB = [data.r1, data.r2, data.r3].filter(v => v === 'B').length;

  let matchWinner = lang === 'ar' ? 'قيد اللعب' : 'Ongoing';
  if (!data.showA && data.showB) matchWinner = match.teamB;
  else if (data.showA && !data.showB) matchWinner = match.teamA;
  else if (!data.showA && !data.showB) matchWinner = lang === 'ar' ? 'لا أحد' : 'Neither';
  else if (winsA >= 2) matchWinner = match.teamA;
  else if (winsB >= 2) matchWinner = match.teamB;

  const handleForfeitSubmit = () => {
    const forfeitScore = forfeitWinA ? 'W - L (Forfeit)' : 'L - W (Forfeit)';
    if (onSaveScore) onSaveScore(forfeitScore, inspA, inspB, { ...data, forfeit: true, forfeitWinner });
  };

  const handleAction = () => {
    if (fsmState === 'AWAITING_SUBMISSION') { if (onSaveScore) onSaveScore(`${scoreA} - ${scoreB}`, inspA, inspB, data); }
    else if (fsmState === 'SUBMITTED') { setFsmState('EDIT_REQUESTED'); }
    else if (fsmState === 'EDIT_REQUESTED') { if (onEditRequest && initialScoreObj) onEditRequest(initialScoreObj.id, `${scoreA} - ${scoreB}`, inspA, inspB, data); }
  };
  const showScore = isInspectionPassed || fsmState !== 'AWAITING_SUBMISSION';

  const RoundRow = ({ val, field }) => (
    <div className="flex gap-2 mb-2">
      {[match.teamA, match.teamB, lang === 'ar' ? 'تعادل' : 'Draw'].map(opt => {
        const drawLabel = lang === 'ar' ? 'تعادل' : 'Draw';
        const key = opt === match.teamA ? 'A' : opt === match.teamB ? 'B' : 'Draw';
        return (
          <button key={opt} onClick={() => setData(d => ({ ...d, [field]: key }))} disabled={disabled}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${val === key ? 'bg-saudi-500 text-white' : val ? 'bg-red-400/30 text-ink-600' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'} disabled:opacity-50`}>
            {opt}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`scoring-card ${isInspectionPassed || isForfeit ? 'scoring-card-active' : 'border-ink-200'} animate-slide-up`}>
      <div className="p-4 sm:p-5 pb-3 sm:pb-4">
        <CardHeader title={title} inspPassed={isInspectionPassed || isForfeit} matchReady lang={lang} />
        {fsmState === 'PENDING_ADMIN' && <PendingBanner lang={lang} />}
      </div>
      {step === 'inspection' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <TeamInspPanel label={`${lang === 'ar' ? 'الفريق أ' : 'Team A'}: ${match.teamA}`} pass={passA} categoryId={categoryId} isInitial={isInitial} insp={inspA} setInsp={setInspA} disabled={disabled} lang={lang} />
            <TeamInspPanel label={`${lang === 'ar' ? 'الفريق ب' : 'Team B'}: ${match.teamB}`} pass={passB} categoryId={categoryId} isInitial={isInitial} insp={inspB} setInsp={setInspB} disabled={disabled} lang={lang} />
          </div>

          {/* Forfeit win — one team passed, one failed */}
          {isForfeit && fsmState === 'AWAITING_SUBMISSION' && (
            <div className="mt-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-1">{lang === 'ar' ? 'فوز بالفحص' : 'Inspection Forfeit'}</p>
              <p className="font-bold text-amber-900 text-sm mb-1">
                <span className="text-rose-600">{forfeitWinA ? match.teamB : match.teamA}</span> {lang === 'ar' ? 'رسب في الفحص.' : 'failed inspection.'}
              </p>
              <p className="font-black text-saudi-700 text-base mb-3">
                🏆 {forfeitWinner} {lang === 'ar' ? 'فاز بالفحص' : 'wins by forfeit'}
              </p>
              <button
                onClick={handleForfeitSubmit}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow shadow-amber-500/20"
              >
                {lang === 'ar' ? 'إرسال الفوز بالفحص' : 'Submit Forfeit Win'} — {forfeitWinner}
              </button>
            </div>
          )}

          {/* Both teams passed — proceed to scoring */}
          {isInspectionPassed && (
            <button onClick={() => setStep('scoring')} className="w-full mt-3 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
              {lang === 'ar' ? 'التالي: التسجيل ←' : 'Next: Scoring →'}
            </button>
          )}
        </div>
      )}
      {step === 'scoring' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <button onClick={() => setStep('inspection')} className="w-full mb-4 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors border border-ink-200">
            {lang === 'ar' ? '→' : '←'} {isInspectionPassed ? (lang === 'ar' ? 'الفحص ✓ — اضغط للمراجعة' : 'Inspection ✓ — tap to review') : (lang === 'ar' ? 'رجوع للفحص' : 'Back to Inspection')}
          </button>
          {showScore && (
            <>
              <div className="space-y-3 mb-4 text-sm">
                <SectionLabel>{lang === 'ar' ? 'تسجيل مباراة Sumo' : 'Sumo Match Scoring'}</SectionLabel>
                <div className="flex flex-wrap gap-4">
                  <Check label={`${match.teamA} ${lang === 'ar' ? 'حضر؟' : 'showed up?'}`} checked={data.showA} onChange={v => setData(d => ({ ...d, showA: v }))} disabled={disabled} />
                  <Check label={`${match.teamB} ${lang === 'ar' ? 'حضر؟' : 'showed up?'}`} checked={data.showB} onChange={v => setData(d => ({ ...d, showB: v }))} disabled={disabled} />
                </div>
                <PrecisionTimer initialSeconds={300.00} onStop={() => {}} disabled={disabled} lang={lang} />
                <div className="bg-ink-50 p-3 rounded-xl border">
                  <p className="font-bold text-ink-600 text-xs uppercase mb-2 tracking-wider">{lang === 'ar' ? 'فائزو الجولات' : 'Round Winners'}</p>
                  <RoundRow val={data.r1} field="r1" />
                  <RoundRow val={data.r2} field="r2" />
                  <RoundRow val={data.r3} field="r3" />
                </div>
                <NotesField value={data.notes} onChange={v => setData(d => ({ ...d, notes: v }))} disabled={disabled} lang={lang} />
              </div>
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl mb-4">
                <div className="flex justify-between font-bold text-ink-600 text-sm mb-1">
                  <span>{match.teamA}: {scoreA} {lang === 'ar' ? 'نقطة' : 'pts'}</span>
                  <span>{match.teamB}: {scoreB} {lang === 'ar' ? 'نقطة' : 'pts'}</span>
                </div>
                <div className="font-black text-brand-800 text-lg">{lang === 'ar' ? 'الفائز بالمباراة' : 'Match Winner'}: {matchWinner}</div>
              </div>
            </>
          )}
          <FsmButton fsmState={fsmState} onAction={handleAction} showScore={showScore} lang={lang} />
        </div>
      )}
    </div>
  );
}

// ─── SoccerBotMatchCard ──────────────────────────────────────────────────────

export function SoccerBotMatchCard({ title, match, categoryId, attemptNumber, initialScoreObj, onSaveScore, onEditRequest, lang = 'en' }) {
  const initFSM = !initialScoreObj ? 'AWAITING_SUBMISSION'
    : initialScoreObj.status === 'VALID' ? 'SUBMITTED'
    : initialScoreObj.status === 'PENDING' ? 'PENDING_ADMIN' : 'AWAITING_SUBMISSION';

  const [fsmState, setFsmState] = useState(initFSM);
  const [inspA, setInspA] = useState(initialScoreObj ? (initialScoreObj.proposedInspectionA || initialScoreObj.inspectionA || {}) : {});
  const [inspB, setInspB] = useState(initialScoreObj ? (initialScoreObj.proposedInspectionB || initialScoreObj.inspectionB || {}) : {});
  const [data, setData] = useState(initialScoreObj?.rawInput || { showA: false, showB: false, unableA: false, unableB: false, goalsA: 0, goalsB: 0, notes: '' });
  // Inspection is now OPTIONAL and fully decoupled from scoring. Default to the
  // Scoring tab so referees can record results immediately. They can switch to
  // the Inspection tab at any time to fill it in (its data is saved alongside
  // the score on submit, so an inspection-only or scoring-only flow both work).
  const [step, setStep] = useState('scoring');

  useEffect(() => {
    if (initialScoreObj) {
      setData(initialScoreObj.rawInput || data);
      setInspA(initialScoreObj.proposedInspectionA || initialScoreObj.inspectionA || {});
      setInspB(initialScoreObj.proposedInspectionB || initialScoreObj.inspectionB || {});
      if (initialScoreObj.status === 'VALID') setFsmState('SUBMITTED');
      else if (initialScoreObj.status === 'PENDING') setFsmState('PENDING_ADMIN');
    }
  }, [initialScoreObj]);

  const isInitial = attemptNumber === 1;
  const passA = getInspectionStatus(categoryId, isInitial, inspA);
  const passB = getInspectionStatus(categoryId, isInitial, inspB);
  const isInspectionPassed = passA && passB;
  const disabled = fsmState === 'SUBMITTED' || fsmState === 'PENDING_ADMIN';

  const calculate = () => {
    let ptsA = 0, ptsB = 0, res = '';
    const fA = match.teamA, fB = match.teamB;
    if (lang === 'ar') {
      if (!data.showA && !data.showB) { ptsA = 0; ptsB = 0; res = 'لم يحضر أي فريق.'; }
      else if (!data.showA) { ptsA = 0; ptsB = 3; res = `${fB} فاز بالغياب.`; }
      else if (!data.showB) { ptsA = 3; ptsB = 0; res = `${fA} فاز بالغياب.`; }
      else if (data.unableA && data.unableB) { ptsA = 0; ptsB = 0; res = 'الفريقان عاجزان عن الاستمرار.'; }
      else if (data.unableA) { ptsA = 0; ptsB = 3; res = `${fB} فاز (عطل الخصم).`; }
      else if (data.unableB) { ptsA = 3; ptsB = 0; res = `${fA} فاز (عطل الخصم).`; }
      else if (data.goalsA > data.goalsB) { ptsA = 3; ptsB = 0; res = `${fA} فاز بالأهداف.`; }
      else if (data.goalsB > data.goalsA) { ptsA = 0; ptsB = 3; res = `${fB} فاز بالأهداف.`; }
      else { ptsA = 1; ptsB = 1; res = 'انتهت المباراة بالتعادل.'; }
    } else {
      if (!data.showA && !data.showB) { ptsA = 0; ptsB = 0; res = 'Neither team appeared.'; }
      else if (!data.showA) { ptsA = 0; ptsB = 3; res = `${fB} wins by forfeit.`; }
      else if (!data.showB) { ptsA = 3; ptsB = 0; res = `${fA} wins by forfeit.`; }
      else if (data.unableA && data.unableB) { ptsA = 0; ptsB = 0; res = 'Both teams unable to continue.'; }
      else if (data.unableA) { ptsA = 0; ptsB = 3; res = `${fB} wins (opponent damage).`; }
      else if (data.unableB) { ptsA = 3; ptsB = 0; res = `${fA} wins (opponent damage).`; }
      else if (data.goalsA > data.goalsB) { ptsA = 3; ptsB = 0; res = `${fA} wins by goals.`; }
      else if (data.goalsB > data.goalsA) { ptsA = 0; ptsB = 3; res = `${fB} wins by goals.`; }
      else { ptsA = 1; ptsB = 1; res = 'Match ended in a draw.'; }
    }
    return { ptsA, ptsB, res };
  };
  const result = calculate();

  const handleAction = () => {
    if (fsmState === 'AWAITING_SUBMISSION') { if (onSaveScore) onSaveScore(`${result.ptsA} - ${result.ptsB}`, inspA, inspB, data); }
    else if (fsmState === 'SUBMITTED') { setFsmState('EDIT_REQUESTED'); }
    else if (fsmState === 'EDIT_REQUESTED') { if (onEditRequest && initialScoreObj) { onEditRequest(initialScoreObj.id, `${result.ptsA} - ${result.ptsB}`, inspA, inspB, data); setFsmState('PENDING_ADMIN'); } }
  };

  // Scoring is ALWAYS available regardless of inspection status (req. #3).
  const showScore = true;
  const inspectionTouched = Object.keys(inspA).length > 0 || Object.keys(inspB).length > 0;

  return (
    <div className={`scoring-card ${isInspectionPassed ? 'scoring-card-active' : 'border-ink-200'} animate-slide-up`}>
      <div className="p-4 sm:p-5 pb-3 sm:pb-4">
        <CardHeader title={title} inspPassed={isInspectionPassed} matchReady lang={lang} />
        {fsmState === 'PENDING_ADMIN' && <PendingBanner lang={lang} />}
      </div>

      {/* Tab switcher: Inspection (optional) | Scoring (always available) */}
      <div className="px-4 sm:px-5 -mt-1 mb-3">
        <div className="grid grid-cols-2 gap-2 p-1 bg-ink-100 rounded-xl">
          <button
            type="button"
            onClick={() => setStep('inspection')}
            className={`py-2 rounded-lg text-xs font-black transition-colors ${
              step === 'inspection'
                ? 'bg-white text-ink-800 shadow-sm border border-ink-200'
                : 'bg-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            🔍 {lang === 'ar' ? 'الفحص' : 'Inspection'}
            {inspectionTouched && (
              <span className={`ms-1.5 inline-block w-2 h-2 rounded-full ${isInspectionPassed ? 'bg-saudi-500' : 'bg-amber-500'}`} />
            )}
            <span className="ms-1 text-[9px] font-bold uppercase tracking-wider text-ink-400">
              {lang === 'ar' ? 'اختياري' : 'Optional'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStep('scoring')}
            className={`py-2 rounded-lg text-xs font-black transition-colors ${
              step === 'scoring'
                ? 'bg-white text-ink-800 shadow-sm border border-ink-200'
                : 'bg-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            🏆 {lang === 'ar' ? 'التسجيل' : 'Scoring'}
          </button>
        </div>
      </div>

      {step === 'inspection' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <TeamInspPanel label={`${lang === 'ar' ? 'الفريق أ' : 'Team A'}: ${match.teamA}`} pass={passA} categoryId={categoryId} isInitial={isInitial} insp={inspA} setInsp={setInspA} disabled={disabled} lang={lang} />
            <TeamInspPanel label={`${lang === 'ar' ? 'الفريق ب' : 'Team B'}: ${match.teamB}`} pass={passB} categoryId={categoryId} isInitial={isInitial} insp={inspB} setInsp={setInspB} disabled={disabled} lang={lang} />
          </div>
          <div className="mt-3 p-3 rounded-xl bg-ink-50 border border-ink-200 text-[11px] text-ink-600 leading-relaxed">
            {lang === 'ar'
              ? 'الفحص اختياري ولا يمنع تسجيل النتيجة. يتم حفظ نتيجة الفحص تلقائياً عند حفظ النتيجة.'
              : 'Inspection is optional and does not block scoring. Results are saved alongside the match score when you submit.'}
          </div>
        </div>
      )}

      {step === 'scoring' && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {showScore && (
            <>
              <div className="space-y-3 mb-4 text-sm">
                <SectionLabel>{lang === 'ar' ? 'تسجيل مباراة SoccerBot' : 'SoccerBot Match Scoring'}</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <Check label={`${match.teamA} ${lang === 'ar' ? 'حضر؟' : 'showed up?'}`} checked={data.showA} onChange={v => setData(d => ({ ...d, showA: v }))} disabled={disabled} />
                  <Check label={`${match.teamB} ${lang === 'ar' ? 'حضر؟' : 'showed up?'}`} checked={data.showB} onChange={v => setData(d => ({ ...d, showB: v }))} disabled={disabled} />
                </div>
                <PrecisionTimer initialSeconds={180.00} isSoccerBot={true} onStop={() => {}} disabled={disabled} lang={lang} />
                <div className="grid grid-cols-2 gap-3">
                  <Check label={`${match.teamA} ${lang === 'ar' ? 'عاجز عن الاستمرار؟' : 'Unable To Continue?'}`} checked={data.unableA} onChange={v => setData(d => ({ ...d, unableA: v }))} disabled={disabled} danger />
                  <Check label={`${match.teamB} ${lang === 'ar' ? 'عاجز عن الاستمرار؟' : 'Unable To Continue?'}`} checked={data.unableB} onChange={v => setData(d => ({ ...d, unableB: v }))} disabled={disabled} danger />
                </div>
                <div className="grid grid-cols-2 gap-4 bg-ink-50 p-4 rounded-xl border">
                  <GoalsCounter label={`${match.teamA} ${lang === 'ar' ? 'أهداف' : 'Goals'}`} value={data.goalsA} onChange={v => setData(d => ({ ...d, goalsA: v }))} disabled={disabled} />
                  <GoalsCounter label={`${match.teamB} ${lang === 'ar' ? 'أهداف' : 'Goals'}`} value={data.goalsB} onChange={v => setData(d => ({ ...d, goalsB: v }))} disabled={disabled} />
                </div>
                <NotesField value={data.notes} onChange={v => setData(d => ({ ...d, notes: v }))} disabled={disabled} lang={lang} />
              </div>
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl mb-4">
                <div className="font-black text-brand-800 text-lg mb-1">{lang === 'ar' ? 'النتيجة' : 'Result'}: {result.res}</div>
                <div className="flex justify-between font-bold text-ink-600 text-sm">
                  <span>{match.teamA}: {result.ptsA} {lang === 'ar' ? 'نقطة' : 'pts'}</span>
                  <span>{match.teamB}: {result.ptsB} {lang === 'ar' ? 'نقطة' : 'pts'}</span>
                </div>
              </div>
            </>
          )}
          <FsmButton fsmState={fsmState} onAction={handleAction} showScore={showScore} lang={lang} />
        </div>
      )}
    </div>
  );
}

// ─── ScoringCard (Group 3 / AI) ───────────────────────────────────────────────

export function ScoringCard({ title, initialScoreObj, onSaveScore, onEditRequest, lang = 'en' }) {
  const initFSM = !initialScoreObj ? 'AWAITING_SUBMISSION'
    : initialScoreObj.status === 'VALID' ? 'SUBMITTED'
    : initialScoreObj.status === 'PENDING' ? 'PENDING_ADMIN' : 'AWAITING_SUBMISSION';

  const [fsmState, setFsmState] = useState(initFSM);
  const [scoreVal, setScoreVal] = useState(initialScoreObj ? (initialScoreObj.proposedScore || initialScoreObj.score || '') : '');

  useEffect(() => {
    if (initialScoreObj) {
      setScoreVal(initialScoreObj.proposedScore || initialScoreObj.score || '');
      if (initialScoreObj.status === 'VALID') setFsmState('SUBMITTED');
      else if (initialScoreObj.status === 'PENDING') setFsmState('PENDING_ADMIN');
    }
  }, [initialScoreObj]);

  const handleAction = () => {
    if (fsmState === 'AWAITING_SUBMISSION') { if (onSaveScore) onSaveScore(scoreVal); }
    else if (fsmState === 'SUBMITTED') { setFsmState('EDIT_REQUESTED'); }
    else if (fsmState === 'EDIT_REQUESTED') { if (onEditRequest && initialScoreObj) { onEditRequest(initialScoreObj.id, scoreVal); setFsmState('PENDING_ADMIN'); } }
  };

  return (
    <div className="p-5 border-2 border-ink-200 rounded-2xl shadow-sm bg-white mb-4">
      <h4 className="font-bold text-ink-800 mb-4">{title}</h4>
      {fsmState === 'PENDING_ADMIN' ? (
        <PendingBanner lang={lang} />
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink-500 mb-1.5">{lang === 'ar' ? 'إدخال النتيجة الإجمالية' : 'Total Score Input'}</label>
            <input
              type="number"
              inputMode="numeric"
              value={scoreVal}
              onChange={e => setScoreVal(e.target.value)}
              disabled={fsmState === 'SUBMITTED'}
              className="w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-brand-500 disabled:bg-ink-100 outline-none"
              placeholder={lang === 'ar' ? 'أدخل النتيجة رقمياً...' : 'Enter numerical score...'}
            />
          </div>
          <FsmButton fsmState={fsmState} onAction={handleAction} showScore={true} lang={lang} />
        </>
      )}
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function CardHeader({ title, inspPassed, matchReady, lang = 'en' }) {
  const statusConfig = inspPassed
    ? { label: matchReady ? (lang === 'ar' ? 'جاهز للمباراة' : 'Match Ready') : (lang === 'ar' ? 'اجتاز الفحص' : 'Inspection Pass'), class: 'bg-saudi-50 text-saudi-700 border border-saudi-200', dot: 'bg-saudi-400' }
    : { label: lang === 'ar' ? 'فحص معلق' : 'Pending Inspection', class: 'bg-ink-50 text-ink-500 border border-ink-200', dot: 'bg-ink-300' };
  return (
    <div className="flex justify-between items-start gap-3 mb-3">
      <h4 className="font-bold text-ink-800 leading-tight flex-1">{title}</h4>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${statusConfig.class}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${inspPassed ? 'animate-pulse' : ''}`} />
        {statusConfig.label}
      </span>
    </div>
  );
}

function PendingBanner({ lang = 'en' }) {
  return (
    <div className="mb-3 p-3.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs font-bold flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
        <Lock size={14} className="text-amber-600" />
      </div>
      <div>
        <p className="font-black">{lang === 'ar' ? 'بانتظار موافقة الإدارة' : 'Pending Admin Approval'}</p>
        <p className="font-medium text-amber-600 mt-0.5">{lang === 'ar' ? 'الواجهة مقفلة حتى تتم المراجعة من قبل المسؤول.' : 'UI locked until reviewed by an administrator.'}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children, sub }) {
  return (
    <h5 className={`font-black uppercase tracking-widest mt-3 mb-1 ${sub ? 'text-[9px] text-brand-600 border-b border-brand-100 pb-1.5' : 'text-[10px] text-ink-400'}`}>
      {children}
    </h5>
  );
}

function Check({ label, checked, onChange, disabled, danger, lang = 'en' }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex items-center gap-3 w-full text-left py-3 px-3.5 rounded-xl transition-all duration-150 press-effect ${
        danger
          ? checked
            ? 'bg-rose-50 border-2 border-rose-300 text-rose-800'
            : 'bg-white border-2 border-rose-100 text-rose-600 hover:border-rose-200'
          : checked
            ? 'bg-brand-50 border-2 border-brand-300 text-ink-800'
            : 'bg-white border-2 border-ink-200 text-ink-600 hover:border-ink-300'
      } ${disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`w-5 h-5 shrink-0 rounded-lg flex items-center justify-center border-2 transition-all duration-150 ${
        danger
          ? checked ? 'bg-rose-500 border-rose-500' : 'bg-white border-rose-200'
          : checked ? 'bg-brand-500 border-brand-500' : 'bg-white border-ink-200'
      }`}>
        {checked && <CheckIcon size={11} strokeWidth={3.5} className="text-white" />}
      </span>
      <span className="flex-1 leading-snug text-sm font-medium">{label}</span>
      {danger && checked && <span className="text-[10px] font-black text-rose-500 uppercase tracking-wide">{lang === 'ar' ? 'مخالفة' : 'VIOLATION'}</span>}
    </button>
  );
}

function NotesField({ value, onChange, disabled, lang = 'en' }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-ink-400 uppercase tracking-widest mb-1.5">{lang === 'ar' ? 'ملاحظات الحكم' : 'Referee Notes'}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        className="w-full p-3 border-2 border-ink-200 rounded-xl text-sm disabled:bg-ink-50 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none resize-none placeholder:text-ink-300"
        placeholder={lang === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'}
      />
    </div>
  );
}

function ScoreResult({ label, value, warning }) {
  return (
    <div className="score-result-box">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-brand-600 uppercase tracking-widest">{label}</span>
        <span className="font-black text-brand-800 text-2xl tabular-nums">{value}</span>
      </div>
      {warning && (
        <div className="flex items-center gap-1.5 mt-2 text-rose-600 text-xs font-bold bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
          <AlertCircle size={12} /> {warning}
        </div>
      )}
    </div>
  );
}

function TeamInspPanel({ label, pass, categoryId, isInitial, insp, setInsp, disabled, lang = 'en' }) {
  return (
    <div className={`p-4 rounded-xl border-2 transition-colors ${pass ? 'border-saudi-300 bg-saudi-50/30' : 'border-ink-200 bg-ink-50/50'}`}>
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-bold text-ink-700 text-sm">{label}</h5>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wide ${
          pass ? 'bg-saudi-100 text-saudi-700 border border-saudi-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pass ? 'bg-saudi-400' : 'bg-red-400'}`} />
          {pass ? (lang === 'ar' ? 'ناجح' : 'PASS') : (lang === 'ar' ? 'راسب' : 'FAIL')}
        </span>
      </div>
      <CategoryInspectionUI categoryId={categoryId} isInitial={isInitial} insp={insp} updateInsp={(k, v) => setInsp(p => ({ ...p, [k]: v }))} disabled={disabled} lang={lang} />
    </div>
  );
}

function GoalsCounter({ label, value, onChange, disabled }) {
  return (
    <div className="text-center">
      <div className="font-bold text-ink-600 text-sm mb-2">{label}</div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled}
          className="bg-ink-200 hover:bg-ink-300 active:bg-ink-400 w-11 h-11 rounded-full font-bold text-lg disabled:opacity-50 transition-colors press-effect"
        >-</button>
        <span className="font-black text-2xl text-ink-800 w-10 text-center">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          disabled={disabled}
          className="bg-brand-100 hover:bg-brand-200 active:bg-brand-300 w-11 h-11 rounded-full font-bold text-lg text-brand-700 disabled:opacity-50 transition-colors press-effect"
        >+</button>
      </div>
    </div>
  );
}
