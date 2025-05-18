// Sudoku Game
class SudokuGame {
    constructor() {
        this.grid = []; // Current puzzle grid
        this.solution = []; // Complete solution
        this.selectedCell = null; // Selected cell
        this.mistakes = 0; // Player mistakes
        this.score = 0; // Score
        this.timer = 0; // Play time
        this.moveHistory = []; // Move history
        this.difficulty = "easy"; // Default difficulty level
        this.timerInterval = null; // Timer interval
        this.hintsUsed = 0; // Hints used
        this.isPaused = false; // Pause state
        this.size = 9; // Grid size
        this.boxSize = 3; // Box size (3x3 blocks)
        this.scoredCells = new Set(); // Track scored cells
        this.initGrid();
        this.bindEvents();
        this.startTimer();
    }

    // Initialize grid UI
    initGrid() {
        const gridElement = document.getElementById("grid");
        if (!gridElement) {
            console.error("Grid element not found");
            return;
        }
        gridElement.innerHTML = "";
        for (let i = 0; i < this.size; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement("td");
                cell.dataset.row = i;
                cell.dataset.col = j;
                row.appendChild(cell);
            }
            gridElement.appendChild(row);
        }
        console.log("Grid initialized");
        this.generatePuzzle();
    }

    // Check if a number can be placed at a given position
    isValid(board, row, col, num) {
        // Check row
        for (let x = 0; x < this.size; x++) {
            if (board[row][x] === num) return false;
        }
        // Check column
        for (let x = 0; x < this.size; x++) {
            if (board[x][col] === num) return false;
        }
        // Check 3x3 box
        const startRow = row - (row % this.boxSize);
        const startCol = col - (col % this.boxSize);
        for (let i = 0; i < this.boxSize; i++) {
            for (let j = 0; j < this.boxSize; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }
        return true;
    }

    // Solve Sudoku using backtracking
    solveBacktracking(board, findAll = false, solutions = []) {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= this.size; num++) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (findAll) {
                                const newBoard = board.map(r => [...r]);
                                this.solveBacktracking(newBoard, findAll, solutions);
                            } else if (this.solveBacktracking(board, findAll, solutions)) {
                                return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        if (findAll) {
            solutions.push(board.map(r => [...r]));
        }
        return true;
    }

    // Generate puzzle
    async generatePuzzle() {
        console.log("Generating puzzle for difficulty:", this.difficulty);
        try {
            // Initialize empty grid
            this.solution = Array(this.size).fill().map(() => Array(this.size).fill(0));
            // Fill diagonal boxes (independent 3x3 blocks)
            for (let box = 0; box < this.size; box += this.boxSize) {
                this.fillBox(this.solution, box, box);
            }
            // Solve to get a complete solution
            this.solveBacktracking(this.solution);
            this.grid = JSON.parse(JSON.stringify(this.solution));
            this.scoredCells.clear();
            const clues = this.getCluesCount();
            this.removeNumbers(clues);
            console.log("Grid after removing numbers:", JSON.stringify(this.grid));
            this.renderGrid();
            this.updateNumberButtons();
            this.checkCompletedSections();
        } catch (error) {
            console.error("Puzzle generation failed:", error);
            alert("Failed to generate puzzle. Starting new game...");
            this.newGame();
        }
    }

    // Fill a 3x3 box with random numbers
    fillBox(board, row, col) {
        const numbers = Array.from({ length: this.size }, (_, i) => i + 1);
        for (let i = 0; i < this.boxSize; i++) {
            for (let j = 0; j < this.boxSize; j++) {
                const index = Math.floor(Math.random() * numbers.length);
                board[row + i][col + j] = numbers.splice(index, 1)[0];
            }
        }
    }

    // Get number of clues based on difficulty
    getCluesCount() {
        const clues = {
            easy: 36, // ~44.4% filled
            medium: 30, // ~37.0% filled
            hard: 26, // ~32.1% filled
            expert: 23, // ~28.4% filled
            master: 21, // ~25.9% filled
            insane: 20 // ~24.7% filled
        };
        return clues[this.difficulty] || 36;
    }

    // Remove numbers to create puzzle
    removeNumbers(clues) {
        let removed = 0;
        const totalCells = this.size * this.size;
        let attempts = 0;
        const maxAttempts = totalCells * 3;
        while (removed < totalCells - clues && attempts < maxAttempts) {
            const row = Math.floor(Math.random() * this.size);
            const col = Math.floor(Math.random() * this.size);
            if (this.grid[row][col] !== 0) {
                const temp = this.grid[row][col];
                this.grid[row][col] = 0;
                const tempGrid = JSON.parse(JSON.stringify(this.grid));
                const solutions = [];
                this.solveBacktracking(tempGrid, true, solutions);
                if (solutions.length !== 1) {
                    this.grid[row][col] = temp;
                } else {
                    removed++;
                }
            }
            attempts++;
        }
        console.log("Removed", removed, "cells");
        if (removed < totalCells - clues) {
            console.warn("Could not remove enough numbers, removed:", removed);
        }
    }

    // Render grid to UI
    renderGrid() {
        const cells = document.querySelectorAll(".sudoku-grid td");
        if (cells.length !== this.size * this.size) {
            console.error("Invalid number of grid cells:", cells.length);
            return;
        }
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.grid[row][col];
            cell.textContent = value === 0 ? "" : value;
            cell.classList.toggle("fixed", value !== 0 && !cell.classList.contains("locked"));
            cell.classList.remove("error", "correct-pulse", "wrong-shake");
        });
        console.log("Grid rendered");
    }

    // Update number buttons
    updateNumberButtons() {
        const numberCounts = Array(this.size + 1).fill(0);
        const numberCorrect = Array(this.size + 1).fill(true);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const num = this.grid[i][j];
                if (num !== 0) {
                    numberCounts[num]++;
                    if (num !== this.solution[i][j]) {
                        numberCorrect[num] = false;
                    }
                }
            }
        }
        document.querySelectorAll(".number-btn").forEach(btn => {
            const num = parseInt(btn.dataset.number);
            if (num !== 0) {
                const isCompleted = numberCounts[num] === this.size && numberCorrect[num];
                btn.disabled = isCompleted;
                btn.innerHTML = isCompleted ? "✔" : btn.textContent;
                btn.classList.toggle("completed", isCompleted);
            }
        });
    }

    // Check completed sections
    checkCompletedSections() {
        // Check rows
        for (let row = 0; row < this.size; row++) {
            let rowCompleted = true;
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] !== this.solution[row][col]) {
                    rowCompleted = false;
                    break;
                }
            }
            if (rowCompleted) {
                document.querySelectorAll(`.sudoku-grid td[data-row="${row}"]`).forEach(cell => {
                    cell.classList.add("completed-row");
                });
            }
        }
        // Check columns
        for (let col = 0; col < this.size; col++) {
            let colCompleted = true;
            for (let row = 0; row < this.size; row++) {
                if (this.grid[row][col] !== this.solution[row][col]) {
                    colCompleted = false;
                    break;
                }
            }
            if (colCompleted) {
                document.querySelectorAll(`.sudoku-grid td[data-col="${col}"]`).forEach(cell => {
                    cell.classList.add("completed-col");
                });
            }
        }
        // Check 3x3 boxes
        for (let blockRow = 0; blockRow < this.size; blockRow += this.boxSize) {
            for (let blockCol = 0; blockCol < this.size; blockCol += this.boxSize) {
                let blockCompleted = true;
                for (let i = blockRow; i < blockRow + this.boxSize; i++) {
                    for (let j = blockCol; j < blockCol + this.boxSize; j++) {
                        if (this.grid[i][j] !== this.solution[i][j]) {
                            blockCompleted = false;
                            break;
                        }
                    }
                    if (!blockCompleted) break;
                }
                if (blockCompleted) {
                    for (let i = blockRow; i < blockRow + this.boxSize; i++) {
                        for (let j = blockCol; j < blockCol + this.boxSize; j++) {
                            const cell = document.querySelector(`.sudoku-grid td[data-row="${i}"][data-col="${j}"]`);
                            cell.classList.add("completed-block");
                        }
                    }
                }
            }
        }
    }

    // Bind UI events
    bindEvents() {
        const difficultyTabs = document.querySelectorAll(".difficulty-tab");
        if (!difficultyTabs.length) {
            console.error("No difficulty tabs found");
            return;
        }
        difficultyTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                // Remove active class from all tabs
                difficultyTabs.forEach(t => t.classList.remove("active"));
                // Add active class to the clicked tab
                tab.classList.add("active");
                const newDifficulty = tab.dataset.difficulty;
                if (!["easy", "medium", "hard", "expert", "master", "insane"].includes(newDifficulty)) {
                    console.warn(`Invalid difficulty "${newDifficulty}" selected, defaulting to easy`);
                    this.difficulty = "easy";
                    document.querySelector('.difficulty-tab[data-difficulty="easy"]')?.classList.add("active");
                } else {
                    this.difficulty = newDifficulty;
                }
                console.log("Difficulty changed:", this.difficulty);
                this.newGame();
            });
        });

        const gridElement = document.getElementById("grid");
        if (!gridElement) {
            console.error("Grid element not found");
            return;
        }
        gridElement.addEventListener("click", (e) => {
            if (e.target.tagName === "TD") {
                document.querySelectorAll(".sudoku-grid td").forEach(cell => {
                    cell.classList.remove("selected", "highlight", "same-number");
                });
                e.target.classList.add("selected");
                this.selectedCell = e.target;
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                document.querySelectorAll(`.sudoku-grid td[data-row="${row}"], .sudoku-grid td[data-col="${col}"]`)
                    .forEach(cell => {
                        if (!cell.classList.contains("selected")) {
                            cell.classList.add("highlight");
                        }
                    });
                const blockRow = Math.floor(row / this.boxSize) * this.boxSize;
                const blockCol = Math.floor(col / this.boxSize) * this.boxSize;
                for (let i = blockRow; i < blockRow + this.boxSize; i++) {
                    for (let j = blockCol; j < blockCol + this.boxSize; j++) {
                        const cell = document.querySelector(`.sudoku-grid td[data-row="${i}"][data-col="${j}"]`);
                        if (!cell.classList.contains("selected")) {
                            cell.classList.add("highlight");
                        }
                    }
                }
                const selectedNumber = e.target.textContent.trim();
                if (selectedNumber) {
                    document.querySelectorAll(".sudoku-grid td").forEach(cell => {
                        const cellNumber = cell.textContent.trim();
                        if (cellNumber === selectedNumber && !cell.classList.contains("selected")) {
                            cell.classList.add("same-number");
                        }
                    });
                }
            }
        });

        const numberButtons = document.querySelectorAll(".number-btn");
        if (!numberButtons.length) {
            console.error("No number buttons found");
            return;
        }
        numberButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                if (!this.selectedCell) {
                    console.warn("No cell selected");
                    return;
                }
                if (this.selectedCell.classList.contains("fixed") || this.selectedCell.classList.contains("locked")) {
                    console.log("Cell is fixed or locked");
                    return;
                }
                const number = parseInt(btn.dataset.number);
                const row = parseInt(this.selectedCell.dataset.row);
                const col = parseInt(this.selectedCell.dataset.col);
                if (number === 0) {
                    const oldValue = this.grid[row][col];
                    this.grid[row][col] = 0;
                    this.selectedCell.textContent = "";
                    this.selectedCell.classList.remove("error", "correct-pulse", "wrong-shake", "locked");
                    this.moveHistory.push({ row, col, oldValue, newValue: 0 });
                } else {
                    const oldValue = this.grid[row][col];
                    this.grid[row][col] = number;
                    this.selectedCell.textContent = number;
                    const cellKey = `${row},${col}`;
                    if (number !== this.solution[row][col]) {
                        this.mistakes++;
                        this.selectedCell.classList.add("error");
                        this.selectedCell.classList.add("wrong-shake");
                        document.getElementById("mistakes").textContent = `${this.mistakes}/3`;
                        if (this.mistakes >= 3) {
                            alert("Game Over! You made too many mistakes.");
                            this.newGame();
                        }
                    } else {
                        this.selectedCell.classList.remove("error");
                        this.selectedCell.classList.add("correct-pulse");
                        this.selectedCell.classList.add("locked");
                        if (!this.scoredCells.has(cellKey)) {
                            this.score += 10;
                            this.scoredCells.add(cellKey);
                            document.getElementById("score").textContent = this.score;
                        }
                    }
                    this.moveHistory.push({ row, col, oldValue, newValue: number });
                }
                this.updateNumberButtons();
                this.checkCompletedSections();
                this.checkWin();
            });
        });

        const undoBtn = document.getElementById("undo-btn");
        if (!undoBtn) {
            console.error("Undo button not found");
            return;
        }
        undoBtn.addEventListener("click", () => {
            const move = this.moveHistory.pop();
            if (!move) {
                console.log("No moves to undo");
                return;
            }
            const { row, col, oldValue } = move;
            this.grid[row][col] = oldValue;
            const cell = document.querySelector(`.sudoku-grid td[data-row="${row}"][data-col="${col}"]`);
            cell.textContent = oldValue === 0 ? "" : oldValue;
            cell.classList.remove("error", "correct-pulse", "wrong-shake", "locked");
            const cellKey = `${row},${col}`;
            if (this.scoredCells.has(cellKey)) {
                this.score -= 10;
                this.scoredCells.delete(cellKey);
                document.getElementById("score").textContent = this.score;
            }
            document.getElementById("mistakes").textContent = `${this.mistakes}/3`;
            this.updateNumberButtons();
            this.checkCompletedSections();
        });

        const pauseBtn = document.getElementById("pause-btn");
        if (!pauseBtn) {
            console.error("Pause button not found");
            return;
        }
        pauseBtn.addEventListener("click", () => {
            this.isPaused = !this.isPaused;
            const gridElement = document.getElementById("grid");
            if (!gridElement) {
                console.error("Grid element not found for pause");
                return;
            }
            pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
            if (this.isPaused) {
                this.stopTimer();
                gridElement.classList.add("paused");
                const overlay = document.createElement("div");
                overlay.className = "pause-overlay";
                overlay.textContent = "Game Paused";
                gridElement.parentNode.appendChild(overlay);
            } else {
                this.startTimer();
                gridElement.classList.remove("paused");
                const overlay = document.querySelector(".pause-overlay");
                if (overlay) overlay.remove();
            }
            console.log("Pause toggled:", this.isPaused);
        });

        const solutionBtn = document.getElementById("solution-btn");
        if (!solutionBtn) {
            console.error("Solution button not found");
            return;
        }
        solutionBtn.addEventListener("click", () => {
            this.stopTimer();
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    this.grid[i][j] = this.solution[i][j];
                    const cell = document.querySelector(`.sudoku-grid td[data-row="${i}"][data-col="${j}"]`);
                    cell.textContent = this.solution[i][j];
                    cell.classList.add("locked");
                    const cellKey = `${i},${j}`;
                    if (!this.scoredCells.has(cellKey) && this.grid[i][j] !== 0) {
                        this.score += 10;
                        this.scoredCells.add(cellKey);
                    }
                }
            }
            document.getElementById("score").textContent = this.score;
            this.renderGrid();
            this.updateNumberButtons();
            this.checkCompletedSections();
            console.log("Solution displayed");
        });

        const hintBtn = document.getElementById("hint-btn");
        if (!hintBtn) {
            console.error("Hint button not found");
            return;
        }
        hintBtn.addEventListener("click", () => {
            if (this.hintsUsed >= 1) {
                console.log("No hints remaining");
                return;
            }
            const emptyCells = [];
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.grid[i][j] === 0) {
                        emptyCells.push({ row: i, col: j });
                    }
                }
            }
            if (emptyCells.length === 0) {
                console.log("No empty cells for hint");
                return;
            }
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const row = randomCell.row;
            const col = randomCell.col;
            const correctNumber = this.solution[row][col];
            this.grid[row][col] = correctNumber;
            const cell = document.querySelector(`.sudoku-grid td[data-row="${row}"][data-col="${col}"]`);
            cell.textContent = correctNumber;
            cell.classList.remove("error");
            cell.classList.add("correct-pulse");
            cell.classList.add("locked");
            const cellKey = `${row},${col}`;
            if (!this.scoredCells.has(cellKey)) {
                this.score += 5;
                this.scoredCells.add(cellKey);
                document.getElementById("score").textContent = this.score;
            }
            this.moveHistory.push({ row, col, oldValue: 0, newValue: correctNumber });
            this.hintsUsed++;
            document.getElementById("hint").textContent = `${this.hintsUsed}/1`;
            document.getElementById("hint-btn").disabled = true;
            this.updateNumberButtons();
            this.checkCompletedSections();
            this.checkWin();
            console.log("Hint applied at", row, col);
        });

        const newGameBtn = document.getElementById("new-game-btn");
        if (!newGameBtn) {
            console.error("New game button not found");
            return;
        }
        newGameBtn.addEventListener("click", () => {
            console.log("Starting new game");
            this.newGame();
        });
    }
    
    // Start timer
    startTimer() {
        console.log("Starting timer");
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer++;
            const minutes = Math.floor(this.timer / 60).toString().padStart(2, "0");
            const seconds = (this.timer % 60).toString().padStart(2, "0");
            const timerElement = document.getElementById("timer");
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds}`;
            } else {
                console.error("Timer element not found");
            }
        }, 1000);
    }

    // Stop timer
    stopTimer() {
        console.log("Stopping timer");
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Check win
    checkWin() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] !== this.solution[i][j]) return;
            }
        }
        this.stopTimer();
        alert(`Congratulations! You solved the puzzle in ${document.getElementById("timer").textContent}!`);
        this.newGame();
    }

    // New game
    newGame() {
        // Reset game state
        this.mistakes = 0;
        this.score = 0;
        this.timer = 0;
        this.moveHistory = [];
        this.hintsUsed = 0;
        this.isPaused = false;
        this.selectedCell = null;
        this.scoredCells.clear();

        // Reset UI elements
        const hintElement = document.getElementById("hint");
        if (hintElement) hintElement.textContent = "0/1";

        const hintBtn = document.getElementById("hint-btn");
        if (hintBtn) hintBtn.disabled = false;

        const pauseBtn = document.getElementById("pause-btn");
        if (pauseBtn) pauseBtn.textContent = "Pause";

        const mistakesElement = document.getElementById("mistakes");
        if (mistakesElement) mistakesElement.textContent = "0/3";

        const scoreElement = document.getElementById("score");
        if (scoreElement) scoreElement.textContent = "0";

        const timerElement = document.getElementById("timer");
        if (timerElement) timerElement.textContent = "00:00";

        // Clear grid and overlays
        const grid = document.getElementById("grid");
        if (grid) {
            grid.classList.remove("paused");
            // Clear all cell states
            document.querySelectorAll(".sudoku-grid td").forEach(cell => {
                cell.classList.remove(
                    "selected",
                    "highlight",
                    "same-number",
                    "fixed",
                    "locked",
                    "error",
                    "correct-pulse",
                    "wrong-shake",
                    "completed-row",
                    "completed-col",
                    "completed-block"
                );
                cell.textContent = "";
            });
        }

        const overlay = document.querySelector(".pause-overlay");
        if (overlay) overlay.remove();

        // Reset number buttons
        document.querySelectorAll(".number-btn").forEach(btn => {
            const num = parseInt(btn.dataset.number);
            if (num !== 0) {
                btn.disabled = false;
                btn.classList.remove("completed");
                btn.innerHTML = num;
            }
        });

        // Stop and restart timer
        this.stopTimer();
        this.startTimer();

        // Reinitialize grid and generate new puzzle
        this.initGrid();
        console.log("New game started");
    }
}

// Start game
const game = new SudokuGame();