export class LexicalAnalyzer {
    constructor() {
        this.states = { q0: 'q0', q1: 'q1', q2: 'q2', q3: 'q3', qFinal: 'qFinal' };
        this.commands = { S: 'SUBIR', B: 'BAJAR', P: 'PAUSA', A: 'ABRIR', I: 'INICIO', F: 'FIN' };
    }

    analyze(script) {
        script = script.trim().toUpperCase()//.split("\/n")//.map(line => line.trim());
        script = script.split("\n").map(line => line.trim())
        let state = this.states.q0;
        if (script.length < 2) return `Error: El programa debe iniciar con un comando 'INICIO' y terminar con un comando 'FIN'.`
        if (script[0] !== 'INICIO') return `Error: El programa debe iniciar con un comando 'INICIO'.`
        script.shift()        
        state = this.states.q1
        if (script[script.length - 1] !== 'FIN') return `Error: El programa debe finalizar con un comando 'FIN'.`
        script.pop()
        for (let i in script) {
            let line = script[i]
            let tokens = line.split(` `)
            let command = tokens[0]
            if (!Object.values(this.commands).includes(command)) return `Error: Comando desconocido '${command}' en la línea ${Number(i)+2}.`
            if (command === this.commands.I) return `Error: El comando '${command}' Solo debe ir al inicio del programa.`
            if (command === this.commands.F) return `Error: El comando '${command}' Solo debe ir al final del programa.`
            if (this.commands.A.includes(command) && tokens.length === 1) {
                state = this.states.q2
                continue
            }
            if (tokens.length !== 2 || tokens.length < 2) return `Error: El comando '${command}' necesita un número en la línea ${Number(i)+2}.`
            let floor = tokens[1]
            if (!/^[1-7]$/.test(floor)) return `Error: Número inválido: '${floor}' en la línea ${Number(i)+2}. El comando '${tokens[0]}' espera un número entre 1 y 7.`
            state = this.states.q3
        }
        state = this.states.qFinal
        return "Sintaxis válida."
    }
}
