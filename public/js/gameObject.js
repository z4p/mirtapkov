class GameObject
{
    static STATUS = {
        default: 'default',
        hover: 'hover',
        active: 'active',
    };

    DIRECTION = {
        right: 0,
        bottom: 1,
        left: 2,
        top: 3,
    };

    FRAME_RATE = 10;
    SPEED = 80; // pixels per second

    #spriteSize;
    #cellSize;
    #cellX;
    #cellY;
    #X;
    #Y;
    #sprite;
    #spriteFramesCount;
    #currentFrame;
    #timeMs;
    #direction;
    #isMoving;
    #status;
    #name;
    #moveLength = 3;
    #shootLength = 3;
    #movingPath;

    constructor(cellX, cellY, spriteSrc, spriteFrames, spriteSize, cellSize, direction, name) {
        this.#spriteSize = spriteSize;
        this.#cellSize = cellSize;
        this.#cellX = cellX;
        this.#cellY = cellY;
        this.#X = cellX * cellSize;
        this.#Y = cellY * cellSize;
        this.#sprite = new Image();
        this.#sprite.src = spriteSrc;
        this.#spriteFramesCount = spriteFrames;
        this.#currentFrame = 0;
        this.#timeMs = (new Date()).getTime();
        this.#direction = direction;
        this.#isMoving = false;
        this.#status = 'default';
        this.#name = name;
        this.#movingPath = [];
    }

    tick() {
        const dt = ((new Date()).getTime() - this.#timeMs) / 1000;

        if (!this.#isMoving) {
            this.#timeMs = (new Date()).getTime();
            return;
        }

        if (dt > 1/this.FRAME_RATE) {
            const framesToAdd = Math.floor(dt * this.FRAME_RATE);
            this.#currentFrame = (this.#currentFrame + framesToAdd) % this.#spriteFramesCount;
            this.#timeMs = (new Date()).getTime() - (framesToAdd / this.FRAME_RATE);
        }

        if (this.#movingPath.length) {
            const movingVector = {
                x: this.#movingPath[0].x - this.getCellX(),
                y: this.#movingPath[0].y - this.getCellY()
            };

            if (movingVector.x === 1) {
                this.#setDirection(this.DIRECTION.right);
                this.#X += this.SPEED * dt;
            }
            if (movingVector.x === -1) {
                this.#setDirection(this.DIRECTION.left);
                this.#X -= this.SPEED * dt;
            }
            if (movingVector.y === 1) {
                this.#setDirection(this.DIRECTION.bottom);
                this.#Y += this.SPEED * dt;
            }
            if (movingVector.y === -1) {
                this.#setDirection(this.DIRECTION.top);
                this.#Y -= this.SPEED * dt;
            }

            const distanceLeft = Math.sqrt(
                (this.#movingPath[0].x * this.#cellSize - this.#X)^2 +
                (this.#movingPath[0].y * this.#cellSize - this.#Y)^2
            )
            if (distanceLeft < 4) {
                this.#cellX = this.#movingPath[0].x;
                this.#cellY = this.#movingPath[0].y;
                this.#X = this.#cellX * this.#cellSize;
                this.#Y = this.#cellY * this.#cellSize;
                this.#movingPath.shift();
            }
        } else {
            this.stop();
        }
    }

    draw(ctx) {
        this.tick();

        const currentFrameX = this.#currentFrame * this.#spriteSize;
        const currentFrameY = this.#direction * this.#spriteSize;

        ctx.drawImage(
            this.#sprite,
            currentFrameX,
            currentFrameY,
            this.#spriteSize,
            this.#spriteSize,
            this.#X,
            this.#Y,
            this.#cellSize,
            this.#cellSize,
        );
    }

    #setDirection(direction) {
        this.#direction = direction;
    }

    movePath(pathArray) {
        this.#isMoving = true;

        console.log(`Moving ${this.#name} with path: ${JSON.stringify(pathArray)}`);

        this.#movingPath = pathArray;
    }

    stop() {
        this.#isMoving = false;
    }

    shoot() {}

    getName() {
        return this.#name;
    }

    getCellX() {
        return this.#cellX;
    }

    getCellY() {
        return this.#cellY;
    }

    status(status) {
        if (Object.hasOwn(this.STATUS, status)) {
            throw Error(`Status ${status} not found in GameObject ${this.#name}`);
        }

        this.#status = status;
    }

    getMoveLength() {
        return this.#moveLength;
    }

    getShootLength() {
        return this.#shootLength;
    }
}
