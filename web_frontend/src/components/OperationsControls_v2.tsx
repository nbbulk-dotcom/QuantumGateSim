import React, { useState } from 'react'

const OperationsControls_v2: React.FC = () => {
  const [parameters, setParameters] = useState({
    sweepRangeEnergy: 1000,
    sweepRangeFreq: 0.5
  })
  const [sweepResults, setSweepResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [scanResults, setScanResults] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [transportReady, setTransportReady] = useState(false)
  const [stargateStatus, setStargateStatus] = useState({
    portal1: 'UNLOCKED',
    portal2: 'UNLOCKED'
  })
  const [sweepApprovalStatus, setSweepApprovalStatus] = useState<{
    approved: boolean;
    criteria: string;
    report: string;
  } | null>(null)

  const handleParameterChange = (param: string, value: number) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }))
  }

  const runParameterSweep = async () => {
    setIsRunning(true)
    setSweepApprovalStatus(null)
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/parameter_sweep?energy_range=${parameters.sweepRangeEnergy}&freq_range=${parameters.sweepRangeFreq}`, {
        method: 'POST'
      })
      const data = await response.json()
      setSweepResults(data.results || [])
      console.log('Parameter sweep results:', data)
      
      setTimeout(() => evaluateSweepResults(data.results || []), 100)
    } catch (error) {
      console.error('Error running parameter sweep:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const evaluateSweepResults = (results: any[]) => {
    if (results.length === 0) return
    
    const optimal = results.reduce((best, current) => 
      current.bridge_strength > best.bridge_strength ? current : best
    )
    
    const avgStrength = results.reduce((sum, r) => sum + r.bridge_strength, 0) / results.length
    const minAcceptableStrength = 0.5
    
    const approved = optimal.bridge_strength >= minAcceptableStrength
    const criteria = `Bridge strength ≥ ${minAcceptableStrength} (Optimal: ${optimal.bridge_strength.toFixed(3)})`
    const report = `Sweep evaluated ${results.length} configurations. Average strength: ${avgStrength.toFixed(3)}. ${approved ? 'APPROVED' : 'REJECTED'} based on safety criteria.`
    
    setSweepApprovalStatus({ approved, criteria, report })
  }

  const applyOptimalParameters = async () => {
    if (!sweepApprovalStatus?.approved) {
      alert('Cannot apply parameters - sweep results not approved. Bridge strength must be ≥ 0.5 for safety.')
      return
    }
    
    try {
      const optimal = sweepResults.reduce((best, current) => 
        current.bridge_strength > best.bridge_strength ? current : best
      )
      
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/apply_optimal_parameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frequency1: optimal.frequency1,
          frequency2: optimal.frequency2,
          energy1: optimal.energy1,
          energy2: optimal.energy2
        })
      })
      
      const data = await response.json()
      console.log('Applied optimal parameters:', data)
      setTransportReady(true)
    } catch (error) {
      console.error('Error applying optimal parameters:', error)
    }
  }

  const unlockAllPortals = async () => {
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/unlock_portals`, { 
        method: 'POST' 
      })
      
      if (response.ok) {
        setStargateStatus({
          portal1: 'UNLOCKED',
          portal2: 'UNLOCKED'
        })
        setTransportReady(false)
        console.log('All portals unlocked - system reset to default state')
      }
    } catch (error) {
      console.error('Error unlocking portals:', error)
      setStargateStatus({
        portal1: 'UNLOCKED',
        portal2: 'UNLOCKED'
      })
      setTransportReady(false)
    }
  }

  const scanStargateContents = async (portalId: number) => {
    setIsScanning(true)
    setScanResults(null)
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(`${backendUrl}/api/scan_portal?portal_id=${portalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Scan failed with status: ${response.status} - ${response.statusText}`)
      }
      
      const data = await response.json()
      setScanResults({
        ...data,
        portal_id: portalId,
        timestamp: new Date().toISOString()
      })
      console.log(`Portal ${portalId} scan results:`, data)
    } catch (error) {
      console.error(`Error scanning portal ${portalId}:`, error)
      setScanResults({
        error: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        portal_id: portalId,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-purple-400 mb-4">Operations & Optimization Controls</div>
      
      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Parameter Sweep Configuration</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Energy Sweep Range (±J)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={parameters.sweepRangeEnergy}
                onChange={(e) => handleParameterChange('sweepRangeEnergy', Number(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-purple-300 font-mono text-sm w-16 font-bold">
                ±{parameters.sweepRangeEnergy}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Frequency Sweep Range (±Hz)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={parameters.sweepRangeFreq}
                onChange={(e) => handleParameterChange('sweepRangeFreq', Number(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-purple-300 font-mono text-sm w-16 font-bold">
                ±{parameters.sweepRangeFreq.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={runParameterSweep}
              disabled={isRunning}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isRunning ? 'Running Sweep...' : 'Run Parameter Sweep'}
            </button>
            
            <button
              onClick={applyOptimalParameters}
              disabled={!sweepApprovalStatus?.approved}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                !sweepApprovalStatus?.approved
                  ? 'bg-gray-800 cursor-not-allowed text-gray-400'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Apply Optimal Parameters
            </button>
          </div>
          
          {!sweepApprovalStatus?.approved && sweepResults.length > 0 && (
            <div className="text-xs text-red-400 bg-red-900 border border-red-600 rounded p-2">
              ⚠️ Parameters cannot be applied - sweep results do not meet safety criteria
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Portal Scanning & Diagnostics</div>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => scanStargateContents(1)}
              disabled={isScanning}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isScanning
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {isScanning ? 'Scanning...' : 'Scan Portal 1'}
            </button>
            <button
              onClick={() => scanStargateContents(2)}
              disabled={isScanning}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isScanning
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {isScanning ? 'Scanning...' : 'Scan Portal 2'}
            </button>
          </div>
          
          {scanResults && (
            <div className={`border rounded p-2 ${
              scanResults.error ? 'bg-red-800 border-red-400' : 'bg-gray-700 border-gray-400'
            }`}>
              <div className="text-xs text-white mb-1 font-semibold">
                {scanResults.error ? 'Scan Error:' : `Portal ${scanResults.portal_id} Scan Results:`}
              </div>
              <div className={`text-sm font-mono font-bold ${
                scanResults.error ? 'text-red-100' : 'text-cyan-100'
              }`}>
                {scanResults.error || scanResults.contents || 'Portal Empty'}
              </div>
              {scanResults.required_params && (
                <div className="text-xs text-yellow-200 mt-1 font-semibold">
                  Required: {scanResults.required_params}
                </div>
              )}
              {scanResults.timestamp && (
                <div className="text-xs text-gray-400 mt-1">
                  Scanned: {new Date(scanResults.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Transport Status & Controls</div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Portal 1:</span>
              <div className={`px-2 py-1 rounded text-xs font-bold ${
                stargateStatus.portal1 === 'LOCKED' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {stargateStatus.portal1}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Portal 2:</span>
              <div className={`px-2 py-1 rounded text-xs font-bold ${
                stargateStatus.portal2 === 'LOCKED' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {stargateStatus.portal2}
              </div>
            </div>
          </div>
          
          {transportReady && (
            <div className="bg-green-800 border border-green-400 rounded p-2">
              <div className="text-xs text-green-100 font-bold">✅ TRANSPORT READY</div>
              <div className="text-xs text-green-100">Bridge formation can now be activated</div>
            </div>
          )}
          
          <div className="border-t border-gray-600 pt-3 mt-3">
            <button
              onClick={unlockAllPortals}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Unlock All Portals & Reset to Idle
            </button>
            <div className="text-xs text-gray-400 mt-1 text-center">
              Use after successful transfer to return gates to default unlocked state
            </div>
          </div>
        </div>
      </div>

      {sweepResults.length > 0 && (
        <div className="bg-gray-800 border border-gray-600 rounded p-3">
          <div className="text-xs text-gray-200 mb-3">Parameter Sweep Results</div>
          <div className="space-y-2">
            <div className="text-xs text-white font-semibold">
              Configurations Tested: {sweepResults.length}
            </div>
            <div className="text-xs text-white font-semibold">
              Best Bridge Strength: {Math.max(...sweepResults.map(r => r.bridge_strength)).toFixed(3)}
            </div>
            
            {sweepApprovalStatus && (
              <div className={`p-2 rounded border ${
                sweepApprovalStatus.approved 
                  ? 'bg-green-800 border-green-400' 
                  : 'bg-red-800 border-red-400'
              }`}>
                <div className={`text-xs font-bold ${
                  sweepApprovalStatus.approved ? 'text-green-100' : 'text-red-100'
                }`}>
                  {sweepApprovalStatus.approved ? '✅ SWEEP APPROVED' : '❌ SWEEP REJECTED'}
                </div>
                <div className="text-xs text-gray-200 mt-1">
                  Criteria: {sweepApprovalStatus.criteria}
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Report: {sweepApprovalStatus.report}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-5 gap-1">
              {sweepResults.slice(0, 10).map((result, index) => (
                <div
                  key={index}
                  className={`p-1 rounded text-xs text-center ${
                    result.bridge_strength > 0.5 ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  {result.bridge_strength.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OperationsControls_v2
