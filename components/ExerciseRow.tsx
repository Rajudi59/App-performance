
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, CheckCircle2, RotateCcw, Play, Pause, X } from 'lucide-react';
import { Exercise } from '../types';

interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  onUpdate: (updates: Partial<Exercise>) => void;
  onDelete: () => void;
  t: (key: any) => string;
}

const ExerciseRow: React.FC<ExerciseRowProps> = ({ exercise, index, onUpdate, onDelete, t }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isEditingRest, setIsEditingRest] = useState(false);

  const timerRef = useRef<number | null>(null);
  const restRef = useRef<number | null>(null);

  // Exercise Timer (Ascending)
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning]);

  // Rest Timer (Descending)
  useEffect(() => {
    if (isResting && restRemaining > 0) {
      restRef.current = window.setInterval(() => {
        setRestRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restRef.current) clearInterval(restRef.current);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [isResting, restRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetToggle = (indexSet: number) => {
    const newCompletedSets = indexSet + 1 === exercise.completedSets ? indexSet : indexSet + 1;
    onUpdate({ 
      completedSets: newCompletedSets,
      isCompleted: newCompletedSets >= exercise.sets 
    });

    // Start rest timer automatically when a set is finished (if not already completed)
    if (newCompletedSets > exercise.completedSets && newCompletedSets < exercise.sets) {
      setRestRemaining(exercise.restTime);
      setIsResting(true);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Logic for alternating background tones based on index
  const getCardStyle = () => {
    if (exercise.isCompleted) {
      return 'bg-emerald-900/20 border-emerald-500/40 shadow-emerald-500/5';
    }
    return index % 2 === 0 
      ? 'bg-slate-800/40 border-slate-700/50 shadow-sm' 
      : 'bg-slate-800/70 border-slate-700 shadow-md';
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${getCardStyle()}`}>
      <div className="flex flex-col gap-3">
        {/* Top line: Name and basic controls */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <input
              className="bg-transparent text-lg font-bold outline-none w-full focus:text-blue-400 placeholder:text-slate-600"
              value={exercise.name}
              placeholder="Nome do exercício"
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
            <div className="flex gap-2 text-xs text-slate-400 mt-1">
              <span>{exercise.reps} reps</span>
              <span>•</span>
              <input
                className="bg-transparent w-16 outline-none focus:text-blue-400 border-b border-transparent focus:border-blue-400"
                value={exercise.weight}
                placeholder="Carga (kg)"
                onChange={(e) => onUpdate({ weight: e.target.value })}
              />
            </div>
          </div>
          <button 
            onClick={onDelete}
            className="p-2 text-slate-500 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Action Line: Timer, Rest, Photo */}
        <div className="flex flex-wrap items-center gap-4 py-2 border-y border-slate-700/30">
          {/* Main Timer */}
          <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-700/30">
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-blue-400 hover:text-blue-300"
            >
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <span className="font-mono text-sm min-w-[45px]">{formatTime(elapsedTime)}</span>
            <button onClick={() => setElapsedTime(0)} className="text-slate-500 hover:text-slate-300">
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Rest Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${isResting ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-slate-900/40 border-slate-700/30'}`}>
            <span className="text-xs font-medium uppercase opacity-60">{t('rest')}</span>
            {isEditingRest ? (
              <input
                autoFocus
                type="number"
                className="bg-slate-900 w-12 text-sm text-center rounded outline-none border border-blue-500/50"
                value={exercise.restTime}
                onBlur={() => setIsEditingRest(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingRest(false)}
                onChange={(e) => onUpdate({ restTime: parseInt(e.target.value) || 0 })}
              />
            ) : (
              <span 
                className="font-mono text-sm cursor-pointer hover:text-blue-400"
                onClick={() => setIsEditingRest(true)}
              >
                {isResting ? formatTime(restRemaining) : formatTime(exercise.restTime)}
              </span>
            )}
            <button 
              onClick={() => {
                if (isResting) setIsResting(false);
                else {
                  setRestRemaining(exercise.restTime);
                  setIsResting(true);
                }
              }}
              className="text-slate-400 hover:text-white"
            >
              {isResting ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>

          {/* Photo: Increased by 4 times from w-9/h-9 (36px) to w-36/h-36 (144px) */}
          <div className="relative">
            <label className="flex items-center justify-center bg-slate-900/40 w-36 h-36 rounded-2xl border border-slate-700/30 cursor-pointer hover:bg-slate-800 transition-colors overflow-hidden group">
              {exercise.photo ? (
                <img src={exercise.photo} alt="Ex" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-400">
                  <Camera size={24} />
                  <span className="text-[10px] font-bold uppercase">{t('photo')}</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {exercise.photo && (
              <button 
                onClick={() => onUpdate({ photo: undefined })}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg hover:bg-red-400 transition-colors z-10"
              >
                <X size={14} className="text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Set Markers */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap items-center">
            {Array.from({ length: exercise.sets }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleSetToggle(i)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all transform active:scale-90 ${
                  i < exercise.completedSets 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' 
                    : 'border-slate-600 text-slate-500 hover:border-slate-400 hover:text-slate-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            {exercise.isCompleted && (
              <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold ml-2 animate-in zoom-in duration-300">
                <CheckCircle2 size={18} />
                {t('completed')}
              </div>
            )}
          </div>
          
          <input
            className="text-xs bg-slate-950/30 p-2 rounded italic outline-none text-slate-300 border border-slate-700/30 focus:border-blue-500/50 placeholder:text-slate-600"
            placeholder={t('observation') + "..."}
            value={exercise.observation}
            onChange={(e) => onUpdate({ observation: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default ExerciseRow;
