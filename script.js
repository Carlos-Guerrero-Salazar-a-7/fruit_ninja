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
    let intervaloSpawn = 1000; 
    let maxBloquesConcurrentes = 5;

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
        // Dibujar el trazo
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
        
        // Dibujar el puntero
        ctx.beginPath();
        ctx.arc(puntero_mouse.x, puntero_mouse.y, puntero_mouse.radius, 0, Math.PI * 2);
        ctx.fillStyle = puntero_mouse.color;
        ctx.fill();
        ctx.closePath();
    }

    canvas.addEventListener('mousemove', (event) => {
        displayCoords.textContent = 'Mouse position: X: -, Y: -';
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        displayCoords.textContent = `Mouse position: X: ${x-canvas.getAttribute("width")}, Y: ${y-canvas.getAttribute("height")}`;
        puntero_mouse.x = x;
        puntero_mouse.y = y;
        
        // Agregar punto al trazo
        trazo.push({x: x, y: y});
        
        // cambio de los últimos puntos
        if(trazo.length > maxPuntosTrazo) {
            trazo.shift();
        }
    });

    canvas.addEventListener('mousemove', (event) => {
        displayCoords.textContent = 'Mouse position: X: -, Y: -';
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        displayCoords.textContent = `Mouse position: X: ${x-canvas.getAttribute("width")}, Y: ${y-canvas.getAttribute("height")}`;
        puntero_mouse.x = x;
        puntero_mouse.y = y;
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
            
            // Dibujar X (tacha)
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + tamaño, y + tamaño);
            ctx.moveTo(x + tamaño, y);
            ctx.lineTo(x, y + tamaño);
            ctx.stroke();
            ctx.closePath();
        }
    }
    class Block {
        constructor(x, y, width, height, dy, dx, hmax, angle, timer, img, esDivision=false, tamañoOriginal=null) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.dy = dy;
            this.dx = dx;
            this.hmax = hmax;
            this.angle = angle;
            this.estado = true;
            this.timer = timer;
            this.segundos = 0;
            this.imagen = img;
            this.esDivision = esDivision;
            this.tamañoOriginal = tamañoOriginal || {width: width, height: height};
            this.hitboxReduccion = this.imagen.src.includes('bomba.png') ? 0.4 : 1.0;
        }
        
        draw() {
            dibujarTachas();
            if (this.imagen && this.imagen.complete) {
               ctx.save();
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.rotate(this.angle);
                ctx.drawImage(this.imagen, -this.width / 2, -this.height / 2, this.width, this.height);
                ctx.restore();
            }
        }

        update() {
            if(this.estado != false){
                this.x += this.dx;
                this.y -= this.dy;

                if(!this.esDivision) {
                    this.angle += this.dx * 0.05;
                }
                if(this.y <= this.hmax){
                    this.dy -= 0.4;
                }
                
                if (this.y > canvas.height || this.x > canvas.width || this.x < -0 - this.width) {
                    if(this.imagen.src.includes('bomba.png')){
                        // Las bombas simplemente se eliminan
                        const index = blocks.indexOf(this);
                        if(index > -1){
                            blocks.splice(index, 1);
                        }
                    } else {
                        if(!this.esDivision) {
                            fallos += 1;
                        }
                        const index = blocks.indexOf(this);
                        if(index > -1){
                            blocks.splice(index, 1);
                        }
                    }
                }
            }
        }

        collides(puntero_mause) {
            const hitboxWidth = this.width * this.hitboxReduccion;
            const hitboxHeight = this.height * this.hitboxReduccion;
            const hitboxX = this.x + (this.width - hitboxWidth) / 2;
            const hitboxY = this.y + (this.height - hitboxHeight) / 2;
            
            const collisionX = puntero_mause.x + puntero_mause.radius > hitboxX && puntero_mause.x - puntero_mause.radius < hitboxX + hitboxWidth;
            const collisionY = puntero_mause.y + puntero_mause.radius > hitboxY && puntero_mause.y - puntero_mause.radius < hitboxY + hitboxHeight;
            return collisionX && collisionY;
        }
        
        playKnifeSlash() {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(50, now);
            oscillator.frequency.exponentialRampToValueAtTime(20, now + 0.5);

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(now);
            oscillator.stop(now + 0.15);
        }

        dividir(){
            let imgMitad1 = new Image();
            let imgMitad2 = new Image();
            
            if(this.imagen.src.includes('pomegrate.png')){
                imgMitad1.src = 'imagenes/pomegrate1.png';
                imgMitad2.src = 'imagenes/pomegrate2.png';
            } else if(this.imagen.src.includes('banana.png')){
                imgMitad1.src = 'imagenes/banana1.png';
                imgMitad2.src = 'imagenes/banana2.png';
            } else if(this.imagen.src.includes('piña.png')){
                imgMitad1.src = 'imagenes/piña1.png';
                imgMitad2.src = 'imagenes/piña2.png';
            } else if(this.imagen.src.includes('manzanas.png')){
                imgMitad1.src = 'imagenes/manzanas1.png';
                imgMitad2.src = 'imagenes/manzanas2.png';
            } else if(this.imagen.src.includes('sandia.png')){
                imgMitad1.src = 'imagenes/sandia1.png';
                imgMitad2.src = 'imagenes/sandia2.png';
            } else {
                return;
            }

           
            const velocidadCaida = -10; // Ajusta la velocidad de caída según el tamaño original
            
            const mitad1 = new Block(
                this.x,
                this.y,
                this.width / 2,
                this.height,
                velocidadCaida,
                this.dx * -1.5,
                this.y - 999999, // Altura máxima muy alta para que solo caiga
                this.angle,
                20,
                imgMitad1,
                true,
                this.tamañoOriginal
            );
            
            const mitad2 = new Block(
                this.x + this.width / 2,
                this.y,
                this.width / 2,
                this.height,
                velocidadCaida,
                this.dx * 1.5,
                this.y - 999999, // Altura máxima muy alta para que solo caiga
                this.angle,
                0,
                imgMitad2,
                true,
                this.tamañoOriginal
            );
            
            blocks.push(mitad1, mitad2);
        }
    }
    
    const blocks = [];

    function crearNuevoBloque() {
        var width = Math.floor((Math.random() * 6)) + 1;
        let height;
        var angulo = Math.floor(Math.random() * 90);
        let img = new Image();
        
        switch(width){
            case 1: // Granada (pequeña, cuadrada)
                width = canvas.width * 0.1; 
                height = canvas.width * 0.1; 
                img.src = 'imagenes/pomegrate.png'; 
                break;
            case 2: // Banana (rectangular horizontal)
                width = canvas.width * 0.15; 
                height = canvas.height * 0.10; 
                img.src = 'imagenes/banana.png'; 
                break;
            case 3: // Piña (rectangular vertical)
                width = canvas.width * 0.10; 
                height = canvas.height * 0.20; 
                img.src = 'imagenes/piña.png'; 
                break;
            case 4: // Manzanas (mediana)
                width = canvas.width * 0.125; 
                height = canvas.width * 0.125; 
                img.src = 'imagenes/manzanas.png'; 
                break;
            case 5: // Sandía (grande)
                width = canvas.width * 0.15; 
                height = canvas.height * 0.15; 
                img.src = 'imagenes/sandia.png'; 
                break;
            case 6: // Bomba (grande)
                width = canvas.width * 0.15; 
                height = canvas.height * 0.15; 
                img.src = 'imagenes/bomba.png'; 
                break;
        }
        
        const centroCanvas = canvas.width / 2;
        let x, dx;
        const spawnDesdeIzquierda = Math.random() < 0.5;
        
        if(spawnDesdeIzquierda) {
            x = Math.random() * (canvas.width * 0.3);
            dx = 0.5 + Math.random() * 2; // Velocidad horizontal positiva
        } else {
            x = canvas.width * 0.7 + Math.random() * (canvas.width * 0.3) - width;
            dx = -(0.5 + Math.random() * 2); // Velocidad horizontal negativa
        }
        
        const y = canvas.height;
        let hmax = canvas.height * 0.2 + Math.random() * (canvas.height * 0.2);
        const distanciaSubida = canvas.height - hmax;
        const gravedad = 0.1;
        const tiempoVueloDeseado = (1.5 + Math.random() * 0.5) * 60;
    
        const dy = (distanciaSubida + 0.5 * gravedad * tiempoVueloDeseado * tiempoVueloDeseado) / tiempoVueloDeseado;
        
        let timer = 0;
        return new Block(x, y, width, height, dy, dx, hmax, angulo, timer, img);
    }

    function actualizarDificultad() {
        if(tiempoJuego > 10000 && tiempoJuego < 20000) {
            intervaloSpawn = 2000;
            maxBloquesConcurrentes = 3;
        } else if(tiempoJuego > 20000 && tiempoJuego < 40000) {
            intervaloSpawn = 1500;
            maxBloquesConcurrentes = 4;
        } else if(tiempoJuego > 40000 && tiempoJuego < 60000) {
            intervaloSpawn = 1000;
            maxBloquesConcurrentes = 5;
        } else if(tiempoJuego > 60000) {
            intervaloSpawn = 500;
            maxBloquesConcurrentes = 6;
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
        
        // Spawneo de nuevos bloques según dificultad
        const bloquesActivos = blocks.filter(b => !b.esDivision).length;
        if(ultimoSpawn >= intervaloSpawn && bloquesActivos < maxBloquesConcurrentes) {
            blocks.push(crearNuevoBloque());
            ultimoSpawn = 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mostrar_puntero();
        
        // Mostrar info de dificultad
        ctx.fillStyle = '#ffffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score} | Fallos: ${fallos}/3 | Tiempo: ${Math.floor(tiempoJuego/1000)}s`, 10, 30);
        
        for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i];
            block.update();
            block.draw();

            if (block.collides(puntero_mouse) && !block.esDivision) {
                if(block.imagen.src.includes('bomba.png')){
                    gameOver = true;
                    gameRunning = false;
                    cancelAnimationFrame(animationFrameId);
                    alert(`Game Over! Your final score is: ${score}`);
                    startButton.disabled = false; 
                    return;
                }
                
                block.dividir();
                block.playKnifeSlash();
                blocks.splice(i, 1);
                score += 1;
            }
            
            if(fallos >= 3){
                gameOver = true;
                gameRunning = false;
                cancelAnimationFrame(animationFrameId);
                alert(`Game Over! Your final score is: ${score}`);
                startButton.disabled = false; 
                return;
            }
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    startButton.addEventListener('click', () => {
        if (!gameRunning && !gameOver) {
            gameRunning = true;
            startButton.disabled = true;
            tiempoJuego = 0;
            ultimoSpawn = 0;
            lastTime = Date.now();
            score = 0;
            fallos = 0;
            blocks.length = 0;
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
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pulsa "Iniciar Juego" para empezar', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '16px Arial';
        ctx.fillText('Las frutas aparecerán gradualmente', canvas.width / 2, canvas.height / 2);
        ctx.fillText('¡Evita las bombas y no dejes caer 3 frutas!', canvas.width / 2, canvas.height / 2 + 30);
    }
    
    drawInitialScreen();
});