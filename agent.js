/**
 * Classe Base Agent
 * Define o comportamento físico e a inteligência dos agentes na arena.
 */
class Agent {
    constructor(x, y, dna, color) {
        this.pos = { x: x, y: y };
        this.vel = { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
        this.angle = Math.random() * Math.PI * 2;
        this.dna = dna || new DNA();
        this.color = color || '#fff';
        
        this.radius = 6;
        this.maxSpeed = 3;
        this.maxForce = 0.6; // Força aumentada para desvios rápidos
        
        this.energy = 1.0; // 0 a 1
        this.fitness = 0;
        this.alive = true;
        
        // Configuração dos Sensores (Raycasting)
        this.sensorsCount = 7; // Visão periférica expandida
        this.sensorRange = 120;
        this.sensorAngles = [-Math.PI/2, -Math.PI/3, -Math.PI/8, 0, Math.PI/8, Math.PI/3, Math.PI/2];
        this.readings = new Array(this.sensorsCount).fill(0);
    }

    /**
     * Aplica uma força ao agente (Segunda Lei de Newton)
     */
    applyForce(force) {
        this.acc.x += force.x;
        this.acc.y += force.y;
    }

    /**
     * Atualiza a física do agente
     */
    update(width, height) {
        if (!this.alive) return;

        // Decadência natural de energia
        this.energy -= 0.001;
        if (this.energy <= 0) {
            this.alive = false;
        }

        // Movimento
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
        
        // Aplicar atrito (friction) ambiental para que consigam parar
        this.vel.x *= 0.92;
        this.vel.y *= 0.92;
        
        // Limitar velocidade
        const speed = Math.sqrt(this.vel.x**2 + this.vel.y**2);
        if (speed > this.maxSpeed) {
            this.vel.x = (this.vel.x / speed) * this.maxSpeed;
            this.vel.y = (this.vel.y / speed) * this.maxSpeed;
        }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.acc.x *= 0;
        this.acc.y *= 0;

        // Atualizar ângulo baseado na velocidade
        if (speed > 0.1) {
            this.angle = Math.atan2(this.vel.y, this.vel.x);
        }

        // Limites da Arena (Bordas)
        this.boundaries(width, height);
    }

    boundaries(w, h) {
        if (this.pos.x < 0) this.pos.x = w;
        if (this.pos.x > w) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = h;
        if (this.pos.y > h) this.pos.y = 0;
    }

    /**
     * Pensa usando a rede neural
     * inputs: [distancia_sensores..., energia, velocidade]
     */
    think() {
        const inputs = [
            ...this.readings,
            this.energy,
            Math.sqrt(this.vel.x**2 + this.vel.y**2) / this.maxSpeed,
            Math.sin(this.angle)
        ];

        const output = this.dna.brain.predict(inputs);
        
        // Interpretando saídas
        const throttle = (output[0] - 0.5) * 2; // -1 a 1 (Permite dar ré para frear ou desviar)
        const steer = (output[1] - 0.5) * 2; // -1 a 1

        // Converter saída em forças
        this.steer(steer);
        this.thrust(throttle);
    }

    steer(amount) {
        this.angle += amount * 0.1;
    }

    thrust(amount) {
        const force = {
            x: Math.cos(this.angle) * amount * this.maxForce,
            y: Math.sin(this.angle) * amount * this.maxForce
        };
        this.applyForce(force);
    }

    /**
     * Desenha o agente no canvas
     */
    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        
        if (window.visualFx) {
            // Desenhar sensores (Raycasting)
            for (let i = 0; i < this.sensorsCount; i++) {
                const val = this.readings[i];
                const dist = this.sensorRange * (1 - val);
                const sAngle = this.sensorAngles[i];
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(sAngle) * dist, Math.sin(sAngle) * dist);
                
                if (val > 0) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 1.5;
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 0.5;
                }
                ctx.stroke();
                
                if (val > 0) {
                    ctx.beginPath();
                    ctx.arc(Math.cos(sAngle) * dist, Math.sin(sAngle) * dist, 3, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fill();
                }
            }
        }

        // Corpo (Triângulo)
        ctx.beginPath();
        ctx.moveTo(this.radius * 2, 0);
        ctx.lineTo(-this.radius, this.radius);
        ctx.lineTo(-this.radius, -this.radius);
        ctx.closePath();
        
        ctx.fillStyle = this.color;
        
        if (window.visualFx) {
            // Agentes mais fitness ficam mais brilhantes
            const fitnessBoost = Math.min(1.0, this.fitness / 100);
            ctx.globalAlpha = 0.6 + (fitnessBoost * 0.4);
        } else {
            ctx.globalAlpha = 1.0;
        }
        ctx.fill();
        
        if (window.visualFx) {
            // Aura de Energia
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = this.energy;
            ctx.stroke();
        }

        ctx.restore();
    }
}

/**
 * Especialização: Presa
 */
class Prey extends Agent {
    constructor(x, y, dna) {
        super(x, y, dna, '#00f2ff');
        this.type = 'prey';
    }
}

/**
 * Especialização: Predador
 */
class Predator extends Agent {
    constructor(x, y, dna) {
        super(x, y, dna, '#ff0055');
        this.type = 'predator';
        this.maxSpeed = 3.5; // Predadores são ligeiramente mais rápidos
    }
}
