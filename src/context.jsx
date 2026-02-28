import { createContext, useContext, useMemo, useState } from 'react';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [simulationMode, setSimulationMode] = useState('normal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [completedModules, setCompletedModules] = useState({});
  const [learner, setLearner] = useState({ name: 'Engineer', track: 'Industrial Power Systems', streakDays: 12 });

  const markModuleComplete = (moduleName) => {
    setCompletedModules((prev) => ({ ...prev, [moduleName]: true }));
  };

  const value = useMemo(
    () => ({
      simulationMode,
      setSimulationMode,
      isSidebarOpen,
      setIsSidebarOpen,
      completedModules,
      markModuleComplete,
      learner,
      setLearner,
    }),
    [simulationMode, isSidebarOpen, completedModules, learner],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}
