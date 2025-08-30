# Dual Portal Stargate Simulation System

A comprehensive simulation system for dual portal stargate operations with scientific parameters, safety monitoring, and multi-monitor display capabilities.

## System Overview

This simulation implements a dual portal stargate system with:
- Quantum resonance portal modeling
- Bridge formation and stability analysis
- Real-time safety monitoring
- Multi-monitor display interfaces
- Comprehensive data logging and audit trails
- Hardware integration capabilities
- Parameter sweep optimization
- 3D visualization and replay functionality

## Module Structure

### Version 1 (Core Modules)
1. **config.py** - Physical constants and configuration management
2. **portal.py** - Portal and resonance model implementation
3. **dualportal.py** - Dual portal interaction and bridge logic
4. **display.py** - Three-monitor display interfaces
5. **main_sim.py** - Main simulation runner and system integration
6. **logger.py** - Data logging, export, and audit functionality

### Version 2 (Advanced Extensions)
7. **hardware.py** - Sensor, power, and hardware interface stubs
8. **sweep.py** - Parameter sweep and auto-optimization
9. **visualization.py** - Simulation replay and 3D visualization
10. **test_harness.py** - Integration tests and error handling
11. **peer_export.py** - Peer review and documentation export

## Quick Start

### Basic Simulation Run
```bash
python main_sim.py
```

### Run Integration Tests
```bash
python test_harness.py
```

### Parameter Sweep Analysis
```bash
python sweep.py
```

### Hardware Interface Demo
```bash
python hardware.py
```

## Key Features

### Safety Systems
- Liquid nitrogen temperature monitoring (-195.8°C threshold)
- Floor contact sensors for payload safety
- Tesla Powerwall battery management with failsafe
- Dual independent failsafe blocks

### Scientific Parameters
- Bio-safe resonance frequency: 32.0 Hz
- Tesla Powerwall peak supply: 13.5 kW per portal
- Empirical detuning for bridge formation: 0.08 Hz
- Damping range: 0.02 - 0.12 for optimal coherence

### Display System
- Monitor 1: Stargate 1 status and metrics
- Monitor 2: Stargate 2 status and metrics  
- Monitor 3: Central bridge and system overview
- Real-time updates with safety status indicators

### Data Management
- CSV export for numerical analysis
- JSON audit logs for compliance
- Peer review package generation
- Automated documentation export

## Configuration

The system uses empirically-determined constants but supports configuration override via JSON files. Key parameters include:

- Resonance frequency (1-100 Hz, bio-safe range)
- Energy delivery rates (Tesla Powerwall specs)
- Safety thresholds (LN2 temperature limits)
- Payload volume and mass parameters

## Hardware Integration

The hardware module provides stub interfaces for:
- Temperature sensors (ADC/serial integration ready)
- Contact sensors (GPIO/switch input ready)
- Tesla battery management (API integration ready)
- Failsafe systems (relay/cutoff integration ready)
- Environmental monitoring (pressure, humidity, ELF)

## Visualization

- 3D multi-element portal geometry rendering
- Real-time bridge formation visualization
- Parameter sweep result matrices
- Time-series replay of simulation runs
- Movie-style playback with pause/rewind

## Testing

Comprehensive integration tests cover:
- Configuration validation
- Portal physics and bridge formation
- Safety system responses
- Display panel updates
- Data logging and export
- Hardware interface stubs

## Deployment Options

### Local (Single Computer)
Run all scripts directly with multiple terminals/monitors

### Remote/Distributed  
Deploy display modules on networked workstations with shared logging

### Documentation/Compliance
Use peer_export.py for archival, review, and result sharing

## Dependencies

- numpy (numerical operations)
- scipy (ODE integration)
- matplotlib (plotting and display)
- pandas (data analysis, optional for sweeps)

## Safety Notice

This simulation includes realistic safety parameters for liquid nitrogen systems and high-power electrical equipment. When adapting for real hardware:

1. Verify all temperature thresholds match your cryogenic setup
2. Implement proper electrical isolation and failsafe systems  
3. Follow all applicable safety protocols for high-voltage systems
4. Ensure emergency shutdown procedures are tested and accessible

## License

This simulation system is provided for research and educational purposes.
