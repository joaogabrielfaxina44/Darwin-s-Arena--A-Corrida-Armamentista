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
        this.maxForce = 0.2;
        
        this.energy = 1.0; // 0 a 1
        this.fitness = 0;
        this.alive = true;
        
        // Configuração dos Sensores (Raycasting)
        this.sensorsCount = 5;
        this.sensorRange = 100;
        this.sensorAngles = [-Math.PI/4, -Math.PI/8, 0, Math.PI/8, Math.PI/4];
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
        const throttle = output[0]; // 0 a 1
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

        // Corpo (Triângulo)
        ctx.beginPath();
        ctx.moveTo(this.radius * 2, 0);
        ctx.lineTo(-this.radius, this.radius);
        ctx.lineTo(-this.radius, -this.radius);
        ctx.closePath();
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        
        // Aura de Energia
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.energy;
        ctx.stroke();

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
