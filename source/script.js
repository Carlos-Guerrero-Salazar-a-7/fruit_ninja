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

    const puntero_mouse = {
        x:0,
        y:0,
        radius: 15,
        color: '#0066ffff'
    };
    const trazo = [];
    const maxPuntosTrazo = 10;
    
    function mostrar_puntero() {
        if(trazo.length > 1) {
            ctx.beginPath();
            ctx.moveTo(trazo[0].x, trazo[0].y);
            for(let i = 1; i < trazo.length; i++) {
                ctx.lineTo(trazo[i].x, trazo[i].y);
            }
            ctx.strokeStyle = '#4d8cecff';
            ctx.lineWidth = 15;
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

    // Función para iniciar el juego (reutilizable)
    function iniciarJuego() {
        if (!gameRunning && imagenesListas) { 
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
        } else if(!imagenesListas) {
            console.warn('Espera a que las imágenes se carguen...'); 
        }
    }

    // AÑADIDO: Iniciar juego al hacer click en el canvas
    canvas.addEventListener('click', () => {
        iniciarJuego();
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
    // Asegurarse de que slash.png se carga correctamente
    const slashSpritesheet = new Image();
    slashSpritesheet.src = 'imagenes/slash.png'; 

    const splashSpritesheet = new Image();
    splashSpritesheet.src = 'imagenes/splash.png';

    const imagenesPreCargadas = {};
    const imagenesPorCargar = [
        {key: 'fondo', src: 'imagenes/fondo.jpg'},
        {key: 'pomegrate', src: 'imagenes/a.png'},
        {key: 'banana', src: 'imagenes/b.png'},
        {key: 'pina', src: 'imagenes/c.png'},
        {key: 'manzanas', src: 'imagenes/d.png'},
        {key: 'sandia', src: 'imagenes/e.png'},
        {key: 'bomba', src: 'imagenes/bomba.png'},
        {key: 'pomegrate1', src: 'imagenes/a1.png'},
        {key: 'pomegrate2', src: 'imagenes/a2.png'},
        {key: 'banana1', src: 'imagenes/b1.png'},
        {key: 'banana2', src: 'imagenes/b2.png'},
        {key: 'pina1', src: 'imagenes/c1.png'},
        {key: 'pina2', src: 'imagenes/c2.png'},
        {key: 'manzanas1', src: 'imagenes/d1.png'},
        {key: 'manzanas2', src: 'imagenes/d2.png'},
        {key: 'sandia1', src: 'imagenes/e1.png'},
        {key: 'sandia2', src: 'imagenes/e2.png'}
    ];

    let imagenesListas = false;
    let imagenesContador = 0;

    function cargarImagenes() {
        return new Promise((resolve) => {
            imagenesPorCargar.forEach(({key, src}) => {
                const img = new Image();
                img.onload = () => {
                    imagenesContador++;
                    console.log(`Imagen cargada: ${key} (${imagenesContador}/${imagenesPorCargar.length})`);
                    if(imagenesContador === imagenesPorCargar.length) {
                        imagenesListas = true;
                        console.log('Todas las imágenes cargadas!');
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.error(`Error cargando imagen: ${key} - ${src}`);
                    imagenesContador++;
                    if(imagenesContador === imagenesPorCargar.length) {
                        resolve();
                    }
                };
                img.src = src;
                imagenesPreCargadas[key] = img;
            });
        });
    }

    window.imagenesPreCargadas = imagenesPreCargadas;

    // Efecto de corte (Slash)
    function crearEfectoSlash(x, y, escala = .5) {
        // Usa los últimos 4 puntos del trazo para posicionar el efecto
        const lastPoints = trazo.slice(-4);
        let avgX = x;
        let avgY = y;
        if (lastPoints.length > 0) {
            avgX = lastPoints.reduce((sum, p) => sum + p.x, 0) / lastPoints.length;
            avgY = lastPoints.reduce((sum, p) => sum + p.y, 0) / lastPoints.length;
        }

        const FRAME_WIDTH = 256;  // Nuevo ancho de frame (3840px / 15 frames)
        const FRAME_HEIGHT = 256; // Nuevo alto de frame (256px)
        const TOTAL_FRAMES = 15;  // Nuevo total de frames
        const FPS = 30;
        const FILA = 0; // Se sigue usando la primera fila

        // Se pasa 'fila' como último argumento a la clase Efecto
        const efecto = new Efecto(
            avgX, avgY, slashSpritesheet, FRAME_WIDTH, FRAME_HEIGHT, TOTAL_FRAMES, FPS, escala, FILA
        );
        efectos.push(efecto);
    }

    function crearEfectoSplash(x, y, escala = .5) {
        const efecto = new Efecto(
            x, y, splashSpritesheet, 32, 32, 18, 30, escala
        );
        efectos.push(efecto);
    }
    
    const blocks = [];

    function crearNuevoBloque() {
        if(!imagenesListas) {
            console.warn('Intentando crear bloque antes de que las imágenes estén listas');
            return null;
        }

        var figura = Math.floor(Math.random() * 6) + 1;
        var width;
        let height;
        var angulo = Math.random() * Math.PI * 2;
        let img;
        
        switch(figura){
            case 1:
                width = canvas.width * 0.1; 
                height = canvas.width * 0.1; 
                img = imagenesPreCargadas.pomegrate;
                break;
            case 2:
                width = canvas.width * 0.15; 
                height = canvas.height * 0.10; 
                img = imagenesPreCargadas.banana;
                break;
            case 3:
                width = canvas.width * 0.10; 
                height = canvas.height * 0.20; 
                img = imagenesPreCargadas.pina;
                break;
            case 4:
                width = canvas.width * 0.125; 
                height = canvas.width * 0.125;
                img = imagenesPreCargadas.manzanas;
                break;
            case 5:
                width = canvas.width * 0.15; 
                height = canvas.height * 0.15; 
                img = imagenesPreCargadas.sandia;
                break;
            case 6:
                width = canvas.width * 0.15; 
                height = canvas.height * 0.15; 
                img = imagenesPreCargadas.bomba;
                break;
        }
        
        console.log(`Creando bloque con figura ${figura}, imagen:`, img.src, 'complete:', img.complete, 'naturalWidth:', img.naturalWidth);
        
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
        return new Block(x, y, width, height, dy, dx, alturaMaximaDeseada, angulo, timer, img);
    }

    function actualizarDificultad() {
        if(tiempoJuego < 20000) { 
            intervaloSpawn = 2000;
            maxBloquesConcurrentes = 5;
        } else if(tiempoJuego < 40000) { 
            intervaloSpawn = 1500;
            maxBloquesConcurrentes = 6;
        } else if(tiempoJuego < 60000) {
            intervaloSpawn = 1000;
            maxBloquesConcurrentes = 7;
        } else if(tiempoJuego < 90000) { 
            intervaloSpawn = 800;
            maxBloquesConcurrentes = 8;
        } else { 
            intervaloSpawn = 500;
            maxBloquesConcurrentes = 9;
        }
    }
    
    let lastTime = Date.now();

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
            const nuevoBloque = crearNuevoBloque();
            if(nuevoBloque) {
                blocks.push(nuevoBloque);
            }
            ultimoSpawn = 0;
        }

        // DIBUJAR FONDO Y ESTADO DE JUEGO
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dibujarTachas();
        
        for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i];
            
            const updateResult = block.update(canvas, blocks, crearEfectoSplash); 
            fallos += updateResult.fallos; 
            
            block.draw(ctx);

            if (block.collides(puntero_mouse) && !block.esDivision && !block.cortado) {
                
                if(block.imagen.src.includes('bomba.png')){
                    
                    // Reemplazo de alert()
                    mostrarMensajeEnCanvas(`¡Game Over! Cortaste una bomba. Tu puntuación final es: ${score}`, canvas.width / 2, canvas.height / 2);
                    
                    gameOver = true;
                    gameRunning = false;
                    cancelAnimationFrame(animationFrameId);
                    startButton.disabled = false; 
                    return;
                }
                
                // EFECTO DE CORTE: Se mantiene la llamada a la función que ya implementa el efecto de slash
                crearEfectoSlash(block.x, block.y, .5);
                
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
                // Reemplazo de alert()
                mostrarMensajeEnCanvas(`¡Game Over! Dejaste caer demasiadas frutas. Tu puntuación final es: ${score}`, canvas.width / 2, canvas.height / 2);

                gameOver = true;
                gameRunning = false;
                cancelAnimationFrame(animationFrameId);
                startButton.disabled = false; 
                return;
            }
        }

        // --- BUCLE DE EFECTOS ---
        for (let i = efectos.length - 1; i >= 0; i--) {
            const efecto = efectos[i];
            efecto.update(deltaTime);
            efecto.draw(ctx); 

            if (efecto.terminado) {
                efectos.splice(i, 1);
            }
        }
        // -------------------------

        mostrar_puntero();
        
        ctx.fillStyle = '#ffffffff';
        ctx.lineWidth = '32px';
        ctx.textAlign = 'left';
        ctx.fillText(score, 30, 30);

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Función para mostrar mensajes de Game Over en el canvas (Reemplazo de alert())
    function mostrarMensajeEnCanvas(mensaje, x, y) {
        // Redibuja el canvas una última vez para asegurar que todos los bloques y efectos se muestren antes del mensaje
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dibujarTachas();
        blocks.forEach(block => block.draw(ctx));
        efectos.forEach(efecto => efecto.draw(ctx));
        
        // Muestra el mensaje de Game Over
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height); 

        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(mensaje.split('. ')[0] + '.', x, y - 40);

        ctx.font = '32px Arial';
        ctx.fillText(mensaje.split('. ')[1], x, y + 20);

        ctx.font = '20px Arial';
        ctx.fillText('Haz click en el botón "Reiniciar Juego" para volver a jugar.', x, y + 80);
    }

    startButton.addEventListener('click', iniciarJuego); // Ahora usa la función reutilizable

    resetButton.addEventListener('click', () => {
        location.reload(); 
    });

    function drawInitialScreen() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dibujarTachas();
        ctx.fillStyle = '#fffcfcff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        
        if(!imagenesListas) {
            ctx.fillText(`Cargando imágenes... ${imagenesContador}/${imagenesPorCargar.length}`, canvas.width / 2, canvas.height / 2 - 40);
        } else {
            ctx.fillText('Pulsa "Iniciar Juego" o haz CLICK en el canvas para empezar', canvas.width / 2, canvas.height / 2 - 40);
            ctx.font = '16px Arial';
            ctx.fillText('Las frutas aparecerán gradualmente', canvas.width / 2, canvas.height / 2);
            ctx.fillText('¡Evita las bombas y no dejes caer 3 frutas!', canvas.width / 2, canvas.height / 2 + 30);
        }
        
        ctx.fillText(score);
    }
    
    // Cargar imágenes y luego mostrar pantalla inicial
    cargarImagenes().then(() => {
        drawInitialScreen();
        startButton.disabled = false;
    });
    
    drawInitialScreen();
});