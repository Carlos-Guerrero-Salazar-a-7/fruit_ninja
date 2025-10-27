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
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        displayCoords.textContent = `Mouse position: X: ${x-canvas.getAttribute("width")}, Y: ${y-canvas.getAttribute("height")}`;
        puntero_mouse.x = x;
        puntero_mouse.y = y;
    });

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
        }
        
        draw() {
            if (this.imagen && this.imagen.complete) {
                ctx.drawImage(this.imagen, this.x, this.y, this.width, this.height);
            }
        }

        update() {
            if(this.estado != false){
                this.x += this.dx;
                this.y -= this.dy;
                
                if(this.y <= this.hmax){
                    this.dy -= 0.1;
                }
                
                if (this.y > canvas.height || this.x > canvas.width || this.x < -0 - this.width) {
                    if(this.imagen.src.includes('bomba.png')){
                        this.recall();
                        this.iniciarTimer(this.timer);
                    } else {
                        fallos += 1;
                        if(this.esDivision){
                            const index = blocks.indexOf(this);
                            if(index > -1){
                                blocks.splice(index, 1);
                            }
                        } else {
                            this.recall();
                            this.iniciarTimer(this.timer);
                        }
                    }
                }
            }
        }

        collides(puntero_mause) {
            const collisionX = puntero_mause.x + puntero_mause.radius > this.x && puntero_mause.x - puntero_mause.radius < this.x + this.width;
            const collisionY = puntero_mause.y + puntero_mause.radius > this.y && puntero_mause.y - puntero_mause.radius < this.y + this.height;
            return collisionX && collisionY;
        }

        iniciarTimer(timeout) {
            this.segundos = 0;
            this.estado = false;
            setTimeout(() => {
                this.estado = true;   
            }, timeout);
        }

        recall(){
            this.timer = Math.floor(Math.random() * 10) * 1000;
            this.iniciarTimer(this.timer);
            this.width = Math.floor((Math.random() * 6)) + 1;
            let direccion_random = Math.floor(Math.random() * 2);
            this.angulo = Math.floor(Math.random() * 90);
            this.dx = Math.cos(this.angulo);
            
            if(direccion_random == 1){
                this.angulo = -this.angulo;
            }
            
            switch(this.width){
                case 1: this.width = 40; this.height = 40; this.imagen.src = 'imagenes/pomegrate.png'; break;
                case 2: this.width = 80; this.height = 40; this.imagen.src = 'imagenes/banana.png'; break;
                case 3: this.width = 40; this.height = 80; this.imagen.src = 'imagenes/piña.png'; break;
                case 4: this.width = 60; this.height = 60; this.imagen.src = 'imagenes/manzanas.png'; break;
                case 5: this.width = 100; this.height = 100; this.imagen.src = 'imagenes/sandia.png'; break;
                case 6: this.width = 100; this.height = 100; this.imagen.src = 'imagenes/bomba.png'; break;
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
            
            this.timer = Math.floor(Math.random() * 10) * 1000;
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

            const mitad1 = new Block(
                this.x,
                this.y,
                this.width / 2,
                this.height,
                this.dy * 1.5,
                this.dx * -0.05,
                this.y - 50,
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
                this.dy * 1.5,
                this.dx *.05,
                this.y - 50,
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
    const blockCount = 10;

    function initialize_my_Blocks() {
        blocks.length = 0;
        
        for (let i = 0; i < blockCount; i++) {
            var width = Math.floor((Math.random() * 6)) + 1;
            let height;
            var direccion_random = Math.floor(Math.random() * 2);
            var angulo = Math.floor(Math.random() * 90);
            var dx = Math.cos(angulo);
            let img = new Image();
            
            if(direccion_random == 1){
                angulo = -angulo;
            }
            
            switch(width){
                case 1: width = 40; height = 40; img.src = 'imagenes/pomegrate.png'; break;
                case 2: width = 80; height = 40; img.src = 'imagenes/banana.png'; break;
                case 3: width = 40; height = 80; img.src = 'imagenes/piña.png'; break;
                case 4: width = 60; height = 60; img.src = 'imagenes/manzanas.png'; break;
                case 5: width = 100; height = 100; img.src = 'imagenes/sandia.png'; break;
                case 6: width = 100; height = 100; img.src = 'imagenes/bomba.png'; break;
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
            
            let timer = Math.floor(Math.random() * 10) * 1000;
            blocks.push(new Block(x, y, width, height, dy, dx, hmax, angulo, timer, img));
        }
    }
    
    function gameLoop() {
        if (!gameRunning) return; 

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mostrar_puntero();
        
        for (const block of blocks) {
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
                block.recall();
                block.iniciarTimer(block.timer);
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