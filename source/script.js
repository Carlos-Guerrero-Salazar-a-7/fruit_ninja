// source/script.js
import { Block } from './scriptes/object.js'; 
import { Efecto } from './scriptes/effects.js';

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const rect = canvas.getBoundingClientRect();
    let gameRunning = false; 
    let gameOver = false; 
    let animationFrameId;
    let score = 0;
    let fallos = 0;
    const displayCoords = document.getElementById('displayCoords');
    
    let tiempoJuego = 0;
    let ultimoSpawn = 0;
    let intervaloSpawn = 3000;
    let maxBloquesConcurrentes = 2; 

    const audioContext = new (window.AudioContext || window.webkitAudioContext)(); 

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;   
    }

    const puntero_mouse = {
        x:0,
        y:0,
        radius: 10,
        color: '#0066ffff'
    };
    const trazo = [];
    const maxPuntosTrazo = 8;
    
    function mostrar_puntero() {
        if(trazo.length > 1) {
            ctx.beginPath();
            ctx.moveTo(trazo[0].x, trazo[0].y);
            for(let i = 1; i < trazo.length; i++) {
                ctx.lineTo(trazo[i].x, trazo[i].y);
            }
            ctx.strokeStyle = '#4d8cecff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            ctx.closePath();
        }
        
        ctx.beginPath();
        ctx.arc(puntero_mouse.x, puntero_mouse.y, puntero_mouse.radius, 0, Math.PI * 2);
        ctx.fillStyle = puntero_mouse.color;
        ctx.fill();
        ctx.closePath();
    }

    canvas.addEventListener('mousemove', (event) => {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        displayCoords.textContent = `Mouse position: X: ${x.toFixed(0)}, Y: ${y.toFixed(0)}`; 
        
        puntero_mouse.x = x;
        puntero_mouse.y = y;
        
        trazo.push({x: x, y: y});
        
        if(trazo.length > maxPuntosTrazo) {
            trazo.shift();
        }
    });

    function dibujarTachas() {
        const margen = canvas.width * 0.02;
        const tamañoBase = canvas.width * 0.03;
        const espaciado = canvas.width * 0.05;
        
        for(let i = 0; i < 3; i++) {
            const tamaño = tamañoBase + (i * canvas.width * 0.01);
            const x = margen + (i * espaciado);
            const y = canvas.height - margen - tamaño;
            const grosor = canvas.width * 0.003;
            ctx.strokeStyle = '#ffffffff';
            if(i < fallos) {
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            }
            ctx.lineWidth = grosor;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + tamaño, y + tamaño);
            ctx.moveTo(x + tamaño, y);
            ctx.lineTo(x, y + tamaño);
            ctx.stroke();
            ctx.closePath();
        }
    }

    const efectos = [];
    const slashSpritesheet = new Image();
    slashSpritesheet.src = 'imagenes/slash.png';

    const splashSpritesheet = new Image();
    splashSpritesheet.src = 'imagenes/splash.png';

    function crearEfectoSlash(x, y, escala = 4) {
        const efecto = new Efecto(
            x, y, slashSpritesheet, 16, 16, 18, 60, escala
        );
        efectos.push(efecto);
    }

    function crearEfectoSplash(x, y, escala = 2.5) {
        const efecto = new Efecto(
            x, y, splashSpritesheet, 32, 32, 18, 30, escala
        );
        efectos.push(efecto);
    }
    
    const blocks = [];

    function crearNuevoBloque() {
        var figura = Math.floor(Math.random() * 6) + 1;
        var width;
        let height;
        var angulo = Math.random() * Math.PI * 2;
        let img = new Image();
        
        switch(figura){
            case 1:
                width = canvas.width * 0.1; 
                height = canvas.width * 0.1; 
                img.src = './imagenes/pomegrate.png'; 
                break;
            case 2:
                width = canvas.width * 0.15; 
                height = canvas.height * 0.10; 
                img.src = './imagenes/banana.png'; 
                break;
            case 3:
                width = canvas.width * 0.10; 
                height = canvas.height * 0.20; 
                img.src = './imagenes/pina.png'; 
                break;
            case 4:
                width = canvas.width * 0.125; 
                height = canvas.width * 0.125;
                img.src = './imagenes/manzanas.png';
                break;
            case 5:
                width = canvas.width * 0.15; 
                height = canvas.height * 0.15; 
                img.src = './imagenes/sandia.png'; 
                break;
            case 6:
                width = canvas.width * 0.15; 
                height = canvas.height * 0.15; 
                img.src = './imagenes/bomba.png'; 
                break;
        }
        
        let x, dx;
        const spawnDesdeIzquierda = Math.random() < 0.5;
        
        if(spawnDesdeIzquierda) {
            x = Math.random() * (canvas.width * 0.3);
            dx = 1 + Math.random() * 3;
        } else {
            x = canvas.width * 0.7 + Math.random() * (canvas.width * 0.3) - width;
            dx = -(1 + Math.random() * 3);
        }
        
        const y = canvas.height;
        const alturaMaximaDeseada = canvas.height * 0.1 + Math.random() * (canvas.height * 0.3); 
        const distanciaSubida = canvas.height - alturaMaximaDeseada;
        
        const gravedad = 0.15; 
        const dy = Math.sqrt(2 * gravedad * distanciaSubida);

        let timer = 0;
        // Usa la clase Block importada
        return new Block(x, y, width, height, dy, dx, alturaMaximaDeseada, angulo, timer, img);
    }

    function actualizarDificultad() {
        if(tiempoJuego < 20000) { 
            intervaloSpawn = 3000;
            maxBloquesConcurrentes = 2;
        } else if(tiempoJuego < 40000) { 
            intervaloSpawn = 2000;
            maxBloquesConcurrentes = 3;
        } else if(tiempoJuego < 60000) {
            intervaloSpawn = 1500;
            maxBloquesConcurrentes = 4;
        } else if(tiempoJuego < 90000) { 
            intervaloSpawn = 1000;
            maxBloquesConcurrentes = 5;
        } else { 
            intervaloSpawn = 750;
            maxBloquesConcurrentes = 6;
        }
    }
    
    let lastTime = Date.now();
    
    // --- Bucle del Juego ---

    function gameLoop() {
        if (!gameRunning) return; 

        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        tiempoJuego += deltaTime;
        ultimoSpawn += deltaTime;
        
        actualizarDificultad();
        
        const bloquesActivos = blocks.filter(b => !b.esDivision).length;
        if(ultimoSpawn >= intervaloSpawn && bloquesActivos < maxBloquesConcurrentes) {
            blocks.push(crearNuevoBloque());
            ultimoSpawn = 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dibujarTachas();
        
        // Actualizar y dibujar bloques
        for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i];
            
            // Llama a update y captura el resultado (posible fallo)
            const updateResult = block.update(canvas, blocks, crearEfectoSplash); 
            fallos += updateResult.fallos; 
            
            // Llama a draw pasándole ctx
            block.draw(ctx);

            if (block.collides(puntero_mouse) && !block.esDivision && !block.cortado) {
                
                if(block.imagen.src.includes('bomba.png')){
                    crearEfectoSplash(block.x + block.width / 2, block.y + block.height / 2, 3);
                    gameOver = true;
                    gameRunning = false;
                    cancelAnimationFrame(animationFrameId);
                    alert(`¡Game Over! Cortaste una bomba. Tu puntuación final es: ${score}`);
                    startButton.disabled = false; 
                    return;
                }
                crearEfectoSlash(puntero_mouse.x, puntero_mouse.y, 4);
                // Llama a dividir y captura el score
                const divideResult = block.dividir(
                    puntero_mouse.x, 
                    puntero_mouse.y,
                    blocks, 
                    audioContext
                );
                score += divideResult.score;
                
                blocks.splice(i, 1);
            }
            
            if(fallos >= 3){
                gameOver = true;
                gameRunning = false;
                cancelAnimationFrame(animationFrameId);
                alert(`¡Game Over! Dejaste caer demasiadas frutas. Tu puntuación final es: ${score}`);
                startButton.disabled = false; 
                return;
            }
        }

        // Actualizar y dibujar efectos (draw recibe ctx)
        for (let i = efectos.length - 1; i >= 0; i--) {
            const efecto = efectos[i];
            efecto.update(deltaTime);
            efecto.draw(ctx); 

            if (efecto.terminado) {
                efectos.splice(i, 1);
            }
        }

        mostrar_puntero();
        
        ctx.fillStyle = '#ffffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score} | Fallos: ${fallos}/3 | Tiempo: ${Math.floor(tiempoJuego/1000)}s`, 10, 30);

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Controles y Pantalla Inicial ---

    startButton.addEventListener('click', () => {
        if (!gameRunning) { 
            gameRunning = true;
            gameOver = false;
            startButton.disabled = true;
            tiempoJuego = 0;
            ultimoSpawn = 0;
            lastTime = Date.now();
            score = 0;
            fallos = 0;
            blocks.length = 0;
            efectos.length = 0; 
            gameLoop();
        }
    });

    resetButton.addEventListener('click', () => {
        location.reload(); 
    });

    function drawInitialScreen() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mostrar_puntero();
        dibujarTachas();
        ctx.fillStyle = '#fffcfcff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pulsa "Iniciar Juego" para empezar', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '16px Arial';
        ctx.fillText('Las frutas aparecerán gradualmente', canvas.width / 2, canvas.height / 2);
        ctx.fillText('¡Evita las bombas y no dejes caer 3 frutas!', canvas.width / 2, canvas.height / 2 + 30);
        
        ctx.fillText(`Score: ${score} | Fallos: ${fallos}/3 | Tiempo: 0s`, 10, 30);
    }
    
    drawInitialScreen();
});