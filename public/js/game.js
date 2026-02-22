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

    constructor() {
        this.#canvas = document.getElementById('gamescreen');
        this.#ctx = this.#canvas.getContext("2d");
        this.#gameObjects = [];
        this.#movingArea = [];
        this.#cellHover = null;
        this.#cellActive = null;

        this.#cellsWidth = Math.floor(this.#ctx.width / this.CELL_SIZE);
        this.#cellsHeight = Math.floor(this.#ctx.height / this.CELL_SIZE);

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
            0,
            'tank1'
        );
        const tank2 = new GameObject(
            8,
            5,
            'assets/markotapok2.png',
            4,
            80,
            this.CELL_SIZE,
            2,
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

        setInterval(() => this.draw(), 50);
    }

    draw() {
        this.drawBackground();

        this.#gameObjects.forEach(gameObject => gameObject.draw(this.#ctx, this.CELL_SIZE));
    }

    drawBackground() {
        // battlefield
        this.#ctx.fillStyle = '#DDEEFF';
        this.#ctx.strokeStyle = '#333333';

        this.#ctx.fillRect(1, 1, this.#canvas.width-1, this.#canvas.height-1);
        this.#ctx.rect(1, 1, this.#canvas.width-1, this.#canvas.height-1);

        for (let i = 0; i <= this.#canvas.width / this.CELL_SIZE; i++) {
            this.#ctx.moveTo(i * this.CELL_SIZE, 0);
            this.#ctx.lineTo(i * this.CELL_SIZE, this.#canvas.height);
        }
        for (let j = 0; j <= this.#canvas.height; j++) {
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
            const isDeselectActiveTank = activeTank && activeTank.getCellX() === cellX && activeTank.getCellY() === cellY;
            const isFireAction = activeTank &&
                    !(activeTank.getCellX() === cellX && activeTank.getCellY() === cellY) &&
                    this.isOneSeeOther(activeTank, clickedTank);

            switch (true) {
                case isDeselectActiveTank:
                    this.#cellActive = null;
                    break;
                case isFireAction:
                    this.fire(activeTank, clickedTank);
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

                function deepSearch(x, y, length, currentPath) {
                    if (length < 0) return false;
                    if (x < 0 || y < 0 || x > game.#cellsWidth || y > game.#cellsHeight - 1) return false;

                    if (x === cellX && y === cellY) {
                        currentPath.push({x: x, y: y});
                        path = currentPath;

                        return true;
                    }

                    const objectAtCell = game.getObjectAt(x,y);
                    if (objectAtCell === null || objectAtCell === activeTank) {
                        currentPath.push({x: x, y: y});

                        if (
                            deepSearch(x-1, y, length-1, currentPath) ||
                            deepSearch(x+1, y, length-1, currentPath) ||
                            deepSearch(x, y-1, length-1, currentPath) ||
                            deepSearch(x, y+1, length-1, currentPath)
                        ) {
                            return true;
                        }

                        currentPath.pop();
                    }

                    return false;
                }

                const pathFound = deepSearch(activeTank.getCellX(), activeTank.getCellY(), activeTank.getMoveLength(), [])


                if (pathFound) {
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
        const l = tank.getMoveLength();

        let allowedCells = [];

        const game = this;

        function checkAllowedMoves(x, y, length) {
            if (length < 0) return;
            if (x < 0 || y < 0 || x > game.#cellsWidth || y > game.#cellsHeight - 1) return;

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
     *
     * @param activeTank{GameObject}
     * @param clickedTank{GameObject}
     * @returns {boolean}
     */
    isOneSeeOther(activeTank, clickedTank) {
    }
}
