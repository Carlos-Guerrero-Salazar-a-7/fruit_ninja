// source/scriptes/object.js

export class Block {
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
        this.hitboxReduccion = this.imagen.src.includes('bomba.png') ? 0.4 : 0.8; 
        this.tamañoOriginal = tamañoOriginal || { width: width, height: height };
        this.cortado = false; 
    }
    
    draw(ctx) {
        if (this.imagen && this.imagen.complete && this.imagen.naturalWidth > 0) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle/4);
            ctx.drawImage(this.imagen, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
    }

    update(canvasElement, blocks, crearEfectoSplash) {
        if(this.estado != false){
            this.x += this.dx;
            this.y -= this.dy;

            if(!this.esDivision) { 
                this.angle += this.dx * 0.05;
            }
            
            this.dy -= 0.15; 

            if (this.y > canvasElement.height || this.x > canvasElement.width || this.x < -this.width) {
                const index = blocks.indexOf(this);
                if(index === -1) return { fallos: 0 };

                if(this.imagen.src.includes('bomba.png') || this.esDivision){
                    blocks.splice(index, 1);
                } else {
                    crearEfectoSplash(
                        this.x + this.width / 2,
                        canvasElement.height - 20,
                        2.5
                    );
                    
                    blocks.splice(index, 1);
                    return { fallos: 1 };
                }
            }
        }
        return { fallos: 0 };
    }

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

    dividir(slashX, slashY, blocks, audioContext) {
        // Obtener referencias a las imágenes precargadas desde window
        const imagenesPreCargadas = window.imagenesPreCargadas;
        
        let imgMitad1, imgMitad2;

        if(this.imagen.src.includes('a.png')){
            imgMitad1 = imagenesPreCargadas.pomegrate1;
            imgMitad2 = imagenesPreCargadas.pomegrate2;
        } else if(this.imagen.src.includes('b.png')){
            imgMitad1 = imagenesPreCargadas.banana1;
            imgMitad2 = imagenesPreCargadas.banana2;
        } else if(this.imagen.src.includes('c.png')){
            imgMitad1 = imagenesPreCargadas.pina1;
            imgMitad2 = imagenesPreCargadas.pina2;
        } else if(this.imagen.src.includes('d.png')){
            imgMitad1 = imagenesPreCargadas.manzanas1;
            imgMitad2 = imagenesPreCargadas.manzanas2;
        } else if(this.imagen.src.includes('e.png')){
            imgMitad1 = imagenesPreCargadas.sandia1;
            imgMitad2 = imagenesPreCargadas.sandia2;
        } else {
            return { score: 0 };
        }
        
        const velocidadCaidaInicial = -8;
        
        const mitad1 = new Block(this.x, this.y, this.width / 2, this.height, velocidadCaidaInicial, this.dx * -1.5, this.hmax, this.angle, 20, imgMitad1, true, this.tamañoOriginal);
        const mitad2 = new Block(this.x + this.width / 2, this.y, this.width / 2, this.height, velocidadCaidaInicial, this.dx * 1.5, this.hmax, this.angle, 0, imgMitad2, true, this.tamañoOriginal);

        blocks.push(mitad1, mitad2);
        this.cortado = true;
        return { score: 1 };
    }
}