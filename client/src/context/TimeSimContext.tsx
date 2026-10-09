import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TimePreset {
  id: string;
  label: string;
  day: number;
  time: string;
  description: string;
}

export const TIME_PRESETS: TimePreset[] = [
  {
    id: 'mon-0845',
    label: 'Mon 08:45 AM (Pre-class)',
    day: 1,
    time: '08:45',
    description: '15m before first lecture (CS301 in Room 204)',
  },
  {
    id: 'mon-1040',
    label: 'Mon 10:40 AM (Break / Gap)',
    day: 1,
    time: '10:40',
    description: '20m gap between Distributed Systems and DB Lab',
  },
  {
    id: 'mon-1245',
    label: 'Mon 12:45 PM (Lunch Break)',
    day: 1,
    time: '12:45',
    description: 'Post-lecture lunch window (Cafeteria check-in)',
  },
  {
    id: 'mon-1415',
    label: 'Mon 14:15 PM (Class Active)',
    day: 1,
    time: '14:15',
    description: 'Currently inside CS308 AI lecture in Room 305',
  },
  {
    id: 'wed-1145',
    label: 'Wed 11:45 AM (Afternoon Gap)',
    day: 3,
    time: '11:45',
    description: '75m study gap before Computer Networks',
  },
];

interface TimeSimContextType {
  isSimulated: boolean;
  simulatedDay: number | undefined;
  simulatedTime: string | undefined;
  activePresetId: string | null;
  setPreset: (presetId: string) => void;
  resetToRealTime: () => void;
  displayTimeLabel: string;
}

const TimeSimContext = createContext<TimeSimContextType | undefined>(undefined);

export const TimeSimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    return localStorage.getItem('campusnow_preset_id') || 'mon-0845'; // Default to a weekday preset so demo shows active cards out of the box!
  });

  const selectedPreset = TIME_PRESETS.find(p => p.id === activePresetId) || null;

  const setPreset = (presetId: string) => {
    setActivePresetId(presetId);
    localStorage.setItem('campusnow_preset_id', presetId);
  };

  const resetToRealTime = () => {
    setActivePresetId(null);
    localStorage.removeItem('campusnow_preset_id');
  };

  const isSimulated = activePresetId !== null && selectedPreset !== null;
  const simulatedDay = isSimulated && selectedPreset ? selectedPreset.day : undefined;
  const simulatedTime = isSimulated && selectedPreset ? selectedPreset.time : undefined;

  const displayTimeLabel = isSimulated && selectedPreset
    ? selectedPreset.label
    : 'Real System Clock';

  return (
    <TimeSimContext.Provider
      value={{
        isSimulated,
        simulatedDay,
        simulatedTime,
        activePresetId,
        setPreset,
        resetToRealTime,
        displayTimeLabel,
      }}
    >
      {children}
    </TimeSimContext.Provider>
  );
};

export const useTimeSim = (): TimeSimContextType => {
  const context = useContext(TimeSimContext);
  if (!context) {
    throw new Error('useTimeSim must be used within a TimeSimProvider');
  }
  return context;
};
