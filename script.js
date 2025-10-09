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
    const displayCoords = document.getElementById('displayCoords');

    function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;   
    }

    const puntero_mouse = {
        x:0,
        y:0,
        radius: 10,
        color: '#0066ffff'
    };
    function mostrar_puntero() {
        ctx.beginPath();
        ctx.arc(puntero_mouse.x, puntero_mouse.y, puntero_mouse.radius, 0, Math.PI * 2);
        ctx.fillStyle = puntero_mouse.color;
        ctx.fill();
        ctx.closePath();
    }

    canvas.addEventListener('mousemove', (event) => {
            displayCoords.textContent = 'Mouse position: X: -, Y: -';

             const x = event.clientX - rect.left; // Posición X relativa al canvas
            const y = event.clientY - rect.top; // Y-coordinate relative to the viewport
            displayCoords.textContent = `Mouse position: X: ${x-canvas.getAttribute("width")}, Y: ${y-canvas.getAttribute("height")}`;
            puntero_mouse.x=x;
            puntero_mouse.y=y;
        });


    class Block {
        constructor(x, y, width, height, dy,dx,hmax,angle,timer,img) {
            this.x = x;//posiciones actuales
            this.y = y;
            this.width = width;//tamaños
            this.height = height;
            this.dy = dy;//dezplazamiento vertical
            this.dx = dx;//desplazamiento horizontal
            this.hmax=hmax;//altura donde empieza a bajar
            this.angle=angle;//movimiento que ocupa dx
            this.estado=true;
            this.timer=timer;
            this.segundos=0;
            this.imagen=img
        }
        
        
        draw() {
            if (this.imagen && this.imagen.complete) {
                ctx.drawImage(this.imagen, this.x, this.y, this.width, this.height);
            }
        }

        update() {
            if(this.estado!=false){
                this.x += this.dx;
                this.y -= this.dy;
                //reinicio del bloque en la altura original
                if(this.y<=this.hmax){
                    this.dy-=0.1;
                }
                if (this.y > canvas.height || this.x>canvas.width || this.x<-0-this.width) {
                    this.recall();
                    this.iniciarTimer(this.timer);
                }
            }
        }

        collides(puntero_mause) {
            const collisionX = puntero_mause.x + puntero_mause.radius > this.x && puntero_mause.x - puntero_mause.radius < this.x + this.width;
            const collisionY = puntero_mause.y + puntero_mause.radius > this.y && puntero_mause.y - puntero_mause.radius < this.y + this.height;
            return collisionX && collisionY;
        }

        iniciarTimer(timeout) {
                this.segundos=0
                this.estado=false
                setTimeout(() => {
                    this.estado=true;   
                }, timeout);
        }

        recall(){
            this.timer = Math.floor( Math.random()*10)*1000;
            this.iniciarTimer(this.timer);
            this.width=Math.floor((Math.random()*6))+1;
            let direccion_random = Math.floor(Math.random()*2);
            this.angulo = Math.floor(Math.random()*90);
            this.dx = Math.cos(this.angulo)
            if(direccion_random==1){
                this.angulo=-this.angulo;
            }
            switch(this.width){
                case 1:this.width=40;this.height = 40;this.imagen.src='imagenes/pomegrate.png';break;//pomegrate
                case 2:this.width=80;this.height = 40;this.imagen.src='imagenes/banana.png';break;//banana
                case 3:this.width=40;this.height = 80;this.imagen.src='imagenes/piña.png';break;//pila
                case 4:this.width=60;this.height = 60;this.imagen.src='imagenes/manzanas.png';break;//manzana
                case 5:this.width=100;this.height = 100;this.imagen.src='imagenes/sandia.png';break;//melon
                case 6:this.width=100;this.height = 100;this.imagen.src='imagenes/bomba.png';break;//melon
            }
            this.x = Math.random() * (canvas.width - this.width);
            if(this.x < 0 || this.x > canvas.width - this.width){
            this.x = Math.random() * (canvas.width - this.width);
            }
            this.y = canvas.height;
            this.dy = 1.5 + Math.random() * 3;
            this.hmax = Math.floor(Math.random() * canvas.height);
            if(this.hmax < canvas.height / 2) {
                this.hmax = canvas.height / 2;
            }
            this.timer = Math.floor( Math.random()*10)*1000;
        }
            playKnifeSlash() {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(50, now); // Frecuencia inicial alta
            oscillator.frequency.exponentialRampToValueAtTime(20, now + 0.5); // Baja rápido

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(now);
            oscillator.stop(now + 0.15);
            }

// Usar la función
    }
    
    const blocks = [];
    const blockCount = 10;

    function initialize_my_Blocks() {
        
        blocks.length = 0;
        for (let i = 0; i < blockCount; i++) {
            var width=Math.floor((Math.random()*6))+1;
            let height
            var direccion_random = Math.floor(Math.random()*2);
            var angulo = Math.floor(Math.random()*90);
            var dx = Math.cos(angulo)
            let img = new Image();
            if(direccion_random==1){
                angulo=-angulo;
            }
            switch(width){
                case 1:width=40;height = 40;img.src='imagenes/pomegrate.png';break;//pomegrate
                case 2:width=80;height = 40;img.src='imagenes/banana.png';break;//banana
                case 3:width=40;height = 80;img.src='imagenes/piña.png';break;//pila
                case 4:width=60;height = 60;img.src='imagenes/manzanas.png';break;//manzana
                case 5:width=100;height = 100;img.src='imagenes/sandia.png';break;//melon
                case 6:width=100;height = 100;img.src='imagenes/bomba.png';break;//melon
            }
            let x = Math.random() * (canvas.width - width);
            if(x < 0 || x > canvas.width - width){
            x = Math.random() * (canvas.width - width);
            }
            const y = canvas.height;
            const dy = 1.5 + Math.random() * 3;
            let hmax = Math.floor(Math.random() * canvas.height);
            if(hmax < canvas.height / 2) {
                hmax = canvas.height / 2;
            }
            let timer = Math.floor( Math.random()*10)*1000;
            blocks.push(new Block(x, y, width, height, dy,/*dx*/dx,hmax,angulo,timer,img));
        }
    }
    function gameLoop() {
        if (!gameRunning) return; 

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mostrar_puntero();
        for (const block of blocks) {
            block.update();
            block.draw();

            if (block.collides(puntero_mouse)) {
                block.recall();
                block.playKnifeSlash();
                block.iniciarTimer(block.timer);
            }
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    startButton.addEventListener('click', () => {
        if (!gameRunning && !gameOver) {
            gameRunning = true;
            startButton.disabled = true;
            gameLoop();
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
        }
    });

    resetButton.addEventListener('click', () => {
        location.reload(); 
        score = 0;
    });

    function drawInitialScreen() {
        initialize_my_Blocks();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mostrar_puntero();
        
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pulsa "Iniciar Juego" para empezar', canvas.width / 2, canvas.height / 2);
        
    }
    drawInitialScreen();
    
});