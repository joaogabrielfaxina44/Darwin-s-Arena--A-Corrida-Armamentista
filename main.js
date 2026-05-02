/**
 * Main Entry Point
 * Orquestra a inicialização e o loop principal da Darwin's Arena.
 */

let world;
let isPaused = false;
let isHeadless = false;
let simSpeed = 1;
let lastUITime = 0;

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

    const btnHeadless = document.getElementById('btn-headless');
    if (btnHeadless) {
        btnHeadless.addEventListener('click', () => {
            isHeadless = !isHeadless;
            btnHeadless.innerText = isHeadless ? 'Sair do Modo Turbo' : 'Modo Turbo (Sem Tela)';
            btnHeadless.style.background = isHeadless ? 'var(--accent-predator)' : '';
        });
    }

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
        if (isHeadless) {
            // Roda em blocos pesados para evitar o custo massivo do 'performance.now()' a cada ciclo.
            // Damos um limite de 33ms (focando em CPU pesada, UI cai pra ~30fps suave)
            const start = performance.now();
            while (performance.now() - start < 33) {
                for (let i = 0; i < 20; i++) {
                    world.update();
                }
            }
        } else {
            // Modo normal governado pelo slider
            for (let i = 0; i < simSpeed; i++) {
                world.update();
            }
        }
    }
    
    if (!isHeadless) {
        world.draw();
    } else {
        // Feedback visual do Modo Turbo
        const canvas = document.getElementById('arena-canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(10, 11, 16, 0.2)'; // Fundo com rastro
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 24px "Outfit"';
        ctx.textAlign = 'center';
        ctx.fillText('MODO TURBO ATIVADO', canvas.width/2, canvas.height/2);
        
        ctx.fillStyle = '#00f2ff';
        ctx.font = '16px "Outfit"';
        ctx.fillText('Simulando gerações em background...', canvas.width/2, canvas.height/2 + 30);
    }
    
    updateUI();
    
    requestAnimationFrame(loop);
}

function updateUI() {
    const now = Date.now();
    if (now - lastUITime < 2000) return; // Atualizar apenas a cada 2 segundos
    lastUITime = now;

    // Atualiza contadores em tempo real
    const alivePrey = world.preyPopulation.filter(p => p.alive).length;
    const alivePred = world.predatorPopulation.filter(p => p.alive).length;
    
    document.getElementById('prey-count').innerText = alivePrey;
    document.getElementById('pred-count').innerText = alivePred;
    document.getElementById('pop-count').innerText = alivePrey + alivePred;
    
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
