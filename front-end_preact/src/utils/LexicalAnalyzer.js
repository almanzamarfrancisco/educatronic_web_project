import commandsConfig from '../assets/commandTable.json'
export class LexicalAnalyzer {
  constructor() {
    this.CMD_PROGRAM_START = 'CMD_PROGRAM_START'
    this.CMD_PROGRAM_END = 'CMD_PROGRAM_END'
    this.CMD_BLOCK_START = 'CMD_BLOCK_START'
    this.CMD_BLOCK_END = 'CMD_BLOCK_END'
    this.CMD_REGULAR = 'CMD_REGULAR'
    
    this.commandTable = commandsConfig.map(cmd => ({
      ...cmd,
      param_count: cmd.parameters.length,
      role: this[cmd.role],
    }));
  }
  analyze(script) {
    // console.log(`\t[I] Starting syntax analysis... 📝`)
    const lines = script
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    
    let repeatBlockOpen = false
    let programOpened = false
    
    if (lines.length < 2)
      return `Error: El programa debe iniciar con 'INICIO' y terminar con 'FIN'.`
    
    const initCmd = this.getProgramInitializerCommand()
    const endCmd = this.getProgramFinalizerCommand()
    
    if (lines[0] !== initCmd.command)
      return `Error: El programa debe iniciar con '${initCmd.command}'.`
    
    if (lines[lines.length - 1] !== endCmd.command)
      return `Error: El programa debe terminar con '${endCmd.command}'.`
    
    for (let i = 1;i < lines.length - 1;i++) {
      const [command, arg] = lines[i].split(/\s+/)
      const cmd = this.getCommandByToken(command)
      const lineNumber = i + 1
      
      if (!cmd) {
        return `Error: Comando '${command}' no reconocido en línea ${lineNumber}.`
      }
      
      switch (cmd.role) {
        case this.CMD_PROGRAM_END:
        if (programOpened) {
          programOpened = false
        } else {
          return `Error: En la línea ${lineNumber}, el comando '${command}' no se puede usar 2 o más veces seguidas.`
        }
        continue
        
        case this.CMD_PROGRAM_START:
        if (!programOpened) {
          programOpened = true
        } else {
          return `Error: En la línea ${lineNumber}, el comando '${command}' no se puede usar 2 o más veces seguidas.`
        }
        continue
        
        case this.CMD_BLOCK_START:
        if (repeatBlockOpen) {
          return `Error: En la línea ${lineNumber}, el comando '${command}' no se puede usar 2 o más veces seguidas.`
        }
        repeatBlockOpen = true
        break
        
        case this.CMD_BLOCK_END:
        if (!repeatBlockOpen) {
          return `Error: En la línea ${lineNumber}, el comando '${command}' no se puede usar 2 o más veces seguidas.`
        }
        repeatBlockOpen = false
        break
        
        default:
        break
      }
      
      const validationMsg = this.validateLine(cmd, arg, lineNumber)
      if (validationMsg !== true) return validationMsg
    }
    
    if (repeatBlockOpen)
      return `Error: Bloque 'REPETIR' sin cerrar.`
    if (programOpened)
      return `Error: Programa sin cerrar.`
    
    // console.log(`\t[I] Syntax analysis completed. Valid syntax ✅`)
    return "Sintaxis válida."
  }
  
  validateLine(cmd, arg, lineNumber) {
    if (!cmd) {
      return `Error: Comando '${cmd?.command}' no reconocido en línea ${lineNumber}.`
    }
    
    if (cmd.param_count === 0 && arg !== undefined) {
      return `Error: El comando '${cmd.command}' no debe tener argumentos. Línea ${lineNumber}.`
    }
    
    if (cmd.param_count === 1) {
      if (!arg) {
        return `Error: El comando '${cmd.command}' requiere un parámetro. Línea ${lineNumber}.`
      }
      
      if (!this.matchRegex(cmd.parameters[0], arg)) {
        return `Error: El parámetro '${arg}' no es válido para '${cmd.command}'. Línea ${lineNumber}.`
      }
    }
    
    // console.log(`\t\t[t]Línea ${lineNumber} válida: ${cmd.command} ${arg || ''} ✅`)
    return true
  }
  
  getCommandByToken(token) {
    return this.commandTable.find(cmd => cmd.token === token)
  }
  
  getProgramInitializerCommand() {
    return this.commandTable.find(cmd => cmd.role === this.CMD_PROGRAM_START)
  }
  
  getProgramFinalizerCommand() {
    return this.commandTable.find(cmd => cmd.role === this.CMD_PROGRAM_END)
  }
  
  matchRegex(pattern, value) {
    const regex = new RegExp(pattern)
    return regex.test(value)
  }
}
