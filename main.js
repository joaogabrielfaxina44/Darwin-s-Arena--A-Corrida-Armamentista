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

    window.visualFx = true;
    const toggleFx = document.getElementById('toggle-fx');
    if (toggleFx) {
        toggleFx.addEventListener('change', (e) => {
            window.visualFx = e.target.checked;
        });
    }
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
    
    drawChart();
}

function drawChart() {
    const canvas = document.getElementById('fitness-canvas');
    if (!canvas || world.history.length === 0) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const history = world.history;
    const maxGen = history[history.length - 1].gen;
    let maxFitness = Math.max(...history.map(h => Math.max(h.prey, h.pred)));
    if (maxFitness === 0) maxFitness = 1;
    
    const padding = 5;
    const w = canvas.width - padding * 2;
    const h = canvas.height - padding * 2;
    
    function drawLine(key, color, fillColor) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.fillStyle = fillColor;
        ctx.lineWidth = 2;
        
        ctx.moveTo(padding, canvas.height - padding);
        for (let i = 0; i < history.length; i++) {
            const point = history[i];
            const x = padding + (i / Math.max(1, history.length - 1)) * w;
            const y = canvas.height - padding - (point[key] / maxFitness) * h;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(padding + w, canvas.height - padding);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < history.length; i++) {
            const point = history[i];
            const x = padding + (i / Math.max(1, history.length - 1)) * w;
            const y = canvas.height - padding - (point[key] / maxFitness) * h;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    drawLine('prey', '#00f2ff', 'rgba(0, 242, 255, 0.15)');
    drawLine('pred', '#ff0055', 'rgba(255, 0, 85, 0.15)');

    // Indicador de Estado / Vantagem
    const lastPoint = history[history.length - 1];
    ctx.font = '12px "JetBrains Mono"';
    ctx.textAlign = 'right';
    if (lastPoint.prey > lastPoint.pred) {
        ctx.fillStyle = '#00f2ff';
        ctx.fillText('VANTAGEM: PRESAS', canvas.width - 10, 20);
    } else if (lastPoint.pred > lastPoint.prey) {
        ctx.fillStyle = '#ff0055';
        ctx.fillText('VANTAGEM: PREDADORES', canvas.width - 10, 20);
    } else {
        ctx.fillStyle = '#aaa';
        ctx.fillText('EQUILÍBRIO', canvas.width - 10, 20);
    }
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
