import React, { useState } from 'react'
import './SliderStyles.css'

interface EnergyControlsProps {
  portalNumber: number;
}

const EnergyControls: React.FC<EnergyControlsProps> = ({ portalNumber }) => {
  const [parameters, setParameters] = useState({
    energy1: 1000,
    energy2: 1000,
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

  const toggleEnergyState = (portal: number) => {
    const stateKey = `portal${portal}Active` as keyof typeof energyState
    setEnergyState(prev => ({
      ...prev,
      [stateKey]: !prev[stateKey]
    }))
    
    if (!energyState[stateKey]) {
      console.log(`Portal ${portal} energy activated`)
    } else {
      console.log(`Portal ${portal} energy deactivated`)
      setParameters(prev => ({
        ...prev,
        [`energy${portal}`]: 0
      }))
    }
  }

  const increaseEnergy = (portal: number) => {
    const energyKey = `energy${portal}` as keyof typeof parameters
    setParameters(prev => ({
      ...prev,
      [energyKey]: Math.min((prev[energyKey] as number) + 1000, 20000)
    }))
  }

  const decreaseEnergy = (portal: number) => {
    const energyKey = `energy${portal}` as keyof typeof parameters
    setParameters(prev => ({
      ...prev,
      [energyKey]: Math.max((prev[energyKey] as number) - 1000, 0)
    }))
  }

  const resetEnergyToIdle = () => {
    setParameters(prev => ({
      ...prev,
      energy1: 0,
      energy2: 0
    }))
    setEnergyState({
      portal1Active: false,
      portal2Active: false
    })
  }

  return (
    <div className="space-y-4 mt-4 border-t border-gray-600 pt-4">
      <div className="text-sm text-gray-200 font-semibold mb-3">Portal {portalNumber} Parameter Controls</div>
      
      {/* Energy Controls */}
      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Energy Parameters</div>
        <div className="space-y-3">
          {/* Energy State Control */}
          <div className="bg-gray-700 border border-gray-500 rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white font-semibold">Portal {portalNumber} Energy State:</span>
              <button
                onClick={() => toggleEnergyState(portalNumber)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  (portalNumber === 1 ? energyState.portal1Active : energyState.portal2Active)
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {(portalNumber === 1 ? energyState.portal1Active : energyState.portal2Active) ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Portal {portalNumber} Energy (J)</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="range"
                min="0"
                max="20000"
                step="100"
                value={portalNumber === 1 ? parameters.energy1 : parameters.energy2}
                onChange={(e) => handleParameterChange(portalNumber === 1 ? 'energy1' : 'energy2', Number(e.target.value))}
                disabled={!(portalNumber === 1 ? energyState.portal1Active : energyState.portal2Active)}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-yellow-300 font-mono text-sm w-16 font-bold">
                {portalNumber === 1 ? parameters.energy1 : parameters.energy2}
              </span>
            </div>
            
            {/* Increase/Decrease Controls */}
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => decreaseEnergy(portalNumber)}
                disabled={!(portalNumber === 1 ? energyState.portal1Active : energyState.portal2Active)}
                className="px-2 py-1 rounded text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Decrease
              </button>
              <button
                onClick={resetEnergyToIdle}
                className="px-2 py-1 rounded text-xs font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => increaseEnergy(portalNumber)}
                disabled={!(portalNumber === 1 ? energyState.portal1Active : energyState.portal2Active)}
                className="px-2 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Increase
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Controls */}
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
                value={portalNumber === 1 ? parameters.frequency1 : parameters.frequency2}
                onChange={(e) => handleParameterChange(portalNumber === 1 ? 'frequency1' : 'frequency2', Number(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-cyan-300 font-mono text-sm w-16 font-bold">
                {(portalNumber === 1 ? parameters.frequency1 : parameters.frequency2).toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Empirical range: 7.0-8.5 Hz (Earth electromagnetic cavity resonance)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnergyControls
