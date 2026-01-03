
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Trash2, Calendar, Dumbbell, ChevronRight, Loader2, CheckCircle2, ChevronLeft, ArrowRight, FileText, Images, Camera, Download, X } from 'lucide-react';
import { TrainingGoal, AppState, Workout, Exercise, TranslationKeys, EvolutionPhoto } from './types';
import { translations } from './i18n';
import { parseWorkoutText } from './geminiService';
import ExerciseRow from './components/ExerciseRow';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('gympro_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.evolutionGallery) parsed.evolutionGallery = [];
      return parsed;
    }
    return {
      goal: TrainingGoal.BODYBUILDING,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      workouts: [],
      evolutionGallery: [],
      language: 'pt'
    };
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [importingToWorkoutId, setImportingToWorkoutId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewedWorkoutId, setViewedWorkoutId] = useState<string | null>(null);

  const galleryUploadRef = useRef<HTMLInputElement>(null);
  const galleryCameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('gympro_state', JSON.stringify(state));
  }, [state]);

  const t = (key: TranslationKeys) => translations[state.language][key];

  const addWorkout = () => {
    if (state.workouts.length >= 10) return;
    
    const letters = 'ABCDEFGHIJ';
    const nextLetter = letters[state.workouts.length];
    
    const newWorkout: Workout = {
      id: Math.random().toString(36).substr(2, 9),
      letter: nextLetter,
      exercises: [],
      generalObservation: ''
    };

    setState(prev => ({
      ...prev,
      workouts: [...prev.workouts, newWorkout]
    }));
    setViewedWorkoutId(newWorkout.id);
  };

  const deleteWorkout = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      workouts: prev.workouts.filter(w => w.id !== id).map((w, i) => ({
        ...w,
        letter: 'ABCDEFGHIJ'[i]
      }))
    }));
    if (viewedWorkoutId === id) setViewedWorkoutId(null);
  };

  const addExercise = (workoutId: string) => {
    const newExercise: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Novo Exercício',
      sets: 3,
      reps: '12',
      weight: '',
      observation: '',
      isCompleted: false,
      completedSets: 0,
      restTime: 60
    };

    setState(prev => ({
      ...prev,
      workouts: prev.workouts.map(w => 
        w.id === workoutId ? { ...w, exercises: [...w.exercises, newExercise] } : w
      )
    }));
  };

  const updateExercise = (workoutId: string, exerciseId: string, updates: Partial<Exercise>) => {
    setState(prev => ({
      ...prev,
      workouts: prev.workouts.map(w => 
        w.id === workoutId 
          ? { 
              ...w, 
              exercises: w.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e) 
            } 
          : w
      )
    }));
  };

  const deleteExercise = (workoutId: string, exerciseId: string) => {
    setState(prev => ({
      ...prev,
      workouts: prev.workouts.map(w => 
        w.id === workoutId 
          ? { ...w, exercises: w.exercises.filter(e => e.id !== exerciseId) } 
          : w
      )
    }));
  };

  const updateWorkoutObservation = (workoutId: string, text: string) => {
    setState(prev => ({
      ...prev,
      workouts: prev.workouts.map(w => 
        w.id === workoutId ? { ...w, generalObservation: text } : w
      )
    }));
  };

  const openImportModal = (workoutId: string | null = null) => {
    setImportingToWorkoutId(workoutId);
    setIsImportModalOpen(true);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsProcessing(true);
    
    try {
      const parsed = await parseWorkoutText(importText);
      if (parsed.length > 0) {
        const newExercises = parsed.map(p => ({
          id: Math.random().toString(36).substr(2, 9),
          name: p.name || 'Exercício',
          sets: p.sets || 3,
          reps: p.reps || '12',
          weight: '',
          observation: p.observation || '',
          isCompleted: false,
          completedSets: 0,
          restTime: p.restTime || 60
        }));

        if (importingToWorkoutId) {
          setState(prev => ({
            ...prev,
            workouts: prev.workouts.map(w => 
              w.id === importingToWorkoutId ? { ...w, exercises: [...w.exercises, ...newExercises] } : w
            )
          }));
        } else {
          const workoutLetters = 'ABCDEFGHIJ';
          const newWorkout: Workout = {
            id: Math.random().toString(36).substr(2, 9),
            letter: workoutLetters[state.workouts.length % 10],
            exercises: newExercises,
            generalObservation: ''
          };
          setState(prev => ({ ...prev, workouts: [...prev.workouts, newWorkout] }));
          setViewedWorkoutId(newWorkout.id);
        }
      }
    } catch (e) {
      console.error(e);
    }

    setIsProcessing(false);
    setIsImportModalOpen(false);
    setImportText('');
    setImportingToWorkoutId(null);
  };

  const handleEvolutionPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto: EvolutionPhoto = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toLocaleDateString(state.language === 'pt' ? 'pt-BR' : 'en-US'),
          dataUrl: reader.result as string,
        };
        setState(prev => ({
          ...prev,
          evolutionGallery: [newPhoto, ...prev.evolutionGallery]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPhoto = (dataUrl: string, date: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Evolution_${date.replace(/\//g, '-')}.png`;
    link.click();
  };

  const activeWorkout = state.workouts.find(w => w.id === viewedWorkoutId);

  return (
    <div className="min-h-screen pb-20 max-w-6xl mx-auto px-4 sm:px-6">
      {/* HEADER SECTION */}
      {!viewedWorkoutId ? (
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md pt-6 pb-4 border-b border-slate-800 animate-in fade-in duration-300">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
                <Dumbbell className="text-blue-400" />
                {t('title')}
              </h1>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsGalleryOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-blue-400 border border-slate-700 transition-all flex items-center gap-2"
                  title={t('gallery')}
                >
                  <Images size={20} />
                  <span className="text-xs font-bold hidden sm:inline uppercase tracking-widest">{t('evolution')}</span>
                </button>
                <select 
                  className="bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 outline-none cursor-pointer"
                  value={state.language}
                  onChange={(e) => setState(prev => ({ ...prev, language: e.target.value as any }))}
                >
                  <option value="pt">PT</option>
                  <option value="en">EN</option>
                  <option value="es">ES</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{t('goal')}</label>
                <select 
                  className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  value={state.goal}
                  onChange={(e) => setState(prev => ({ ...prev, goal: e.target.value as TrainingGoal }))}
                >
                  <option value={TrainingGoal.BODYBUILDING}>{t('bodybuilding')}</option>
                  <option value={TrainingGoal.HYPERTROPHY}>{t('hypertrophy')}</option>
                  <option value={TrainingGoal.RESISTANCE}>{t('resistance')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{t('startDate')}</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 text-slate-500" size={16} />
                  <input 
                    type="date"
                    className="w-full bg-slate-800/50 p-2 pl-9 rounded-lg border border-slate-700 outline-none focus:border-blue-500"
                    value={state.startDate}
                    onChange={(e) => setState(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{t('endDate')}</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 text-slate-500" size={16} />
                  <input 
                    type="date"
                    className="w-full bg-slate-800/50 p-2 pl-9 rounded-lg border border-slate-700 outline-none focus:border-blue-500"
                    value={state.endDate}
                    onChange={(e) => setState(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={addWorkout}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Plus size={18} />
                {t('addWorkout')}
              </button>
              <button 
                onClick={() => openImportModal()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-all active:scale-95"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">{t('importText')}</span>
              </button>
            </div>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md pt-6 pb-4 border-b border-slate-800 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setViewedWorkoutId(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold">{t('title')}</span>
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsGalleryOpen(true)}
                className="p-2 text-slate-400 hover:text-blue-400 transition-colors bg-slate-800 rounded-lg"
                title={t('gallery')}
              >
                <Images size={20} />
              </button>
              <button 
                onClick={() => openImportModal(activeWorkout?.id)}
                className="p-2 text-slate-400 hover:text-blue-400 transition-colors bg-slate-800 rounded-lg"
                title={t('importText')}
              >
                <FileText size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-lg font-black text-lg shadow-lg shadow-blue-900/40">
                  {activeWorkout?.letter}
                </div>
                <h2 className="text-lg font-bold text-slate-200">{t('workout')} {activeWorkout?.letter}</h2>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="mt-8">
        {!viewedWorkoutId ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-500">
            {state.workouts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-600">
                <div className="p-6 bg-slate-800/20 rounded-full mb-4">
                  <Dumbbell size={48} className="opacity-20" />
                </div>
                <p className="text-center italic max-w-xs">{t('noWorkouts')}</p>
              </div>
            ) : (
              state.workouts.map((workout) => (
                <div 
                  key={workout.id}
                  onClick={() => setViewedWorkoutId(workout.id)}
                  className="group relative bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/60 transition-all cursor-pointer shadow-xl hover:shadow-blue-500/5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-600/10 group-hover:bg-blue-600/20 text-blue-400 flex items-center justify-center rounded-xl font-black text-2xl transition-colors">
                      {workout.letter}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openImportModal(workout.id); }}
                        className="p-2 text-slate-600 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                        title={t('importText')}
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={(e) => deleteWorkout(e, workout.id)}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-100 mb-1">{t('workout')} {workout.letter}</h3>
                    <p className="text-xs text-slate-500">
                      {workout.exercises.length} {workout.exercises.length === 1 ? 'exercício' : 'exercícios'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-blue-400 font-bold text-sm">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Iniciar Treino</span>
                    <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300 mx-auto max-w-4xl">
            {activeWorkout && (
              <>
                <div className="flex flex-col gap-4">
                  {activeWorkout.exercises.length === 0 ? (
                    <div className="bg-slate-800/20 border border-dashed border-slate-700 rounded-2xl py-12 flex flex-col items-center justify-center text-slate-500">
                      <p className="italic mb-4">Nenhum exercício ainda.</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => addExercise(activeWorkout.id)}
                          className="bg-slate-700/50 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
                        >
                          <Plus size={18} />
                          {t('addExercise')}
                        </button>
                        <button 
                          onClick={() => openImportModal(activeWorkout.id)}
                          className="bg-blue-600/50 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
                        >
                          <Upload size={18} />
                          {t('importText')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    activeWorkout.exercises.map((ex, index) => (
                      <ExerciseRow
                        key={ex.id}
                        exercise={ex}
                        index={index}
                        t={t}
                        onUpdate={(updates) => updateExercise(activeWorkout.id, ex.id, updates)}
                        onDelete={() => deleteExercise(activeWorkout.id, ex.id)}
                      />
                    ))
                  )}
                </div>

                {activeWorkout.exercises.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={() => addExercise(activeWorkout.id)}
                      className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 py-4 rounded-2xl text-slate-500 hover:text-blue-400 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      {t('addExercise')}
                    </button>
                    <button 
                      onClick={() => openImportModal(activeWorkout.id)}
                      className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 py-4 rounded-2xl text-slate-500 hover:text-emerald-400 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      {t('importText')}
                    </button>
                  </div>
                )}

                <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <ChevronRight size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('observation')}</span>
                  </div>
                  <textarea
                    className="w-full bg-transparent outline-none text-sm text-slate-200 resize-none min-h-[100px] placeholder:text-slate-600"
                    placeholder="Ex: Treino pirâmide, foco em amplitude, aquecimento manguito..."
                    value={activeWorkout.generalObservation}
                    onChange={(e) => updateWorkoutObservation(activeWorkout.id, e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* EVOLUTION GALLERY MODAL */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Images className="text-blue-400" />
                <h3 className="text-xl font-black uppercase tracking-tighter">{t('evolution')} {t('gallery')}</h3>
              </div>
              <button 
                onClick={() => setIsGalleryOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/20">
              {/* Force 2 column layout for "Side by Side" comparison */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {/* Upload & Camera Card */}
                <div className="aspect-[3/4] bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-6 hover:border-blue-500/50 transition-all p-6 shadow-xl">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => galleryUploadRef.current?.click()}
                      className="p-4 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-transform active:scale-90"
                    >
                      <Upload size={24} />
                    </button>
                    <button 
                      onClick={() => galleryCameraRef.current?.click()}
                      className="p-4 bg-emerald-600 rounded-full text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition-transform active:scale-90"
                    >
                      <Camera size={24} />
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-1">{t('addProgress')}</span>
                    <p className="text-[10px] text-slate-600 font-medium">JPG, PNG ou Câmera</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={galleryUploadRef} onChange={handleEvolutionPhoto} />
                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={galleryCameraRef} onChange={handleEvolutionPhoto} />
                </div>

                {state.evolutionGallery.map((photo) => (
                  <div key={photo.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl">
                    <img src={photo.dataUrl} alt="Evolution" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                    
                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-600/20 backdrop-blur-md px-3 py-1 rounded-full border border-blue-500/30">
                           <p className="text-xs font-black text-blue-400 uppercase tracking-tighter">{photo.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => downloadPhoto(photo.dataUrl, photo.date)}
                          className="flex-1 bg-white hover:bg-slate-200 text-slate-900 p-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg"
                        >
                          <Download size={18} />
                          <span className="text-xs uppercase">{t('download')}</span>
                        </button>
                        <button 
                          onClick={() => setState(prev => ({ ...prev, evolutionGallery: prev.evolutionGallery.filter(p => p.id !== photo.id) }))}
                          className="bg-red-600/20 hover:bg-red-600 p-3 rounded-xl text-red-500 hover:text-white border border-red-500/30 transition-all shadow-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Simple Date Badge (Visible always) */}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10 group-hover:opacity-0 transition-opacity">
                      {photo.date}
                    </div>
                  </div>
                ))}
              </div>

              {state.evolutionGallery.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-700 italic">
                  <Images size={48} className="mb-4 opacity-10" />
                  <p>{t('noPhotos')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                <Upload className="text-blue-400" />
                {importingToWorkoutId 
                  ? `${t('importText')} - ${t('workout')} ${state.workouts.find(w => w.id === importingToWorkoutId)?.letter}`
                  : t('importText')}
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                {t('pasteTextPrompt')}
              </p>
              <textarea
                className="w-full h-48 bg-slate-800/50 rounded-2xl p-5 text-slate-100 outline-none border border-slate-700 focus:border-blue-500 transition-all custom-scrollbar placeholder:text-slate-600"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Ex: Supino Reto 4x10 (rest 60s), Agachamento Livre 4x8-12 (carga alta)..."
              />
            </div>
            <div className="flex p-6 bg-slate-800/30 gap-4 border-t border-slate-800">
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportingToWorkoutId(null); }}
                className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors"
                disabled={isProcessing}
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleImport}
                disabled={isProcessing || !importText.trim()}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/10"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {t('process')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
