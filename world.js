/**
 * Classe World
 * O motor da simulação. Gerencia o ambiente, colisões e sensores.
 */
class World {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.preyPopulation = [];
        this.predatorPopulation = [];
        this.food = [];
        
        this.generation = 1;
        this.preyPopSize = 40;
        this.predPopSize = 10;
        this.foodCount = 50;
        this.history = [];

        window.addEventListener('resize', () => this.resize());
        this.init();
    }

    resize() {
        this.width = this.canvas.parentElement.clientWidth;
        this.height = this.canvas.parentElement.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    init() {
        // Inicializar Presas
        for (let i = 0; i < this.preyPopSize; i++) {
            this.preyPopulation.push(new Prey(Math.random() * this.width, Math.random() * this.height));
        }

        // Inicializar Predadores
        for (let i = 0; i < this.predPopSize; i++) {
            this.predatorPopulation.push(new Predator(Math.random() * this.width, Math.random() * this.height));
        }

        // Inicializar Comida
        this.spawnFood();
    }

    spawnFood() {
        this.food = [];
        for (let i = 0; i < this.foodCount; i++) {
            this.food.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 3
            });
        }
    }

    /**
     * Atualiza o estado de tudo no mundo
     */
    update() {
        // Atualizar Presas
        this.preyPopulation.forEach(prey => {
            if (!prey.alive) return;
            this.sense(prey);
            prey.think();
            prey.update(this.width, this.height);
            this.checkFood(prey);
        });

        // Atualizar Predadores
        this.predatorPopulation.forEach(pred => {
            if (!pred.alive) return;
            this.sense(pred);
            pred.think();
            pred.update(this.width, this.height);
            this.checkHunt(pred);
        });

        // Verificar se a geração acabou
        if (this.isGenerationOver()) {
            this.nextGeneration();
        }
    }

    /**
     * Implementação Simplificada de Raycasting / Visão
     */
    sense(agent) {
        agent.readings.fill(0);

        for (let i = 0; i < agent.sensorsCount; i++) {
            const angle = agent.angle + agent.sensorAngles[i];
            const rayDir = { x: Math.cos(angle), y: Math.sin(angle) };
            
            let closestDist = agent.sensorRange;
            let typeDetected = 0; // 0: Nada, 0.5: Comida/Presa, 1: Perigo/Predador

            // Detectar Comida (se for Presa) ou Presa (se for Predador)
            const targets = agent.type === 'prey' ? this.food : this.preyPopulation;
            
            targets.forEach(target => {
                if (target === agent || (target.alive === false)) return;
                
                const dist = this.distToRay(agent.pos, rayDir, target);
                if (dist > 0 && dist < closestDist) {
                    closestDist = dist;
                    typeDetected = 0.5;
                }
            });

            // Detectar Predadores (se for Presa)
            if (agent.type === 'prey') {
                this.predatorPopulation.forEach(pred => {
                    const dist = this.distToRay(agent.pos, rayDir, pred.pos);
                    if (dist > 0 && dist < closestDist) {
                        closestDist = dist;
                        typeDetected = 1.0;
                    }
                });
            }

            // Normalizar leitura (1 = perto, 0 = longe)
            agent.readings[i] = 1 - (closestDist / agent.sensorRange);
        }
    }

    distToRay(origin, dir, target) {
        const toTarget = { x: target.x - origin.x, y: target.y - origin.y };
        const projection = toTarget.x * dir.x + toTarget.y * dir.y;
        
        if (projection < 0) return -1; // Atrás do raio

        const closestPoint = {
            x: origin.x + dir.x * projection,
            y: origin.y + dir.y * projection
        };

        const distSq = (target.x - closestPoint.x)**2 + (target.y - closestPoint.y)**2;
        if (distSq < 400) { // Se o ponto mais próximo está "perto" o suficiente da linha do raio
            return projection;
        }
        return -1;
    }

    checkFood(prey) {
        this.food.forEach((f, index) => {
            const d = Math.sqrt((prey.pos.x - f.x)**2 + (prey.pos.y - f.y)**2);
            if (d < prey.radius + f.radius) {
                prey.energy = Math.min(1.0, prey.energy + 0.3);
                prey.fitness += 10;
                this.food[index] = { x: Math.random() * this.width, y: Math.random() * this.height, radius: 3 };
            }
        });
    }

    checkHunt(pred) {
        this.preyPopulation.forEach(prey => {
            if (!prey.alive) return;
            const d = Math.sqrt((pred.pos.x - prey.pos.x)**2 + (pred.pos.y - prey.pos.y)**2);
            if (d < pred.radius + prey.radius) {
                prey.alive = false;
                pred.energy = Math.min(1.0, pred.energy + 0.5);
                pred.fitness += 50;
            }
        });
    }

    isGenerationOver() {
        const allPreyDead = this.preyPopulation.every(p => !p.alive);
        const allPredDead = this.predatorPopulation.every(p => !p.alive);
        return allPreyDead || allPredDead;
    }

    /**
     * Algoritmo Genético: Seleção Natural e Reprodução
     */
    nextGeneration() {
        const bestPrey = this.preyPopulation.length > 0 ? Math.max(...this.preyPopulation.map(p => p.fitness)) : 0;
        const bestPred = this.predatorPopulation.length > 0 ? Math.max(...this.predatorPopulation.map(p => p.fitness)) : 0;
        this.history.push({ gen: this.generation, prey: bestPrey, pred: bestPred });

        this.generation++;
        
        // Evoluir Presas
        this.preyPopulation = this.evolve(this.preyPopulation, this.preyPopSize, Prey);
        // Evoluir Predadores
        this.predatorPopulation = this.evolve(this.predatorPopulation, this.predPopSize, Predator);
        
        this.spawnFood();
        this.updateStats();
    }

    evolve(population, size, ClassType) {
        // Ordenar por fitness
        population.sort((a, b) => b.fitness - a.fitness);
        
        // Selecionar os melhores (Elite)
        const elite = population.slice(0, Math.floor(size * 0.2));
        const newPop = [];

        // Preencher a nova população
        for (let i = 0; i < size; i++) {
            if (i < elite.length) {
                // Elite passa direto (com pequena mutação)
                const parent = elite[i];
                newPop.push(new ClassType(Math.random() * this.width, Math.random() * this.height, parent.dna.mutate(0.01)));
            } else {
                // Reprodução via Roleta/Torneio (simplificado: pega um aleatório da elite)
                const parent = elite[Math.floor(Math.random() * elite.length)];
                newPop.push(new ClassType(Math.random() * this.width, Math.random() * this.height, parent.dna.mutate(0.1)));
            }
        }
        return newPop;
    }

    updateStats() {
        document.getElementById('gen-count').innerText = this.generation;
        document.getElementById('prey-count').innerText = this.preyPopulation.filter(p => p.alive).length;
        document.getElementById('pred-count').innerText = this.predatorPopulation.filter(p => p.alive).length;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Desenhar Comida
        this.ctx.fillStyle = '#444';
        this.food.forEach(f => {
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Desenhar Agentes
        this.preyPopulation.forEach(p => p.draw(this.ctx));
        this.predatorPopulation.forEach(p => p.draw(this.ctx));
    }
}
