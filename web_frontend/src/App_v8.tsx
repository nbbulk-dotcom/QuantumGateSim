import { useState, useEffect } from 'react'
import PortalDisplay from './components/PortalDisplay'
import BridgeDisplay from './components/BridgeDisplay'
import PayloadControls_v2 from './components/PayloadControls_v2'
import EnergyControls_v2 from './components/EnergyControls_v2'
import OperationsControls_v2 from './components/OperationsControls_v2'
import Portal3D from './components/Portal3D'
import './components/SliderStyles.css'

interface SimulationData {
  status: string;
  run_id?: string;
  portal1?: any;
  portal2?: any;
  bridge_strength?: number;
  transfer_energy?: number;
  detune?: number;
  status_log?: string[];
}

function App_v8() {
  const [simulationData, setSimulationData] = useState<SimulationData>({ status: 'idle' })
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
    const wsUrl = backendUrl.replace('http', 'ws') + '/ws'
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setWsConnected(true)
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setSimulationData(data)
      } catch (error) {
        console.error('Error parsing WebSocket data:', error)
      }
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setWsConnected(false)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setWsConnected(false)
    }
    
    return () => {
      ws.close()
    }
  }, [])

  const initializeSimulation = async () => {
    try {
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${backendUrl}/api/initialize`, {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Simulation initialized:', data)
    } catch (error) {
      console.error('Error initializing simulation:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">
            Stargate Simulation System v8
          </h1>
          <div className="text-lg text-gray-300 mb-4">
            Dual Portal Resonance Bridge with Empirical Physics
          </div>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`flex items-center space-x-2 ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-mono">
                WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={initializeSimulation}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
            >
              Initialize Simulation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <PortalDisplay 
                portalNumber={1}
                title="Portal 1 - Origin Gate"
                portal={simulationData.portal1}
              />
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <PayloadControls_v2 />
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <EnergyControls_v2 portalNumber={1} />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <BridgeDisplay simulationData={simulationData} />
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <OperationsControls_v2 />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <PortalDisplay 
                portalNumber={2}
                title="Portal 2 - Destination Gate"
                portal={simulationData.portal2}
              />
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <EnergyControls_v2 portalNumber={2} />
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <Portal3D title="Portal 3D Visualization" />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">
              System Status: <span className="text-white font-mono">{simulationData.status}</span>
            </div>
            {simulationData.run_id && (
              <div className="text-xs text-gray-500">
                Run ID: {simulationData.run_id}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-black border border-white rounded-lg p-6">
          <div className="text-white text-center mb-4">
            <h2 className="text-xl font-bold mb-2">📚 STARGATE OPERATING DOCUMENTATION</h2>
            <p className="text-sm text-gray-300">Complete guides for system operation, parameters, and displays</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <a 
                href="/STARGATE_OPERATING_MANUAL.md" 
                target="_blank" 
                className="block bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded p-3 transition-colors"
              >
                <div className="text-lg mb-1">📖</div>
                <div className="text-xs font-bold text-white">Operating Manual</div>
              </a>
              <a 
                href="/STARGATE_OPERATING_MANUAL.md" 
                download 
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
              >
                Download
              </a>
            </div>
            
            <div className="text-center">
              <a 
                href="/PARAMETER_GUIDE.md" 
                target="_blank" 
                className="block bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded p-3 transition-colors"
              >
                <div className="text-lg mb-1">⚙️</div>
                <div className="text-xs font-bold text-white">Parameter Guide</div>
              </a>
              <a 
                href="/PARAMETER_GUIDE.md" 
                download 
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
              >
                Download
              </a>
            </div>
            
            <div className="text-center">
              <a 
                href="/DISPLAY_SYSTEMS_GUIDE.md" 
                target="_blank" 
                className="block bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded p-3 transition-colors"
              >
                <div className="text-lg mb-1">🖥️</div>
                <div className="text-xs font-bold text-white">Display Systems</div>
              </a>
              <a 
                href="/DISPLAY_SYSTEMS_GUIDE.md" 
                download 
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
              >
                Download
              </a>
            </div>
            
            <div className="text-center">
              <a 
                href="/CENTRAL_COMMAND_GUIDE.md" 
                target="_blank" 
                className="block bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded p-3 transition-colors"
              >
                <div className="text-lg mb-1">🎛️</div>
                <div className="text-xs font-bold text-white">Central Command</div>
              </a>
              <a 
                href="/CENTRAL_COMMAND_GUIDE.md" 
                download 
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App_v8
