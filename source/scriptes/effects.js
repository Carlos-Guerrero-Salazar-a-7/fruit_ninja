// source/scriptes/effects.js

export class Efecto { // <--- EXPORTADO
    constructor(x, y, spritesheet, frameWidth, frameHeight, totalFrames, fps, escala = 1) {
        this.x = x;
        this.y = y;
        this.spritesheet = spritesheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.totalFrames = totalFrames;
        this.frameActual = 0;
        this.fps = fps;
        this.frameDelay = 1000 / fps;
        this.tiempoAcumulado = 0;
        this.terminado = false;
        this.escala = escala;
    }

    update(deltaTime) {
        if (this.terminado) return;
        this.tiempoAcumulado += deltaTime;
        if (this.tiempoAcumulado >= this.frameDelay) {
            this.frameActual++;
            this.tiempoAcumulado = 0;
            if (this.frameActual >= this.totalFrames) {
                this.terminado = true;
            }
        }
    }

    draw(ctx) {
        if (this.terminado) return;
        if (!this.spritesheet.complete || this.spritesheet.naturalWidth === 0) {
            return; 
        }

        const frameX = this.frameActual * this.frameWidth;
        const frameY = 0; 

        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.drawImage(
            this.spritesheet,
            frameX, frameY,
            this.frameWidth, this.frameHeight,
            -this.frameWidth * this.escala / 2,
            -this.frameHeight * this.escala / 2,
            this.frameWidth * this.escala,
            this.frameHeight * this.escala
        );
        
        ctx.restore();
    }
}