import React, { useState } from 'react'

interface PayloadControlsProps {
  portalNumber?: number;
}

const PayloadControls_v2: React.FC<PayloadControlsProps> = () => {
  const [parameters, setParameters] = useState({
    payloadVolume: 0.1,
    payloadMass: 1.93,
    payloadType: 'Gold'
  })

  const [payloadAssignment, setPayloadAssignment] = useState({
    portal1: null as string | null,
    portal2: null as string | null,
    loadingBay: 'Gold - 1.93 kg' as string | null
  })

  const materialDensities = {
    'Gold': 19.3,
    'Lead': 11.34,
    'Iron': 7.87,
    'Aluminum': 2.70,
    'Water': 1.0,
    'Air': 0.001225,
    'Titanium': 4.51,
    'Copper': 8.96,
    'Silver': 10.49,
    'Platinum': 21.45
  }

  const handleParameterChange = (param: string, value: number | string) => {
    setParameters(prev => {
      const newParams = { ...prev, [param]: value }
      
      if (param === 'payloadType' || param === 'payloadVolume') {
        const density = materialDensities[newParams.payloadType as keyof typeof materialDensities] || 1.0
        newParams.payloadMass = Number((newParams.payloadVolume * density).toFixed(2))
      }
      
      return newParams
    })
  }

  const commitPayload = async (portalId: number) => {
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/load_payload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          portal_id: portalId,
          volume: parameters.payloadVolume,
          mass: parameters.payloadMass,
          material: parameters.payloadType
        })
      })
      
      const data = await response.json()
      console.log(`Payload committed to Portal ${portalId}:`, data)
      
      const payloadDescription = `${parameters.payloadType} - ${parameters.payloadMass} kg`
      setPayloadAssignment(prev => ({
        ...prev,
        [`portal${portalId}`]: payloadDescription,
        loadingBay: null
      }))
    } catch (error) {
      console.error(`Error committing payload to Portal ${portalId}:`, error)
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
    console.log('All payloads cleared after successful transfer')
  }

  const resetToIdleState = async () => {
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/reset_system`, {
        method: 'POST'
      })
      
      if (response.ok) {
        clearPayloadAfterTransfer()
        console.log('System reset to idle state - all payloads cleared, energy off, gates unlocked')
      } else {
        console.error('Failed to reset system on backend')
      }
    } catch (error) {
      console.error('Error resetting system:', error)
      clearPayloadAfterTransfer()
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-green-400 mb-4">Payload Configuration</div>
      
      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Material Selection & Properties</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Material Type</label>
            <select
              value={parameters.payloadType}
              onChange={(e) => handleParameterChange('payloadType', e.target.value)}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-500 rounded text-white text-sm"
            >
              {Object.keys(materialDensities).map(material => (
                <option key={material} value={material}>{material}</option>
              ))}
            </select>
            <div className="text-xs text-gray-400 mt-1">
              Density: {materialDensities[parameters.payloadType as keyof typeof materialDensities]} kg/m³
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Volume (m³)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.01"
                max="2.0"
                step="0.01"
                value={parameters.payloadVolume}
                onChange={(e) => handleParameterChange('payloadVolume', Number(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-green-300 font-mono text-sm w-16 font-bold">
                {parameters.payloadVolume.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Calculated Mass (kg)</label>
            <div className="bg-gray-700 border border-gray-500 rounded px-2 py-1">
              <span className="text-yellow-300 font-mono text-sm font-bold">
                {parameters.payloadMass.toFixed(2)} kg
              </span>
              <span className="text-xs text-gray-400 ml-2">
                (Auto-calculated from volume × density)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Loading Bay Status</div>
        <div className="space-y-2">
          <div className="bg-gray-700 border border-gray-500 rounded p-2">
            <div className="text-xs text-white mb-1 font-semibold">Current Payload Ready:</div>
            <div className="text-sm text-cyan-100 font-mono font-bold">
              {payloadAssignment.loadingBay || 'No payload configured'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => commitPayload(1)}
              disabled={!payloadAssignment.loadingBay}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                !payloadAssignment.loadingBay
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Load → Portal 1
            </button>
            <button
              onClick={() => commitPayload(2)}
              disabled={!payloadAssignment.loadingBay}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                !payloadAssignment.loadingBay
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Load → Portal 2
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Portal Assignment Status</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-300">Portal 1:</span>
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              payloadAssignment.portal1 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {payloadAssignment.portal1 || 'Empty'}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-300">Portal 2:</span>
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              payloadAssignment.portal2 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {payloadAssignment.portal2 || 'Empty'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded p-3">
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
            Reset to Idle State
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          Use after successful transfer to clear payloads and reset system
        </div>
      </div>
    </div>
  )
}

export default PayloadControls_v2
