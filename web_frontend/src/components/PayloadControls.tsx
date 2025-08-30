import React, { useState } from 'react'
import './SliderStyles.css'

const PayloadControls: React.FC = () => {
  const [parameters, setParameters] = useState({
    payloadVolume: 0.1,
    payloadMass: 75.0,
    payloadType: 'Gold'
  })

  const [payloadAssignment, setPayloadAssignment] = useState<{
    portal1: { type: string; volume: number; mass: number } | null;
    portal2: { type: string; volume: number; mass: number } | null;
    loadingBay: { type: string; volume: number; mass: number } | null;
  }>({
    portal1: null,
    portal2: null,
    loadingBay: {
      type: parameters.payloadType,
      volume: parameters.payloadVolume,
      mass: parameters.payloadMass
    }
  })

  const payloadTypes = [
    { value: 'Gold', density: 19300, densityDisplay: 19.3, description: 'Precious metal - Extremely high density', color: '#FFD700' },
    { value: 'Wood', density: 600, densityDisplay: 0.6, description: 'Organic material - Low density variable', color: '#8B4513' },
    { value: 'Aluminum', density: 2700, densityDisplay: 2.7, description: 'Light metal - Medium density', color: '#C0C0C0' },
    { value: 'Biological', density: 1000, densityDisplay: 1.0, description: 'Living tissue - Water-based density', color: '#90EE90' }
  ]

  const handleParameterChange = (param: string, value: number | string) => {
    const currentMaterial = payloadTypes.find(t => t.value === (param === 'payloadType' ? value as string : parameters.payloadType))
    const density = currentMaterial?.density || 1000 // kg/m³
    
    let newVolume = parameters.payloadVolume
    let newMass = parameters.payloadMass
    let newType = parameters.payloadType
    
    if (param === 'payloadType') {
      newType = value as string
      newMass = newVolume * density
    } else if (param === 'payloadVolume') {
      newVolume = value as number
      newMass = newVolume * density
    } else if (param === 'payloadMass') {
      newMass = value as number
      newVolume = newMass / density
    }
    
    setParameters({
      payloadVolume: newVolume,
      payloadMass: newMass,
      payloadType: newType
    })
    
    setPayloadAssignment(prev => ({
      ...prev,
      loadingBay: {
        type: newType,
        volume: newVolume,
        mass: newMass
      }
    }))
  }

  const commitPayloadToGate = async (gateNumber: number) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/load_payload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          portal_id: gateNumber,
          payload_type: parameters.payloadType,
          payload_volume: parameters.payloadVolume,
          payload_mass: parameters.payloadMass
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`Payload committed to gate ${gateNumber}:`, data)
      
      setPayloadAssignment(prev => ({
        ...prev,
        [`portal${gateNumber}`]: {
          type: parameters.payloadType,
          volume: parameters.payloadVolume,
          mass: parameters.payloadMass
        },
        loadingBay: null
      }))
    } catch (error) {
      console.error(`Error committing payload to gate ${gateNumber}:`, error)
    }
  }

  const clearPayloadAfterTransfer = () => {
    setParameters({
      payloadVolume: 0.0,
      payloadMass: 0.0,
      payloadType: 'Gold'
    })
    
    setPayloadAssignment({
      portal1: null,
      portal2: null,
      loadingBay: null
    })
  }

  const resetToIdleState = () => {
    clearPayloadAfterTransfer()
    console.log('System reset to idle state - all payloads cleared')
  }

  return (
    <div className="space-y-4 mt-4 border-t border-gray-600 pt-4">
      <div className="text-sm text-gray-200 font-semibold mb-3">Payload Configuration</div>
      
      {/* Payload Controls */}
      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Payload Configuration</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Payload Type</label>
            <select
              value={parameters.payloadType}
              onChange={(e) => handleParameterChange('payloadType', e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-400 focus:outline-none"
            >
              {payloadTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.value} - {type.description} (ρ={type.densityDisplay} g/cm³)
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-gray-400">
              <span style={{color: payloadTypes.find(t => t.value === parameters.payloadType)?.color}}>●</span>
              {' '}Density: {payloadTypes.find(t => t.value === parameters.payloadType)?.density} kg/m³ (FIXED)
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Payload Volume (m³)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.01"
                max="1.0"
                step="0.01"
                value={parameters.payloadVolume}
                onChange={(e) => handleParameterChange('payloadVolume', Number(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-green-300 font-mono text-sm w-16 font-bold">{parameters.payloadVolume.toFixed(3)}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Auto-calculates mass when changed
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-white mb-1 font-semibold">Payload Mass (kg)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="20000"
                step="1"
                value={parameters.payloadMass}
                onChange={(e) => handleParameterChange('payloadMass', Number(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-green-300 font-mono text-sm w-20 font-bold">{parameters.payloadMass.toFixed(1)}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Auto-calculates volume when changed
            </div>
          </div>
          
          <div className="bg-gray-700 border border-gray-500 rounded p-2">
            <div className="text-xs text-yellow-200 mb-1 font-semibold">Material Properties (FIXED RATIOS):</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-300">Volume:</span>
                <div className="text-green-300 font-mono font-bold">{parameters.payloadVolume.toFixed(3)} m³</div>
              </div>
              <div>
                <span className="text-gray-300">Mass:</span>
                <div className="text-green-300 font-mono font-bold">{parameters.payloadMass.toFixed(1)} kg</div>
              </div>
              <div>
                <span className="text-gray-300">Density:</span>
                <div className="text-yellow-300 font-mono font-bold">{payloadTypes.find(t => t.value === parameters.payloadType)?.density} kg/m³</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Formula: Mass = Volume × Density (ratio cannot be changed)
            </div>
          </div>
          
          {/* Payload Loading Controls */}
          <div className="border-t border-gray-600 pt-3">
            <div className="text-xs text-white mb-2 font-bold">Payload Assignment</div>
            
            {/* Loading Bay Status */}
            <div className="bg-gray-700 border border-gray-500 rounded p-2 mb-3">
              <div className="text-xs text-yellow-200 mb-1 font-semibold">Loading Bay:</div>
              <div className="text-sm text-yellow-100 font-mono font-bold">
                {parameters.payloadType} - {parameters.payloadVolume.toFixed(3)}m³ - {parameters.payloadMass.toFixed(1)}kg
              </div>
              <div className="text-xs text-gray-300">
                Density: {payloadTypes.find(t => t.value === parameters.payloadType)?.density} kg/m³ | Ready for portal assignment
              </div>
            </div>
            
            {/* Portal Assignment Status */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className={`px-3 py-2 rounded text-center text-sm ${
                payloadAssignment.portal1 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-200'
              }`}>
                <div className="font-medium">Portal 1</div>
                <div className="text-xs">
                  {payloadAssignment.portal1 
                    ? `${payloadAssignment.portal1.type} (${payloadAssignment.portal1.mass.toFixed(1)}kg)`
                    : 'Empty'
                  }
                </div>
              </div>
              
              <div className={`px-3 py-2 rounded text-center text-sm ${
                payloadAssignment.portal2 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-200'
              }`}>
                <div className="font-medium">Portal 2</div>
                <div className="text-xs">
                  {payloadAssignment.portal2 
                    ? `${payloadAssignment.portal2.type} (${payloadAssignment.portal2.mass.toFixed(1)}kg)`
                    : 'Empty'
                  }
                </div>
              </div>
            </div>
            
            {/* Commit Payload Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => commitPayloadToGate(1)}
                disabled={!!payloadAssignment.portal1}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  payloadAssignment.portal1
                    ? 'bg-gray-800 cursor-not-allowed text-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {payloadAssignment.portal1 ? 'Portal 1 Loaded' : 'Commit to Gate 1'}
              </button>
              
              <button
                onClick={() => commitPayloadToGate(2)}
                disabled={!!payloadAssignment.portal2}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  payloadAssignment.portal2
                    ? 'bg-gray-800 cursor-not-allowed text-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {payloadAssignment.portal2 ? 'Portal 2 Loaded' : 'Commit to Gate 2'}
              </button>
            </div>
            
            {/* System Reset Controls */}
            <div className="border-t border-gray-600 pt-3">
              <div className="text-xs text-white mb-2 font-bold">Post-Transfer Controls</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={clearPayloadAfterTransfer}
                  className="px-3 py-2 rounded text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
                >
                  Clear All Payloads
                </button>
                
                <button
                  onClick={resetToIdleState}
                  className="px-3 py-2 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Reset to Idle
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Use after successful transfer to reset system to default state
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PayloadControls
