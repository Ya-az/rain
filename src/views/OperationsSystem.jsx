import { useState, useEffect, useRef } from 'react';
import { Settings, CheckCircle2, Activity, Users, PlayCircle, Upload, Download, AlertTriangle, FileSpreadsheet, X, Trash2, Shield, MapPin } from 'lucide-react';
import { CATEGORY_STYLES } from '../constants/mockData';
import CollapsibleCard from '../components/ui/CollapsibleCard';
import CustomSelect from '../components/ui/CustomSelect';
import Toggle from '../components/ui/Toggle';
import { t } from '../constants/translations';
import { parseExcelFile, downloadTemplate } from '../utils/excelImport';

// ─── RosterMobileCard ─────────────────────────────────────────────────────── 

function RosterMobileCard({ team, confirmAttendance, lang, participations = [], categories = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCoach, setDraftCoach] = useState(team.coach.present);
  const [draftMembers, setDraftMembers] = useState(team.members.map(m => ({ ...m })));

  useEffect(() => {
    setDraftCoach(team.coach.present);
    setDraftMembers(team.members.map(m => ({ ...m })));
  }, [team]);

  const studentsPresent = draftMembers.filter(m => m.present).length;
  const coachPresent = draftCoach ? 1 : 0;
  const total = draftMembers.length + 1;
  const presentCount = studentsPresent + coachPresent;
  let draftStatus = presentCount === 0 ? 'No-Show' : presentCount === total ? 'Fully Arrived' : 'Partially Arrived';

  const handleSave = () => { confirmAttendance(team.id, draftCoach, draftMembers); setIsEditing(false); };

  const statusBadge = {
    'No-Show': 'bg-ink-200 text-ink-600',
    'Partially Arrived': 'bg-brand-100 text-brand-800',
    'Fully Arrived': 'bg-saudi-100 text-saudi-800',
  };

  return (
    <div className="bg-white rounded-xl border border-ink-200 overflow-hidden shadow-sm">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-ink-800 text-sm">{team.name}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${statusBadge[draftStatus]}`}>{draftStatus}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {participations.filter(p => p.teamId === team.id).length > 0
                ? participations.filter(p => p.teamId === team.id).map(p => (
                    <span key={p.id} className="text-[10px] font-black font-mono bg-brand-50 border border-brand-200 text-brand-700 px-2 py-0.5 rounded-lg">{p.id}</span>
                  ))
                : <span className="text-[10px] text-ink-300">No ID yet</span>}
            </div>
            <p className="text-xs text-ink-500 mt-1 line-clamp-2">
              {participations
                .filter(p => p.teamId === team.id)
                .map(p => categories.find(c => c.id === p.categoryId)?.name)
                .filter(Boolean)
                .join(', ')}
            </p>
            <p className="text-xs text-ink-500 mt-0.5">{studentsPresent + coachPresent} / {total} {t(lang, 'membersCount')}</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="shrink-0 text-brand-600 font-bold text-xs bg-brand-50 active:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors press-effect"
          >
            {isEditing ? t(lang, 'cancel') : t(lang, 'edit')}
          </button>
        </div>
      </div>
      {isEditing && (
        <div className="border-t border-ink-100 bg-ink-50 p-3 space-y-1.5">
          {/* Coach toggle row */}
          <div className="flex items-center justify-between gap-3 px-2 py-2 bg-white rounded-lg border border-ink-200">
            <span className="text-sm font-bold text-ink-700">{t(lang, 'coachLabel')}: {team.coach.name}</span>
            <Toggle checked={draftCoach} onChange={setDraftCoach} size="sm" />
          </div>
          {/* Member toggle rows */}
          {draftMembers.map(m => (
            <div key={m.id} className="flex items-center justify-between gap-3 px-2 py-2 bg-white rounded-lg border border-ink-200">
              <span className="text-sm text-ink-700">{t(lang, 'studentLabel')}: {m.name}</span>
              <Toggle
                size="sm"
                checked={m.present}
                onChange={v => setDraftMembers(prev => prev.map(mem => mem.id === m.id ? { ...mem, present: v } : mem))}
              />
            </div>
          ))}
          <button onClick={handleSave} className="w-full bg-brand-600 active:bg-brand-800 text-white font-bold py-2.5 rounded-xl shadow-sm text-sm press-effect mt-1">
            {t(lang, 'saveAttendance')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── RosterRow ───────────────────────────────────────────────────────────────


function RosterRow({ team, confirmAttendance, lang, participations = [], categories = [] }) {
  const pIds = participations.filter(p => p.teamId === team.id).map(p => p.id);
  const [isEditing, setIsEditing] = useState(false);
  const [draftCoach, setDraftCoach] = useState(team.coach.present);
  const [draftMembers, setDraftMembers] = useState(team.members.map(m => ({ ...m })));

  useEffect(() => {
    setDraftCoach(team.coach.present);
    setDraftMembers(team.members.map(m => ({ ...m })));
  }, [team]);

  const studentsPresent = draftMembers.filter(m => m.present).length;
  const coachPresent = draftCoach ? 1 : 0;
  const total = draftMembers.length + 1;
  const presentCount = studentsPresent + coachPresent;
  let draftStatus = presentCount === 0 ? 'No-Show' : presentCount === total ? 'Fully Arrived' : 'Partially Arrived';

  const handleSave = () => { confirmAttendance(team.id, draftCoach, draftMembers); setIsEditing(false); };

  const statusBadge = {
    'No-Show': 'bg-ink-200 text-ink-600',
    'Partially Arrived': 'bg-brand-100 text-brand-800',
    'Fully Arrived': 'bg-saudi-100 text-saudi-800',
  };

  return (
    <>
      <tr className={`border-b border-ink-100 hover:bg-ink-50 transition-colors ${isEditing ? 'bg-ink-50' : ''}`}>
        <td className="p-3 font-semibold text-ink-800 text-sm">{team.name}</td>
        <td className="p-3">
          {pIds.length > 0
            ? <div className="flex flex-wrap gap-1">{pIds.map(id => <span key={id} className="text-[10px] font-black font-mono bg-brand-50 border border-brand-200 text-brand-700 px-2 py-0.5 rounded-lg">{id}</span>)}</div>
            : <span className="text-ink-300 text-xs font-mono">—</span>}
        </td>
        <td className="p-3 text-xs text-ink-600">
          {participations
            .filter(p => p.teamId === team.id)
            .map(p => categories.find(c => c.id === p.categoryId)?.name)
            .filter(Boolean)
            .join(', ')}</td>
        <td className="p-3 text-sm text-ink-700 font-bold">{studentsPresent} + {coachPresent}</td>
        <td className="p-3">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusBadge[draftStatus]}`}>{draftStatus}</span>
        </td>
        <td className="p-3">
          <button onClick={() => setIsEditing(!isEditing)} className="text-brand-600 hover:text-brand-800 font-bold text-xs bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">
            {isEditing ? t(lang, 'cancel') : t(lang, 'edit')}
          </button>
        </td>
      </tr>
      {isEditing && (
        <tr className="bg-ink-50 border-b-2 border-brand-200">
          <td colSpan="6" className="p-4">
            <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center justify-between gap-3 px-2 py-2 bg-ink-50 rounded-lg border min-w-[200px]">
                  <span className="text-sm font-bold text-ink-700">{t(lang, 'coachLabel')}: {team.coach.name}</span>
                  <Toggle size="sm" checked={draftCoach} onChange={setDraftCoach} />
                </div>
                {draftMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-3 px-2 py-2 bg-ink-50 rounded-lg border min-w-[180px]">
                    <span className="text-sm text-ink-700">{t(lang, 'studentLabel')}: {m.name}</span>
                    <Toggle
                      size="sm"
                      checked={m.present}
                      onChange={v => setDraftMembers(prev => prev.map(mem => mem.id === m.id ? { ...mem, present: v } : mem))}
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSave} className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-5 rounded-xl shadow-sm text-sm whitespace-nowrap">
                {t(lang, 'saveAttendance')}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── OperationsSystem ────────────────────────────────────────────────────────

export default function OperationsSystem({ scores, setScores, teams, participations = [], categories = [], confirmAttendance, generateMatches, importTeams, currentUser, systemConfig, setSystemConfig, lang, showToast, users = [], addUser, deleteUser, group2Matches = [] }) {
  const pendingScores = scores.filter(s => s.status === 'PENDING');
  const [rosterSearch, setRosterSearch] = useState('');
  const [usersOpen, setUsersOpen] = useState(false);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // ─ Excel import state
  const fileInputRef = useRef(null);
  const [importState, setImportState] = useState('idle'); // idle | parsing | preview | importing | done
  const [importResult, setImportResult] = useState(null); // { teams, imported, warnings }
  const [importError, setImportError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportState('parsing');
    setImportError('');
    setImportResult(null);
    try {
      const result = await parseExcelFile(file, teams);
      setImportResult(result);
      setImportState('preview');
    } catch (err) {
      setImportError(lang === 'ar' ? 'حدث خطأ أثناء قراءة الملف. تأكد أن الملف بصيغة .xlsx أو .csv' : 'Failed to read file. Make sure it is a valid .xlsx or .csv file.');
      setImportState('idle');
    }
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importResult?.teams?.length) return;
    setImportState('importing');
    const accepted = importTeams({
      teams:          importResult.teams,
      participations: importResult.participations,
      categories:     importResult.categories,
    });
    if (accepted === false) {
      setImportState('preview');
      return;
    }
    setImportState('done');
    if (showToast) showToast(lang === 'ar' ? `تم استيراد ${importResult.imported} فريق بنجاح` : `${importResult.imported} teams imported successfully`);
  };

  const handleReset = () => {
    setImportState('idle');
    setImportResult(null);
    setImportError('');
  };

  const filteredRoster = teams.filter(t =>
    t.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    t.id.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  const selectOptions = Array.from({ length: 51 }, (_, i) => i); // 0–50

  return (
    <div className="space-y-6 pb-24 sm:pb-6" dir={dir}>
      <div className="flex items-center gap-2">
        <Settings size={22} className="text-ink-600" />
        <h2 className="text-xl font-black text-ink-800">{t(lang, 'operationsCmd')}</h2>
      </div>

      {/* ─ Import Team Data — admin only */}
      {currentUser?.role === 'admin' && (
        <CollapsibleCard
          title={<><FileSpreadsheet size={18} className="text-saudi-400 mr-2" />{lang === 'ar' ? 'استيراد بيانات الفرق (Excel)' : 'Import Team Data (Excel)'}</>}
          badge={lang === 'ar' ? `${teams.length} فريق` : `${teams.length} teams`}
          badgeColor="bg-saudi-600"
          headerClass="bg-[#061a27]"
        >
          <div className="p-5 space-y-4">

            {/* Description + Download Template */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-brand-50 border border-brand-200 rounded-xl">
              <div>
                <p className="text-sm font-bold text-brand-800">
                  {lang === 'ar' ? 'جهّز ملف الإكسيل بنفس بنية القالب ثم استورده' : 'Prepare your Excel file using the template, then import it here.'}
                </p>
                <p className="text-xs text-brand-600 mt-1">
                  {lang === 'ar'
                    ? 'الأعمدة المطلوبة: اسم الفريق · المرحلة · المنطقة · المسارات · المدرب · أسماء الأعضاء'
                    : 'Required columns: Team Name · Division · Region · Categories · Coach Name · Members'}
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition-colors shrink-0 press-effect"
              >
                <Download size={15} />
                {lang === 'ar' ? 'تنزيل القالب' : 'Download Template'}
              </button>
            </div>

            {/* Upload area */}
            {importState === 'idle' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-ink-300 hover:border-brand-400 hover:bg-brand-50/40 rounded-xl transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-ink-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
                    <Upload size={22} className="text-ink-400 group-hover:text-brand-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-ink-700 text-sm">
                      {lang === 'ar' ? 'اضغط لاختيار ملف Excel' : 'Click to select Excel file'}
                    </p>
                    <p className="text-xs text-ink-400 mt-1">.xlsx · .xls · .csv</p>
                  </div>
                </button>
                {importError && (
                  <div className="mt-3 flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    {importError}
                  </div>
                )}
              </div>
            )}

            {/* Parsing spinner */}
            {importState === 'parsing' && (
              <div className="flex items-center justify-center gap-3 py-8">
                <span className="w-5 h-5 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
                <span className="text-sm font-bold text-ink-500">{lang === 'ar' ? 'جاري قراءة الملف...' : 'Reading file...'}</span>
              </div>
            )}

            {/* Preview */}
            {importState === 'preview' && importResult && (
              <div className="space-y-3">
                {/* Summary */}
                <div className="flex items-center gap-3 p-4 bg-saudi-50 border border-saudi-200 rounded-xl">
                  <CheckCircle2 size={20} className="text-saudi-600 shrink-0" />
                  <div>
                    <p className="font-black text-saudi-800 text-sm">
                      {lang === 'ar'
                        ? `تم قراءة ${importResult.imported} فريق بنجاح`
                        : `${importResult.imported} teams parsed successfully`}
                    </p>
                    {importResult.warnings.length > 0 && (
                      <p className="text-xs text-amber-700 font-semibold mt-0.5">
                        {importResult.warnings.length} {lang === 'ar' ? 'تحذير' : 'warning(s)'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Warnings */}
                {importResult.warnings.length > 0 && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    {importResult.warnings.slice(0, 5).map((w, i) => (
                      <p key={i} className="text-xs text-amber-700 font-semibold flex items-start gap-2">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {w}
                      </p>
                    ))}
                    {importResult.warnings.length > 5 && (
                      <p className="text-xs text-amber-500 font-semibold">+{importResult.warnings.length - 5} more...</p>
                    )}
                  </div>
                )}

                {/* Teams preview table */}
                <div className="overflow-x-auto rounded-xl border border-ink-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-ink-100 text-ink-500 font-bold uppercase tracking-wide">
                      <tr>
                        <th className="px-3 py-2">{lang === 'ar' ? 'اسم الفريق' : 'Team'}</th>
                        <th className="px-3 py-2">{lang === 'ar' ? 'المرحلة' : 'Div'}</th>
                        <th className="px-3 py-2">{lang === 'ar' ? 'المنطقة' : 'Region'}</th>
                        <th className="px-3 py-2">{lang === 'ar' ? 'المسارات' : 'Categories'}</th>
                        <th className="px-3 py-2">{lang === 'ar' ? 'الأعضاء' : 'Members'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {importResult.teams.slice(0, 8).map(team => (
                        <tr key={team.id} className="bg-white hover:bg-ink-50">
                          <td className="px-3 py-2 font-semibold text-ink-800">{team.name}</td>
                          <td className="px-3 py-2 font-mono text-ink-600">{team.division}</td>
                          <td className="px-3 py-2 text-ink-600">{team.region}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {importResult.participations
                                .filter(p => p.teamId === team.id)
                                .map(p => {
                                  const cat = importResult.categories?.find(c => c.id === p.categoryId);
                                  return (
                                    <span key={p.id} className="bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                      {cat?.name || p.categoryId}
                                    </span>
                                  );
                                })}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-ink-500">{team.members.length + 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importResult.teams.length > 8 && (
                    <p className="px-3 py-2 text-xs text-ink-400 font-semibold bg-ink-50">
                      +{importResult.teams.length - 8} {lang === 'ar' ? 'فريق إضافي' : 'more teams'}
                      {importResult.participations?.length > 0 && (
                        <span className="ml-2 text-brand-500">({importResult.participations.length} {lang === 'ar' ? 'مشاركة' : 'participations total'})</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Warning about reset */}
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-semibold">
                    {lang === 'ar'
                      ? 'تحذير: سيؤدي الاستيراد إلى حذف جميع بيانات تسجيل الحضور والنتائج السابقة.'
                      : 'Warning: Importing will clear all existing check-in data and scores. This cannot be undone.'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-none px-5 py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 font-bold rounded-xl text-sm transition-colors border border-ink-200"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={!importResult.imported}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-saudi-500 to-saudi-600 hover:from-saudi-400 hover:to-saudi-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-saudi-500/20 press-effect disabled:opacity-50"
                  >
                    <Upload size={15} />
                    {lang === 'ar'
                      ? `تأكيد استيراد ${importResult.imported} فريق (${importResult.participations?.length ?? 0} مشاركة)`
                      : `Confirm Import (${importResult.imported} teams · ${importResult.participations?.length ?? 0} participations)`}
                  </button>
                </div>
              </div>
            )}

            {/* Done state */}
            {importState === 'done' && (
              <div className="flex items-center justify-between p-4 bg-saudi-50 border border-saudi-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-saudi-600" />
                  <p className="font-bold text-saudi-800 text-sm">
                    {lang === 'ar'
                      ? `تم استيراد ${importResult?.imported} فريق بنجاح`
                      : `${importResult?.imported} teams imported successfully`}
                  </p>
                </div>
                <button onClick={handleReset} className="text-xs text-saudi-600 font-bold hover:underline">
                  {lang === 'ar' ? 'استيراد جديد' : 'Import again'}
                </button>
              </div>
            )}

          </div>
        </CollapsibleCard>
      )}

      {/* Configuration — admin only */}
      {currentUser?.role === 'admin' && (
        <CollapsibleCard
          title={<><Settings size={18} className="text-brand-400 mr-2" />{t(lang, 'configParams')}</>}
          badge={t(lang, 'systemAdminOnly')}
          badgeColor="bg-brand-600"
          headerClass="bg-[#061a27]"
        >
          <div className="p-5">
            <p className="text-sm text-ink-500 mb-5">{t(lang, 'configDesc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FastBot Laps */}
              <div className="bg-ink-50 p-4 rounded-xl border border-ink-200">
                <h4 className="font-bold text-ink-700 mb-3 flex items-center gap-2 border-b pb-2 text-sm">
                  <Activity size={16} className="text-ink-500" /> {t(lang, 'fastbotLaps')}
                </h4>
                <div className="space-y-2">
                  {['ES', 'MS', 'HS', 'US'].map(div => (
                    <div key={div} className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-ink-100">
                      <span className="text-sm font-semibold text-ink-700">{div}</span>
                      <CustomSelect
                        size="sm"
                        className="w-20"
                        value={systemConfig.fastbotLaps[div]}
                        onChange={e => setSystemConfig({ ...systemConfig, fastbotLaps: { ...systemConfig.fastbotLaps, [div]: parseInt(e.target.value) } })}
                      >
                        {selectOptions.map(n => <option key={n} value={n}>{n}</option>)}
                      </CustomSelect>
                    </div>
                  ))}
                </div>
              </div>
              {/* LineFollow Balls */}
              <div className="bg-ink-50 p-4 rounded-xl border border-ink-200">
                <h4 className="font-bold text-ink-700 mb-3 flex items-center gap-2 border-b pb-2 text-sm">
                  <Activity size={16} className="text-ink-500" /> {t(lang, 'linefollowBalls')}
                </h4>
                <div className="space-y-2">
                  {['ES', 'MS', 'HS', 'US'].map(div => (
                    <div key={div} className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-ink-100">
                      <span className="text-sm font-semibold text-ink-700">{div}</span>
                      <CustomSelect
                        size="sm"
                        className="w-20"
                        value={systemConfig.linefollowBalls[div]}
                        onChange={e => setSystemConfig({ ...systemConfig, linefollowBalls: { ...systemConfig.linefollowBalls, [div]: parseInt(e.target.value) } })}
                      >
                        {selectOptions.map(n => <option key={n} value={n}>{n}</option>)}
                      </CustomSelect>
                    </div>
                  ))}
                </div>
              </div>
              {/* Per-category Round configuration (Practice + Official) */}
              {[
                { id: 'c1_fastbot',    label: lang === 'ar' ? 'فاست‌بوت' : 'FastBot',       practiceMax: 5,  officialMax: 10 },
                { id: 'c1_amazeing',   label: lang === 'ar' ? 'إيه-ميز-إنغ' : 'a-Maze-ing',  practiceMax: 5,  officialMax: 10 },
                { id: 'c1_linefollow', label: lang === 'ar' ? 'تتبع الخط' : 'LineFollowing', practiceMax: 5,  officialMax: 10 },
              ].map(cat => {
                const officialOpts = Array.from({ length: cat.officialMax }, (_, i) => i + 1);
                const practiceOpts = Array.from({ length: cat.practiceMax + 1 }, (_, i) => i);
                const offByDiv = systemConfig.officialRoundsByCategory?.[cat.id] || systemConfig.fastbotOfficialRounds || { es_ms: 5, hs_us: 5 };
                const prByDiv  = systemConfig.practiceRoundsByCategory?.[cat.id] || systemConfig.fastbotPracticeRounds || { es_ms: 2, hs_us: 2 };

                const updateOfficial = (key, val) => setSystemConfig({
                  ...systemConfig,
                  officialRoundsByCategory: {
                    ...(systemConfig.officialRoundsByCategory || {}),
                    [cat.id]: { ...offByDiv, [key]: parseInt(val) },
                  },
                  ...(cat.id === 'c1_fastbot' ? {
                    fastbotOfficialRounds: { ...(systemConfig.fastbotOfficialRounds || {}), [key]: parseInt(val) },
                  } : {}),
                });
                const updatePractice = (key, val) => setSystemConfig({
                  ...systemConfig,
                  practiceRoundsByCategory: {
                    ...(systemConfig.practiceRoundsByCategory || {}),
                    [cat.id]: { ...prByDiv, [key]: parseInt(val) },
                  },
                  ...(cat.id === 'c1_fastbot' ? {
                    fastbotPracticeRounds: { ...(systemConfig.fastbotPracticeRounds || {}), [key]: parseInt(val) },
                  } : {}),
                });

                return (
                  <div key={cat.id} className="md:col-span-2 bg-ink-50 p-4 rounded-xl border border-ink-200">
                    <h4 className="font-bold text-ink-700 mb-3 flex items-center gap-2 border-b pb-2 text-sm">
                      <Activity size={16} className="text-ink-500" /> {cat.label} — {lang === 'ar' ? 'الجولات' : 'Rounds'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Official */}
                      <div className="bg-white rounded-lg border border-ink-100 p-3 space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">{t(lang, 'fastbotOfficialRounds')}</p>
                        {[{ key: 'es_ms', label: 'ES / MS' }, { key: 'hs_us', label: 'HS / US' }].map(({ key, label }) => {
                          const val = offByDiv?.[key] ?? 5;
                          return (
                            <div key={key} className="flex justify-between items-center bg-ink-50 p-2 px-3 rounded-lg border border-ink-100">
                              <span className="text-sm font-semibold text-ink-700">{label} — R1 → R{val}</span>
                              <CustomSelect size="sm" className="w-20" value={val} onChange={e => updateOfficial(key, e.target.value)}>
                                {officialOpts.map(n => <option key={n} value={n}>{n}</option>)}
                              </CustomSelect>
                            </div>
                          );
                        })}
                      </div>
                      {/* Practice */}
                      <div className="bg-white rounded-lg border border-ink-100 p-3 space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">{t(lang, 'fastbotPracticeRounds')}</p>
                        {[{ key: 'es_ms', label: 'ES / MS' }, { key: 'hs_us', label: 'HS / US' }].map(({ key, label }) => {
                          const val = prByDiv?.[key] ?? 2;
                          return (
                            <div key={key} className="flex justify-between items-center bg-ink-50 p-2 px-3 rounded-lg border border-ink-100">
                              <span className="text-sm font-semibold text-ink-700">{label} — P1 → P{val}</span>
                              <CustomSelect size="sm" className="w-20" value={val} onChange={e => updatePractice(key, e.target.value)}>
                                {practiceOpts.map(n => <option key={n} value={n}>{n}</option>)}
                              </CustomSelect>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleCard>
      )}

      {/* Roster */}
      <CollapsibleCard
        title={<><CheckCircle2 size={18} className="mr-2" />{t(lang, 'rosterTitle')}</>}
        badge={`${teams.length} ${t(lang, 'teamsRegistered')}`}
        badgeColor="bg-saudi-600"
        headerClass="bg-[#061a27]"
      >
        <div className="p-5 bg-ink-50">
          <p className="text-sm text-ink-500 mb-4">{t(lang, 'rosterDesc')}</p>
          <div className="mb-4">
            <input
              type="text"
              placeholder={t(lang, 'searchTeamRoster')}
              value={rosterSearch}
              onChange={e => setRosterSearch(e.target.value)}
              className="w-full md:w-1/2 p-3 border-2 border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium text-ink-700"
            />
          </div>
          {filteredRoster.length === 0 ? (
            <div className="text-center py-8 text-ink-400 bg-white rounded-xl border border-ink-200">{t(lang, 'noActiveTeams')}</div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="sm:hidden space-y-2">
                {filteredRoster.map(team => <RosterMobileCard key={team.id} team={team} confirmAttendance={confirmAttendance} lang={lang} participations={participations} categories={categories} />)}
              </div>
              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto bg-white rounded-xl border border-ink-200 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-ink-100 text-ink-500 text-xs uppercase tracking-wider">
                      <th className="p-3 border-b-2 font-bold">{t(lang, 'teamName')}</th>
                      <th className="p-3 border-b-2 font-bold">{t(lang, 'teamNumber')}</th>
                      <th className="p-3 border-b-2 font-bold">{t(lang, 'category')}</th>
                      <th className="p-3 border-b-2 font-bold">{t(lang, 'membersCount')}</th>
                      <th className="p-3 border-b-2 font-bold">{t(lang, 'checkinStatus')}</th>
                      <th className="p-3 border-b-2 font-bold w-20">{t(lang, 'actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoster.map(team => <RosterRow key={team.id} team={team} confirmAttendance={confirmAttendance} lang={lang} participations={participations} categories={categories} />)}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </CollapsibleCard>

      {/* Score Approvals */}
      <CollapsibleCard
        title={<><Activity size={18} className="text-orange-400 mr-2" />{t(lang, 'scoreApprovals')}</>}
        badge={`${pendingScores.length} ${t(lang, 'pending')}`}
        badgeColor={pendingScores.length > 0 ? 'bg-orange-500' : 'bg-ink-500'}
        headerClass="bg-[#061a27]"
        defaultOpen={pendingScores.length > 0}
      >
        <div className="p-5">
          {pendingScores.length === 0 ? (
            <p className="text-ink-500 text-center py-8">{t(lang, 'noPendingApprovals')}</p>
          ) : (
            <div className="space-y-4">
              {pendingScores.map(score => {
                const participation = participations.find(p => p.id === score.pId);
                const team = participation ? teams.find(tm => tm.id === participation.teamId) : null;
                const teamDisplay = team ? team.name : score.pId;
                return (
                <div key={score.id} className="flex flex-col gap-3 p-4 border-2 border-amber-100 rounded-2xl bg-amber-50/50 hover:border-amber-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                      <Activity size={16} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-ink-800 text-sm">{teamDisplay}</p>
                      <p className="text-[10px] text-ink-400 font-mono mt-0.5">{score.pId}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1.5 bg-white border border-ink-200 rounded-lg px-2.5 py-1.5">
                          <span className="text-ink-400 font-medium">Current</span>
                          <span className="font-black font-mono text-ink-700">{score.score}</span>
                        </div>
                        <span className="text-ink-300">→</span>
                        <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          <span className="text-amber-600 font-medium">Proposed</span>
                          <span className="font-black font-mono text-amber-800">{score.proposedScore ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setScores(scores.map(s => s.id === score.id ? { ...s, score: s.proposedScore, inspectionData: s.proposedInspection || s.inspectionData, inspectionA: s.proposedInspectionA || s.inspectionA, inspectionB: s.proposedInspectionB || s.inspectionB, rawInput: s.proposedRawInput || s.rawInput, proposedScore: undefined, proposedInspection: undefined, proposedInspectionA: undefined, proposedInspectionB: undefined, proposedRawInput: undefined, status: 'VALID' } : s)); if (showToast) showToast(t(lang, 'toastApproved')); }}
                      className="flex-1 bg-gradient-to-r from-saudi-500 to-saudi-600 hover:from-saudi-400 hover:to-saudi-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-saudi-500/20 flex items-center justify-center gap-2 press-effect">
                      <CheckCircle2 size={14} /> {t(lang, 'approve')}
                    </button>
                    <button onClick={() => { setScores(scores.map(s => s.id === score.id ? { ...s, proposedScore: undefined, proposedInspection: undefined, proposedInspectionA: undefined, proposedInspectionB: undefined, proposedRawInput: undefined, status: 'VALID' } : s)); if (showToast) showToast(t(lang, 'toastRejected'), 'info'); }}
                      className="px-4 py-2.5 rounded-xl font-bold text-sm border-2 border-ink-200 text-ink-600 hover:bg-ink-50 flex items-center justify-center gap-2 press-effect">
                      ✕ {t(lang, 'reject')}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Bottom utilities grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-ink-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <Users size={18} className="text-brand-600" />
              </div>
              <h3 className="font-bold text-ink-800 text-sm truncate">{t(lang, 'userManagement')}</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-400 shrink-0">{users.length}</span>
          </div>
          <p className="text-xs text-ink-500 mb-4">{t(lang, 'userMgmtDesc')}</p>
          <button onClick={() => setUsersOpen(true)} className="w-full border-2 border-dashed border-brand-300 text-brand-700 font-bold py-3 rounded-xl hover:bg-brand-50 text-sm transition-colors press-effect">
            👥 {lang === 'ar' ? 'إدارة الموظفين والحكام' : 'Manage Staff & Referees'}
          </button>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-ink-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#061a27]/10 border border-ink-200 flex items-center justify-center shrink-0">
                <PlayCircle size={18} className="text-[#061a27]" />
              </div>
              <h3 className="font-bold text-ink-800 text-sm truncate">{t(lang, 'matchmaking')}</h3>
            </div>
            {group2Matches.length > 0 && (
              <span className="text-[10px] font-black uppercase tracking-widest text-saudi-700 bg-saudi-50 border border-saudi-200 px-2 py-0.5 rounded-full shrink-0">{group2Matches.length} {lang === 'ar' ? 'مباراة' : 'matches'}</span>
            )}
          </div>
          <p className="text-xs text-ink-500 mb-4">{lang === 'ar' ? 'يولّد جداول إقصائيات (خروج من مرة) لـ Sumo و SoccerBot تلقائياً من الفرق الحاضرة حسب الفئة العمرية، مع ترقية تلقائية للفائز.' : 'Auto-generates single-elimination knockout brackets for Sumo & SoccerBot from currently checked-in teams, grouped by division. Winners auto-advance.'}</p>
          <button onClick={generateMatches} className="w-full bg-gradient-to-r from-[#061a27] to-[#0d3549] hover:from-[#0a2a3a] hover:to-[#103a52] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md press-effect">
            🏆 {lang === 'ar' ? 'توليد جداول الإقصائيات' : 'Generate Knockout Brackets'}
          </button>
        </div>
      </div>

      {usersOpen && (
        <UsersModal
          users={users}
          addUser={addUser}
          deleteUser={deleteUser}
          categories={categories}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setUsersOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Users management modal ───────────────────────────────────
function UsersModal({ users, addUser, deleteUser, categories, currentUser, lang, onClose }) {
  const tx = (en, ar) => (lang === 'ar' ? ar : en);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ref');
  const [region, setRegion] = useState('Western');
  const [selectedCats, setSelectedCats] = useState([]);

  const reset = () => { setName(''); setUsername(''); setPassword(''); setRole('ref'); setRegion('Western'); setSelectedCats([]); };

  const submit = (e) => {
    e?.preventDefault?.();
    if (!name.trim() || !username.trim() || !password.trim()) return;
    const newUser = {
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      role,
      region,
      categories: role === 'ref' ? selectedCats : [],
    };
    const ok = addUser?.(newUser);
    if (ok) reset();
  };

  const toggleCat = (id) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in" dir={dir} onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-ink-200 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink-100 bg-gradient-to-r from-navy-500 to-[#0d3549] text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <Users size={20} />
            <h3 className="font-black text-base truncate">{tx('Manage Staff & Referees', 'إدارة الموظفين والحكام')}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Add form */}
          <form onSubmit={submit} className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4 sm:p-5 space-y-3">
            <h4 className="font-black text-sm text-ink-800 mb-1">{tx('Add new account', 'إضافة حساب جديد')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder={tx('Full name', 'الاسم الكامل')} className="input-base h-11 text-sm" required />
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder={tx('Username (e.g. phone)', 'اسم المستخدم (مثل رقم الجوال)')} className="input-base h-11 text-sm" required />
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder={tx('Password', 'كلمة المرور')} className="input-base h-11 text-sm" required type="text" />
              <CustomSelect value={role} onChange={e => setRole(e.target.value)} size="md">
                <option value="ref">{tx('Referee', 'حكم')}</option>
                <option value="volunteer">{tx('Volunteer (Check-in)', 'متطوع (التسجيل)')}</option>
                <option value="region_admin">{tx('Region Admin', 'مدير منطقة')}</option>
                <option value="admin">{tx('Super Admin', 'مدير عام')}</option>
              </CustomSelect>
              <CustomSelect value={region} onChange={e => setRegion(e.target.value)} size="md">
                <option value="Western">{tx('Western', 'الغربية')}</option>
                <option value="Central">{tx('Central', 'الوسطى')}</option>
                <option value="Eastern">{tx('Eastern', 'الشرقية')}</option>
              </CustomSelect>
            </div>
            {role === 'ref' && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-ink-500 mb-1.5">{tx('Categories scoped', 'التصنيفات المسموحة')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(categories || []).map(c => {
                    const on = selectedCats.includes(c.id);
                    return (
                      <button type="button" key={c.id} onClick={() => toggleCat(c.id)} className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-600 border-ink-200 hover:border-brand-300'}`}>
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary w-full py-2.5 text-sm">
              + {tx('Add account', 'إضافة الحساب')}
            </button>
          </form>

          {/* Existing users list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-ink-800">{tx('Existing accounts', 'الحسابات الحالية')}</h4>
              <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">{users.length}</span>
            </div>
            <div className="divide-y divide-ink-100 border border-ink-200 rounded-xl overflow-hidden">
              {users.map(u => {
                const isCurrent = u.id === currentUser?.id;
                return (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-ink-50/60">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                      <Shield size={16} className="text-brand-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-ink-800 text-sm truncate">{u.name}</p>
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700">{u.role}</span>
                        {u.region && <span className="text-[10px] font-bold text-ink-500 inline-flex items-center gap-1"><MapPin size={10} />{u.region}</span>}
                      </div>
                      <p className="text-[11px] text-ink-500 font-mono mt-0.5 truncate">{u.username}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => deleteUser?.(u.id)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title={isCurrent ? tx('Cannot delete yourself', 'لا يمكن حذف حسابك') : tx('Remove user', 'حذف الحساب')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
