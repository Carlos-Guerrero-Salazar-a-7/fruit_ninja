// source/scriptes/object.js

export class Block { // <--- EXPORTADO
    constructor(x, y, width, height, dy, dx, hmax, angle, timer, img, esDivision = false, tamañoOriginal = null) {
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
        this.hitboxReduccion = this.imagen.src.includes('bomba.png') ? 0.6 : 1.0; 
        this.tamañoOriginal = tamañoOriginal || { width: width, height: height };
        this.cortado = false; 
    }
    
    // Recibe ctx para poder dibujar
    draw(ctx) { // <--- Parámetro: ctx
        if (this.imagen && this.imagen.complete) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle);
            ctx.drawImage(this.imagen, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
    }

    // Recibe canvas y gameData para las interacciones
    update(canvasHeight, blocks, crearEfectoSplash, fallos) { // <--- Parámetros: canvasHeight, blocks, crearEfectoSplash, fallos (solo para actualizar)
        if(this.estado != false){
            this.x += this.dx;
            this.y -= this.dy;

            if(!this.esDivision) { 
                this.angle += this.dx * 0.05;
            }
            
            this.dy -= 0.15; 

            // Comprobar si sale de la pantalla
            if (this.y > canvasHeight || this.x > canvas.width || this.x < -0 - this.width) {
                const index = blocks.indexOf(this);
                if(index === -1) return; // Ya fue eliminado

                if(this.imagen.src.includes('bomba.png') || this.esDivision){
                    // Bombas y mitades cortadas se eliminan sin penalización/splash de fallo
                    blocks.splice(index, 1);
                } else {
                    // Es una fruta completa que toca el suelo (fallo)
                    crearEfectoSplash(
                        this.x + this.width / 2,
                        canvasHeight - 20, 
                        2.5
                    );
                    
                    // Aquí es donde se devuelve el cambio de estado (fallos)
                    blocks.splice(index, 1);
                    return { fallos: 1 }; // Retorna el incremento de fallos
                }
            }
        }
        return { fallos: 0 }; // Retorna 0 fallos
    }

    // El método collides no tiene dependencias globales, se queda igual.
    collides(puntero_mause) { 
        if (this.cortado) return false;

        const hitboxWidth = this.width * this.hitboxReduccion;
        const hitboxHeight = this.height * this.hitboxReduccion;
        const hitboxX = this.x + (this.width - hitboxWidth) / 2;
        const hitboxY = this.y + (this.height - hitboxHeight) / 2;
        
        const closestX = Math.max(hitboxX, Math.min(puntero_mause.x, hitboxX + hitboxWidth));
        const closestY = Math.max(hitboxY, Math.min(puntero_mause.y, hitboxY + hitboxHeight));

        const distanceX = puntero_mause.x - closestX;
        const distanceY = puntero_mause.y - closestY;

        return (distanceX * distanceX + distanceY * distanceY) < (puntero_mause.radius * puntero_mause.radius);
    }
    
    // playKnifeSlash necesita el audioContext de script.js. Lo recibe como argumento.
    playKnifeSlash(audioContext) { // <--- Parámetro: audioContext
        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

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

    // Recibe todas las variables/funciones necesarias para crear las mitades y efectos.
    dividir(slashX, slashY, blocks, crearEfectoSlash, audioContext) { // <--- Parámetros: blocks, crearEfectoSlash, audioContext
        let imgMitad1 = new Image();
        let imgMitad2 = new Image();
        
        // ... (Tu lógica para cargar imgMitad1/2 es correcta)

        // Asumiendo que la lógica de carga de imágenes de mitades está correcta:
        if(this.imagen.src.includes('pomegrate.png')){
            imgMitad1.src = './imagenes/pomegrate1.png';
            imgMitad2.src = './imagenes/pomegrate2.png';
        } else if(this.imagen.src.includes('banana.png')){
            imgMitad1.src = './imagenes/banana1.png';
            imgMitad2.src = './imagenes/banana2.png';
        } else if(this.imagen.src.includes('pina.png')){
            imgMitad1.src = './imagenes/pina1.png';
            imgMitad2.src = './imagenes/pina2.png';
        } else if(this.imagen.src.includes('manzanas.png')){
            imgMitad1.src = './imagenes/manzanas1.png';
            imgMitad2.src = './imagenes/manzanas2.png';
        } else if(this.imagen.src.includes('sandia.png')){
            imgMitad1.src = './imagenes/sandia1.png';
            imgMitad2.src = './imagenes/sandia2.png';
        } else {
            return { score: 0 };
        }
        
        // Generar el efecto de corte y sonido
        crearEfectoSlash(slashX, slashY); 
        this.playKnifeSlash(audioContext);
        
        const velocidadCaidaInicial = -8;
        
        // Mitad 1
        const mitad1 = new Block(this.x, this.y, this.width / 2, this.height, velocidadCaidaInicial, this.dx * -1.5, this.hmax, this.angle, 20, imgMitad1, true, this.tamañoOriginal);
        // Mitad 2
        const mitad2 = new Block(this.x + this.width / 2, this.y, this.width / 2, this.height, velocidadCaidaInicial, this.dx * 1.5, this.hmax, this.angle, 0, imgMitad2, true, this.tamañoOriginal);
        
        blocks.push(mitad1, mitad2);
        this.cortado = true;
        return { score: 1 }; // Retorna el punto de score
    }
}