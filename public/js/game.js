class Game {
    CELL_SIZE = 80;
    #canvas;
    #ctx;
    #gameObjects = [];
    #cellHover;
    #cellActive;
    #movingArea;
    #cellsWidth;
    #cellsHeight;
    #timestamp;

    constructor() {
        this.#canvas = document.getElementById('gamescreen');
        this.#ctx = this.#canvas.getContext("2d");
        this.#gameObjects = [];
        this.#movingArea = [];
        this.#cellHover = null;
        this.#cellActive = null;

        this.#cellsWidth = Math.floor(this.#canvas.width / this.CELL_SIZE);
        this.#cellsHeight = Math.floor(this.#canvas.height / this.CELL_SIZE);

        this.#canvas.addEventListener('click', event => {
            const x = event.offsetX;
            const y = event.offsetY;
            const cellX = Math.floor(x / this.CELL_SIZE);
            const cellY = Math.floor(y / this.CELL_SIZE);
            this.click(cellX, cellY);
        });

        this.#canvas.addEventListener('mousemove', event => {
            const x = event.offsetX;
            const y = event.offsetY;
            const cellX = Math.floor(x / this.CELL_SIZE);
            const cellY = Math.floor(y / this.CELL_SIZE);
            this.cursorMove(cellX, cellY);
        });

        const tank1 = new GameObject(
            0,
            0,
            'assets/markotapok1.png',
            4,
            80,
            this.CELL_SIZE,
            1,
            'tank1'
        );
        const tank2 = new GameObject(
            8,
            5,
            'assets/markotapok2.png',
            4,
            80,
            this.CELL_SIZE,
            0,
            'tank2'
        );

        let wallsPositions = [];
        for (let i = 0; i < 10; i++) {
            wallsPositions.push({x: Math.floor(Math.random() * 4)*2 + 1, y: Math.floor(Math.random() * 6)});
        }

        const walls = wallsPositions.map(position =>
            new GameObject(position.x, position.y, 'assets/markowall1.png', 1, 80, this.CELL_SIZE, 0, `wall${position.x}-${position.y}`)
        );

        this.#gameObjects.push(tank1, tank2, ...walls);

        this.draw();
    }

    draw(timestamp = 0) {
        const dt = timestamp - (this.#timestamp ?? 0);
        this.#timestamp = timestamp;
        const fps = dt > 0
            ? 1000 / dt
            : 0;

        this.drawBackground();

        this.#ctx.save();
        this.#ctx.font = '16px "Arial", san-serif';
        this.#ctx.strokeStyle = '#FFFF00';
        this.#ctx.fillStyle = '#FFFF00';
        this.#ctx.lineWidth = 3;
        this.#ctx.fillText(Math.floor(fps).toLocaleString(), 10, 20);
        this.#ctx.restore();

        this.#gameObjects.forEach(gameObject => gameObject.draw(this.#ctx));

        requestAnimationFrame(timestamp => this.draw(timestamp));
    }

    drawBackground() {
        // battlefield
        this.#ctx.fillStyle = '#DDEEFF';
        this.#ctx.strokeStyle = '#333333';

        this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        for (let i = 0; i <= this.#cellsWidth; i++) {
            this.#ctx.moveTo(i * this.CELL_SIZE, 0);
            this.#ctx.lineTo(i * this.CELL_SIZE, this.#canvas.height);
        }
        for (let j = 0; j <= this.#cellsHeight; j++) {
            this.#ctx.moveTo(0, j * this.CELL_SIZE);
            this.#ctx.lineTo(this.#canvas.width, j * this.CELL_SIZE);
        }

        this.#ctx.stroke();

        // moving area cells
        if (this.#movingArea) {
            this.#ctx.fillStyle = '#99CCFF';
            this.#ctx.strokeStyle = '#333333';

            this.#movingArea.forEach(cell => {
                this.#ctx.fillRect(
                    cell.x*this.CELL_SIZE+1,
                    cell.y*this.CELL_SIZE+1,
                    this.CELL_SIZE-2,
                    this.CELL_SIZE-2
                );
            });
        }

        // active cell
        if (this.#cellActive) {
            this.#ctx.fillStyle = '#66AAFF';
            this.#ctx.strokeStyle = '#333333';

            this.#ctx.fillRect(this.#cellActive.x*this.CELL_SIZE+1, this.#cellActive.y*this.CELL_SIZE+1, this.CELL_SIZE-2, this.CELL_SIZE-2);
        }

        // hover cell
        if (this.#cellHover) {
            this.#ctx.fillStyle = '#BBFFBB';
            this.#ctx.strokeStyle = '#333333';

            this.#ctx.fillRect(this.#cellHover.x*this.CELL_SIZE+1, this.#cellHover.y*this.CELL_SIZE+1, this.CELL_SIZE-2, this.CELL_SIZE-2);
        }
    }

    cursorMove(cellX, cellY) {
        const objectAtCell = this.getObjectAt(cellX, cellY);
        const isCellInMovingArea = this.#movingArea
            .filter(movingCell => movingCell.x === cellX && movingCell.y === cellY)
            .length > 0;

        if (objectAtCell?.getName() === 'tank1' || objectAtCell?.getName() === 'tank2' || isCellInMovingArea) {
            this.#canvas.style.cursor = 'pointer';
            this.#cellHover = {x: cellX, y: cellY};
        } else {
            this.#canvas.style.cursor = 'auto';
            this.#cellHover = null;
        }
    }

    click(cellX, cellY) {
        let clickedTank = null;
        const gameObject = this.getObjectAt(cellX, cellY);
        if (gameObject && (gameObject.getName() === 'tank1' || gameObject.getName() === 'tank2')) {
            clickedTank = gameObject;
        }

        if (clickedTank) {
            const activeTank = this.#cellActive
                ? this.getObjectAt(this.#cellActive.x, this.#cellActive.y)
                : null;
            const isClickedActiveTank = activeTank && activeTank.getCellX() === cellX && activeTank.getCellY() === cellY;
            const isFireAction = activeTank &&
                    !(activeTank.getCellX() === cellX && activeTank.getCellY() === cellY) &&
                    this.isOneSeeOther(activeTank, clickedTank);

            switch (true) {
                case isClickedActiveTank:
                    this.#cellActive = null;
                    this.#movingArea = [];
                    break;
                case isFireAction:
                    this.fire(activeTank, clickedTank);
                    this.#cellActive = null;
                    this.#movingArea = [];
                    break;
                default:
                    this.#cellActive = {x: cellX, y: cellY};
                    this.recalculateMovingArea(clickedTank);
            }
        } else {
            const isCellInMovingArea = this.#movingArea
                .filter(movingCell => movingCell.x === cellX && movingCell.y === cellY)
                .length > 0;

            if (isCellInMovingArea) {
                // move active tank to clicked cell
                if (!this.#cellActive) {
                    throw new Error('No active cell');
                }
                const activeTank = this.getObjectAt(this.#cellActive.x, this.#cellActive.y);
                if (!activeTank) {
                    throw new Error('No tank on active cell');
                }

                let path = [];

                const game = this;

                function deepSearch(x, y, length, currentPath, visited = new Set()) {
                    if (length < 0) return;
                    if (x < 0 || y < 0 || x > game.#cellsWidth || y > game.#cellsHeight - 1) return;

                    const key = `${x}:${y}`;
                    if (visited.has(key)) return; // Предотвращаем повторные посещения
                    visited.add(key);

                    if (x === cellX && y === cellY) {
                        currentPath.push({x: x, y: y});
                        if (path.length === 0 || path.length > currentPath.length) {
                            path = new Array(...currentPath);
                        }
                        currentPath.pop();
                        visited.delete(key);
                        return;
                    }

                    const objectAtCell = game.getObjectAt(x,y);
                    if (objectAtCell === null || objectAtCell === activeTank) {
                        currentPath.push({x: x, y: y});

                        deepSearch(x-1, y, length-1, currentPath);
                        deepSearch(x+1, y, length-1, currentPath);
                        deepSearch(x, y-1, length-1, currentPath);
                        deepSearch(x, y+1, length-1, currentPath);

                        currentPath.pop();
                    }

                    visited.delete(key);
                }

                deepSearch(activeTank.getCellX(), activeTank.getCellY(), activeTank.getMoveLength(), []);

                if (path.length) {
                    activeTank.movePath(path);
                    this.#movingArea = [];
                } else {
                    throw new Error('Path not found');
                }
            }

            this.#cellActive = null;
        }
    }

    /**
     * @param tank {GameObject}
     */
    recalculateMovingArea(tank) {
        let allowedCells = [];

        const game = this;

        function checkAllowedMoves(x, y, length, visited = new Set()) {
            if (length < 0) return;
            if (x < 0 || y < 0 || x >= game.#cellsWidth || y >= game.#cellsHeight) return;

            const key = `${x}:${y}`;
            if (visited.has(key)) return; // Предотвращаем повторные посещения
            visited.add(key);

            const objectAtCell = game.getObjectAt(x,y);
            if (objectAtCell === null || objectAtCell === tank) {
                allowedCells[x+':'+y] = {x: x, y: y};
            } else {
                return;
            }

            checkAllowedMoves(x-1, y, length-1);
            checkAllowedMoves(x+1, y, length-1);
            checkAllowedMoves(x, y-1, length-1);
            checkAllowedMoves(x, y+1, length-1);

            visited.delete(key);
        }

        checkAllowedMoves(tank.getCellX(), tank.getCellY(), tank.getMoveLength());

        this.#movingArea = [];
        for (const cell in allowedCells) {
            this.#movingArea.push(allowedCells[cell]);
        }
    }

    /**
     *
     * @param cellX{Number}
     * @param cellY{Number}
     * @returns {null|GameObject}
     */
    getObjectAt(cellX, cellY) {
        let object = null;

        this.#gameObjects.forEach(gameObject => {
            if (gameObject.getCellX() === cellX && gameObject.getCellY() === cellY) {
                object = gameObject;
            }
        });

        return object;
    }

    /**
     * @param activeTank{GameObject}
     * @param target{GameObject}
     * @returns {boolean}
     */
    isOneSeeOther(activeTank, target) {
        const vector = {
            x: target.getCellX() - activeTank.getCellX(),
            y: target.getCellY() - activeTank.getCellY(),
        };

        if (vector.x === 0 && vector.y === 0) {
            throw new Error('Нельзя стрелять в свою ячейку');
        }

        // если не находятся на одной линии
        if (vector.x !== 0 && vector.y !== 0) {
            return false;
        }

        const dv = {
            x: vector.x !== 0 ? vector.x / Math.abs(vector.x) : 0,
            y: vector.y !== 0 ? vector.y / Math.abs(vector.y) : 0,
        };

        for (
            let cell = {x: activeTank.getCellX(), y: activeTank.getCellY()};
            cell.x !== target.getCellX() && cell.x !== target.getCellY();
            cell.x += dv.x, cell.y += dv.y
        ) {
            const objectAtCell = this.getObjectAt(cell.x, cell.y);
            if (objectAtCell && objectAtCell !== activeTank && objectAtCell !== target) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param activeTank{GameObject}
     * @param target{GameObject}
     * @returns {void}
     */
    fire(activeTank, target) {
        console.log(activeTank, `shoot to`, target);
    }

    destroy() {
        // Очищаем игровые объекты
        this.#gameObjects.forEach(obj => {
            if (obj.destroy) obj.destroy();
        });
        this.#gameObjects = [];
        this.#movingArea = [];
        this.#cellActive = null;
        this.#cellHover = null;
    }
}
