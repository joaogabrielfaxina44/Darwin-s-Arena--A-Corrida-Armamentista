/**
 * Main Entry Point
 * Orquestra a inicialização e o loop principal da Darwin's Arena.
 */

let world;
let isPaused = false;
let simSpeed = 1;

function init() {
    world = new World('arena-canvas');
    
    setupControls();
    loop();
}

function setupControls() {
    const btnPause = document.getElementById('btn-pause');
    btnPause.addEventListener('click', () => {
        isPaused = !isPaused;
        btnPause.innerText = isPaused ? 'Retomar' : 'Pausar';
    });

    const btnReset = document.getElementById('btn-reset');
    btnReset.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja resetar toda a evolução?')) {
            world = new World('arena-canvas');
        }
    });

    const speedSlider = document.getElementById('sim-speed');
    speedSlider.addEventListener('input', (e) => {
        simSpeed = parseInt(e.target.value);
    });
}

function loop() {
    if (!isPaused) {
        // Rodar múltiplas vezes por frame para acelerar simulação se necessário
        for (let i = 0; i < simSpeed; i++) {
            world.update();
        }
    }
    
    world.draw();
    updateUI();
    
    requestAnimationFrame(loop);
}

function updateUI() {
    // Atualiza contadores em tempo real
    const alivePrey = world.preyPopulation.filter(p => p.alive).length;
    const alivePred = world.predatorPopulation.filter(p => p.alive).length;
    
    document.getElementById('prey-count').innerText = alivePrey;
    document.getElementById('pred-count').innerText = alivePred;
    document.getElementById('pop-count').innerText = alivePrey + alivePred;
    
    // Pegar o melhor fitness de qualquer espécie
    const bestPrey = Math.max(...world.preyPopulation.map(p => p.fitness));
    const bestPred = Math.max(...world.predatorPopulation.map(p => p.fitness));
    document.getElementById('best-fitness').innerText = Math.max(bestPrey, bestPred);
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
