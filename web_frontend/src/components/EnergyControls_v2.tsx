import React, { useState } from 'react'

interface EnergyControlsProps {
  portalNumber: number;
}

const EnergyControls_v2: React.FC<EnergyControlsProps> = ({ portalNumber }) => {
  const [parameters, setParameters] = useState({
    energy1: 0,
    energy2: 0,
    frequency1: 7.83,
    frequency2: 7.91
  })
  
  const [energyState, setEnergyState] = useState({
    portal1Active: false,
    portal2Active: false
  })

  const handleParameterChange = (param: string, value: number) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }))
  }

  const toggleEnergyState = async (portal: number) => {
    const stateKey = `portal${portal}Active` as keyof typeof energyState
    const newState = !energyState[stateKey]
    
    setEnergyState(prev => ({
      ...prev,
      [stateKey]: newState
    }))
    
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/energy_control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal_id: portal,
          action: newState ? 'on' : 'off'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`Portal ${portal} energy ${newState ? 'activated' : 'deactivated'}:`, data)
        
        if (!newState) {
          setParameters(prev => ({
            ...prev,
            [`energy${portal}`]: 0
          }))
        } else {
          setParameters(prev => ({
            ...prev,
            [`energy${portal}`]: 1000
          }))
        }
      }
    } catch (error) {
      console.error(`Error toggling energy for portal ${portal}:`, error)
      setEnergyState(prev => ({
        ...prev,
        [stateKey]: !newState
      }))
    }
  }

  const adjustEnergy = async (portal: number, action: 'increase' | 'decrease') => {
    const energyKey = `energy${portal}` as keyof typeof parameters
    const currentEnergy = parameters[energyKey] as number
    const newEnergy = action === 'increase' 
      ? Math.min(currentEnergy + 1000, 20000)
      : Math.max(currentEnergy - 1000, 0)
    
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/energy_control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal_id: portal,
          action: action,
          amount: 1000
        })
      })
      
      if (response.ok) {
        setParameters(prev => ({
          ...prev,
          [energyKey]: newEnergy
        }))
        console.log(`Portal ${portal} energy ${action}d to ${newEnergy}J`)
      }
    } catch (error) {
      console.error(`Error ${action}ing energy for portal ${portal}:`, error)
    }
  }

  const resetEnergyToIdle = async () => {
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      await fetch(`${backendUrl}/api/reset_system`, { method: 'POST' })
      
      setParameters(prev => ({
        ...prev,
        energy1: 0,
        energy2: 0
      }))
      setEnergyState({
        portal1Active: false,
        portal2Active: false
      })
      console.log('All energy systems reset to idle state')
    } catch (error) {
      console.error('Error resetting energy systems:', error)
    }
  }

  const isPortalActive = portalNumber === 1 ? energyState.portal1Active : energyState.portal2Active
  const currentEnergy = portalNumber === 1 ? parameters.energy1 : parameters.energy2
  const currentFrequency = portalNumber === 1 ? parameters.frequency1 : parameters.frequency2

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-yellow-400 mb-4">
        Portal {portalNumber} Energy Management
      </div>
      
      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Energy State Control</div>
        <div className="space-y-3">
          <div className="bg-gray-700 border border-gray-500 rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white font-semibold">Portal {portalNumber} Energy State:</span>
              <button
                onClick={() => toggleEnergyState(portalNumber)}
                className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                  isPortalActive
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isPortalActive ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="text-xs text-gray-400">
              {isPortalActive ? 'Energy systems active - ready for operations' : 'Energy systems offline - portal inactive'}
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Portal {portalNumber} Energy Level (J)</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="range"
                min="0"
                max="20000"
                step="100"
                value={currentEnergy}
                onChange={(e) => handleParameterChange(portalNumber === 1 ? 'energy1' : 'energy2', Number(e.target.value))}
                disabled={!isPortalActive}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
              />
              <span className={`font-mono text-sm w-20 font-bold ${
                isPortalActive ? 'text-yellow-300' : 'text-gray-500'
              }`}>
                {currentEnergy} J
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => adjustEnergy(portalNumber, 'decrease')}
                disabled={!isPortalActive || currentEnergy <= 0}
                className="px-2 py-1 rounded text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Decrease (-1kJ)
              </button>
              <button
                onClick={resetEnergyToIdle}
                className="px-2 py-1 rounded text-xs font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => adjustEnergy(portalNumber, 'increase')}
                disabled={!isPortalActive || currentEnergy >= 20000}
                className="px-2 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Increase (+1kJ)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Frequency Parameters (Empirical Schumann Resonance)</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Portal {portalNumber} Frequency (Hz)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="7.0"
                max="8.5"
                step="0.01"
                value={currentFrequency}
                onChange={(e) => handleParameterChange(portalNumber === 1 ? 'frequency1' : 'frequency2', Number(e.target.value))}
                disabled={!isPortalActive}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
              />
              <span className={`font-mono text-sm w-16 font-bold ${
                isPortalActive ? 'text-cyan-300' : 'text-gray-500'
              }`}>
                {currentFrequency.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Empirical range: 7.0-8.5 Hz (Earth electromagnetic cavity resonance)
            </div>
            {!isPortalActive && (
              <div className="text-xs text-red-400 mt-1">
                ⚠️ Energy must be ON to adjust frequency parameters
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-2">Bridge Activation Status</div>
        <div className={`p-2 rounded border ${
          isPortalActive && currentEnergy > 1000 
            ? 'bg-green-800 border-green-400' 
            : 'bg-red-800 border-red-400'
        }`}>
          <div className={`text-xs font-bold ${
            isPortalActive && currentEnergy > 1000 ? 'text-green-100' : 'text-red-100'
          }`}>
            {isPortalActive && currentEnergy > 1000 
              ? '✅ BRIDGE READY - Energy sufficient for bridge formation' 
              : '❌ BRIDGE NOT READY - Energy insufficient or offline'}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Minimum energy required: 1000J | Current: {currentEnergy}J
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnergyControls_v2
