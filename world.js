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
        this.preyPopSize = 100; // Simulação em massa
        this.predPopSize = 30;
        this.foodCount = 100;
        this.history = [];
        this.maxFrames = 600; // Limite de tempo de vida
        this.frameCount = 0;

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
        for (let i = 0; i < this.preyPopulation.length; i++) {
            const prey = this.preyPopulation[i];
            if (!prey.alive) continue;
            this.sense(prey);
            prey.think();
            prey.update(this.width, this.height);
            this.checkFood(prey);
            if (prey.alive) prey.fitness += 0.1; // Gradiente de aprendizado: Sobreviver = bom
        }

        // Atualizar Predadores
        for (let i = 0; i < this.predatorPopulation.length; i++) {
            const pred = this.predatorPopulation[i];
            if (!pred.alive) continue;
            this.sense(pred);
            pred.think();
            pred.update(this.width, this.height);
            this.checkHunt(pred);
            if (pred.alive) pred.fitness += 0.1; // Gradiente de aprendizado: Sobreviver = bom
        }

        // Verificar se a geração acabou
        this.frameCount++;
        if (this.isGenerationOver() || this.frameCount >= this.maxFrames) {
            this.nextGeneration();
        }
    }

    /**
     * Implementação Simplificada de Raycasting / Visão
     */
    sense(agent) {
        agent.readings.fill(0);

        // OTIMIZAÇÃO: Broad-Phase Bounding Box Filter. 
        // Em vez de checar 130 entidades para cada um dos 7 sensores (N^2), 
        // criamos uma lista apenas com as entidades próximas.
        const nearbyTargets = [];
        const targets = agent.type === 'prey' ? this.food : this.preyPopulation;
        
        for (let j = 0; j < targets.length; j++) {
            const t = targets[j];
            if (t === agent || t.alive === false) continue;
            // Check de caixa delimitadora rápida
            if (Math.abs(t.x !== undefined ? t.x : t.pos.x - agent.pos.x) <= agent.sensorRange && 
                Math.abs(t.y !== undefined ? t.y : t.pos.y - agent.pos.y) <= agent.sensorRange) {
                nearbyTargets.push(t);
            }
        }

        const nearbyPredators = [];
        if (agent.type === 'prey') {
            for (let j = 0; j < this.predatorPopulation.length; j++) {
                const p = this.predatorPopulation[j];
                if (!p.alive) continue;
                if (Math.abs(p.pos.x - agent.pos.x) <= agent.sensorRange && 
                    Math.abs(p.pos.y - agent.pos.y) <= agent.sensorRange) {
                    nearbyPredators.push(p);
                }
            }
        }

        for (let i = 0; i < agent.sensorsCount; i++) {
            const angle = agent.angle + agent.sensorAngles[i];
            const rayDir = { x: Math.cos(angle), y: Math.sin(angle) };
            
            let closestDist = agent.sensorRange;

            for (let j = 0; j < nearbyTargets.length; j++) {
                const target = nearbyTargets[j];
                const dist = this.distToRay(agent.pos, rayDir, target);
                if (dist > 0 && dist < closestDist) {
                    closestDist = dist;
                }
            }

            for (let j = 0; j < nearbyPredators.length; j++) {
                const pred = nearbyPredators[j];
                const dist = this.distToRay(agent.pos, rayDir, pred.pos);
                if (dist > 0 && dist < closestDist) {
                    closestDist = dist;
                }
            }

            agent.readings[i] = 1 - (closestDist / agent.sensorRange);
        }
    }

    distToRay(origin, dir, target) {
        const tx = target.x !== undefined ? target.x : target.pos.x;
        const ty = target.y !== undefined ? target.y : target.pos.y;
        
        const dx = tx - origin.x;
        const dy = ty - origin.y;
        const projection = dx * dir.x + dy * dir.y;
        
        if (projection < 0) return -1; // Atrás do raio

        const cX = origin.x + dir.x * projection;
        const cY = origin.y + dir.y * projection;

        const dX = tx - cX;
        const dY = ty - cY;
        const distSq = dX * dX + dY * dY;
        
        if (distSq < 400) { 
            return projection;
        }
        return -1;
    }

    checkFood(prey) {
        for (let i = 0; i < this.food.length; i++) {
            const f = this.food[i];
            const dx = prey.pos.x - f.x;
            if (dx > 15 || dx < -15) continue; // Broad phase
            const dy = prey.pos.y - f.y;
            if (dy > 15 || dy < -15) continue; // Broad phase
            
            const dSq = dx * dx + dy * dy;
            const rSum = prey.radius + f.radius;
            if (dSq < rSum * rSum) {
                prey.energy = Math.min(1.0, prey.energy + 0.3);
                prey.fitness += 10;
                this.food[i] = { x: Math.random() * this.width, y: Math.random() * this.height, radius: 3 };
            }
        }
    }

    checkHunt(pred) {
        for (let i = 0; i < this.preyPopulation.length; i++) {
            const prey = this.preyPopulation[i];
            if (!prey.alive) continue;
            const dx = pred.pos.x - prey.pos.x;
            if (dx > 20 || dx < -20) continue; // Broad phase
            const dy = pred.pos.y - prey.pos.y;
            if (dy > 20 || dy < -20) continue; // Broad phase
            
            const dSq = dx * dx + dy * dy;
            const rSum = pred.radius + prey.radius;
            if (dSq < rSum * rSum) {
                prey.alive = false;
                pred.energy = Math.min(1.0, pred.energy + 0.5);
                pred.fitness += 50;
            }
        }
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
        this.frameCount = 0;
        
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
        
        // Selecionar os melhores (Elite e Campeão Absoluto)
        const eliteCount = Math.max(2, Math.floor(size * 0.2));
        const elite = population.slice(0, eliteCount);
        const champion = elite[0]; // O Indivíduo com o melhor desempenho será o Padrão
        const newPop = [];

        // Preencher a nova população
        for (let i = 0; i < size; i++) {
            if (i === 0) {
                // O Campeão passa intacto (Clonagem Perfeita)
                newPop.push(new ClassType(Math.random() * this.width, Math.random() * this.height, champion.dna.mutate(0)));
            } else if (i < size * 0.5) {
                // 50% da população será padronizada a partir do Campeão (Evolução guiada)
                newPop.push(new ClassType(Math.random() * this.width, Math.random() * this.height, champion.dna.mutate(0.05)));
            } else {
                // Os outros 50%: Crossover da elite (mistura de táticas)
                const parentA = elite[Math.floor(Math.random() * elite.length)];
                const parentB = elite[Math.floor(Math.random() * elite.length)];
                let childDna = parentA.dna.crossover(parentB.dna);
                
                // Mutações para explorar o desconhecido
                childDna = childDna.mutate(0.1); 
                newPop.push(new ClassType(Math.random() * this.width, Math.random() * this.height, childDna));
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
