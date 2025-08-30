import React, { useState } from 'react'
import './SliderStyles.css'

const OperationsControls: React.FC = () => {
  const [parameters, setParameters] = useState({
    sweepRange: 10.0
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
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/parameter_sweep?range=${parameters.sweepRange}`, {
        method: 'POST'
      })
      const data = await response.json()
      setSweepResults(data.results || [])
      console.log('Parameter sweep results:', data)
      
      setTimeout(() => evaluateSweepResults(), 100)
    } catch (error) {
      console.error('Error running parameter sweep:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const evaluateSweepResults = () => {
    if (sweepResults.length === 0) return
    
    const optimal = sweepResults.reduce((best, current) => 
      current.bridge_strength > best.bridge_strength ? current : best
    )
    
    const avgStrength = sweepResults.reduce((sum, r) => sum + r.bridge_strength, 0) / sweepResults.length
    const minAcceptableStrength = 0.5
    
    const approved = optimal.bridge_strength >= minAcceptableStrength
    const criteria = `Bridge strength ≥ ${minAcceptableStrength} (Optimal: ${optimal.bridge_strength.toFixed(3)})`
    const report = `Sweep evaluated ${sweepResults.length} configurations. Average strength: ${avgStrength.toFixed(3)}. ${approved ? 'APPROVED' : 'REJECTED'} based on safety criteria.`
    
    setSweepApprovalStatus({ approved, criteria, report })
  }

  const applyOptimalParameters = async () => {
    if (!sweepApprovalStatus?.approved) {
      alert('Cannot apply parameters - sweep results not approved')
      return
    }
    
    try {
      const optimal = sweepResults.reduce((best, current) => 
        current.bridge_strength > best.bridge_strength ? current : best
      )
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/apply_optimal_parameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(optimal)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Applied optimal parameters:', data)
    } catch (error) {
      console.error('Error applying optimal parameters:', error)
    }
  }

  const unlockAllPortals = () => {
    setStargateStatus({
      portal1: 'UNLOCKED',
      portal2: 'UNLOCKED'
    })
    setTransportReady(false)
    console.log('All portals unlocked - system reset to default state')
  }

  const scanStargateContents = async (portalId: number) => {
    setIsScanning(true)
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
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
        throw new Error(`Scan failed with status: ${response.status}`)
      }
      
      const data = await response.json()
      setScanResults(data)
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

  const lockStargateForTransport = async (portalId: number) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/lock_portal?portal_id=${portalId}`, {
        method: 'POST'
      })
      const data = await response.json()
      console.log(`Portal ${portalId} lock result:`, data)
      
      setStargateStatus(prev => ({
        ...prev,
        [`portal${portalId}`]: data.locked ? 'LOCKED' : 'IDLE'
      }))
      
      if (stargateStatus.portal1 === 'LOCKED' && stargateStatus.portal2 === 'LOCKED') {
        setTransportReady(true)
      }
    } catch (error) {
      console.error(`Error locking portal ${portalId}:`, error)
    }
  }

  return (
    <div className="space-y-4 mt-4 border-t border-gray-600 pt-4">
      <div className="text-sm text-gray-200 font-semibold mb-3">Operations & Optimization</div>
      
      {/* Parameter Sweep Controls */}
      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Parameter Optimization</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Sweep Range (±J)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={parameters.sweepRange}
                onChange={(e) => handleParameterChange('sweepRange', Number(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-gray-600 to-gray-500 border border-gray-400 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-purple-300 font-mono text-sm w-16 font-bold">±{parameters.sweepRange}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={runParameterSweep}
              disabled={isRunning}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isRunning 
                  ? 'bg-gray-800 cursor-not-allowed text-gray-400' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isRunning ? 'Running...' : 'Run Parameter Sweep'}
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
              Apply Optimal
            </button>
          </div>
        </div>
      </div>

      {/* Stargate Scanning & Transport Controls */}
      <div className="bg-gray-800 border border-gray-600 rounded p-3">
        <div className="text-xs text-gray-200 mb-3">Stargate Operations</div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => scanStargateContents(1)}
              disabled={isScanning}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                isScanning 
                  ? 'bg-gray-800 cursor-not-allowed text-gray-400' 
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {isScanning ? 'Scanning...' : 'Scan Portal 1'}
            </button>
            
            <button
              onClick={() => scanStargateContents(2)}
              disabled={isScanning}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                isScanning 
                  ? 'bg-gray-800 cursor-not-allowed text-gray-400' 
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
                {scanResults.error ? 'Scan Error:' : 'Last Scan Results:'}
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
                  {new Date(scanResults.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
          
          <div className="border-t border-gray-600 pt-3">
            <div className="text-xs text-white mb-2 font-semibold">Transport Lock Status</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className={`px-3 py-2 rounded text-center text-sm font-bold ${
                stargateStatus.portal1 === 'LOCKED' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-white border border-gray-400'
              }`}>
                Portal 1: {stargateStatus.portal1}
              </div>
              
              <div className={`px-3 py-2 rounded text-center text-sm font-bold ${
                stargateStatus.portal2 === 'LOCKED' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-white border border-gray-400'
              }`}>
                Portal 2: {stargateStatus.portal2}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => lockStargateForTransport(1)}
                disabled={stargateStatus.portal1 === 'LOCKED'}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  stargateStatus.portal1 === 'LOCKED'
                    ? 'bg-gray-800 cursor-not-allowed text-gray-400'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                Lock Portal 1
              </button>
              
              <button
                onClick={() => lockStargateForTransport(2)}
                disabled={stargateStatus.portal2 === 'LOCKED'}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  stargateStatus.portal2 === 'LOCKED'
                    ? 'bg-gray-800 cursor-not-allowed text-gray-400'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                Lock Portal 2
              </button>
            </div>
            
            {transportReady && (
              <div className="mt-3 p-2 bg-green-600 rounded text-center">
                <div className="text-white font-bold text-sm">🔒 READY FOR TRANSPORT</div>
                <div className="text-xs text-green-100">Bridge formation can now be activated</div>
              </div>
            )}
            
            {/* System Reset Controls */}
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
      </div>

      {/* Sweep Results Visualization */}
      {sweepResults.length > 0 && (
        <div className="bg-gray-800 border border-gray-600 rounded p-3">
          <div className="text-xs text-white mb-3 font-bold">Optimization Results</div>
          <div className="space-y-2">
            <div className="text-xs text-white font-semibold">
              Best Bridge Strength: {Math.max(...sweepResults.map(r => r.bridge_strength)).toFixed(3)}
            </div>
            
            {/* Approval Status */}
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
                  className="bg-gray-700 border border-gray-400 rounded p-1 text-center"
                  style={{
                    backgroundColor: `rgba(34, 197, 94, ${result.bridge_strength})`
                  }}
                >
                  <div className="text-xs text-white font-mono">
                    {result.bridge_strength.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OperationsControls
