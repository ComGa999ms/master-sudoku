class SudokuGame {
    constructor() {
        this.grid = []; // Lưới Sudoku hiện tại
        this.solution = []; // Lời giải hoàn chỉnh
        this.selectedCell = null; // Ô được chọn
        this.mistakes = 0; // Số lần sai
        this.score = 0; // Điểm số
        this.timer = 0; // Thời gian chơi
        this.moveHistory = []; // Lịch sử nước đi
        this.difficulty = 'easy'; // Độ khó
        this.timerInterval = null; // Bộ đếm thời gian
        this.hintsUsed = 0; // Số gợi ý đã dùng
        this.isPaused = false; // Trạng thái tạm dừng
        this.initGrid();
        this.bindEvents();
        this.startTimer();
    }

    // Khởi tạo giao diện
    initGrid() {
        const gridElement = document.getElementById('grid');
        if (!gridElement) {
            console.error("Không tìm thấy lưới. Đảm bảo <table id='grid'> tồn tại.");
            return;
        }
        gridElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('td');
                cell.dataset.row = i;
                cell.dataset.col = j;
                row.appendChild(cell);
            }
            gridElement.appendChild(row);
        }
        this.generatePuzzle();
    }

    // Tạo đề 
    generateRandomBoard() {
        const board = Array(9).fill().map(() => Array(9).fill(0));

        // Check một ô có hợp lệ không
        const isValid = (board, row, col, num) => {
            for (let x = 0; x < 9; x++) {
                if (board[row][x] === num) return false;
                if (board[x][col] === num) return false;
            }
            const startRow = row - row % 3;
            const startCol = col - col % 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (board[i + startRow][j + startCol] === num) return false;
                }
            }
            return true;
        };

        // Giải bằng quay lui 
        const fillBoard = (board) => {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        const numbers = Array.from({length: 9}, (_, i) => i + 1);
                        for (let i = numbers.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
                        }
                        for (let num of numbers) {
                            if (isValid(board, row, col, num)) {
                                board[row][col] = num;
                                if (fillBoard(board)) return true;
                                board[row][col] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };

        fillBoard(board);

        // shuffle lưới 
        const shuffleBoard = (board) => {
            const numbers = Array.from({length: 9}, (_, i) => i + 1);
            for (let i = numbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }
            const mapping = {};
            for (let i = 0; i < 9; i++) {
                mapping[i + 1] = numbers[i];
            }
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    board[i][j] = mapping[board[i][j]];
                }
            }
            for (let group = 0; group < 3; group++) {
                const rows = [group * 3, group * 3 + 1, group * 3 + 2];
                for (let i = rows.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [rows[i], rows[j]] = [rows[j], rows[i]];
                }
                const tempBoard = board.map(row => [...row]);
                for (let i = 0; i < 3; i++) {
                    board[group * 3 + i] = tempBoard[rows[i]];
                }
            }
            for (let group = 0; group < 3; group++) {
                const cols = [group * 3, group * 3 + 1, group * 3 + 2];
                for (let i = cols.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [cols[i], cols[j]] = [cols[j], cols[i]];
                }
                const tempBoard = board.map(row => [...row]);
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 3; j++) {
                        board[i][group * 3 + j] = tempBoard[i][cols[j]];
                    }
                }
            }
        };

        shuffleBoard(board);
        return board;
    }

    // Tạo đề 
    generatePuzzle() {
        this.solution = this.generateRandomBoard();
        this.grid = JSON.parse(JSON.stringify(this.solution));
        const clues = this.getCluesCount();
        this.removeNumbers(clues);
        this.renderGrid();
        this.updateNumberButtons();
        this.checkCompletedSections();
    }

    // Số ô ứng với từng mức độ khó 
    getCluesCount() {
        const clues = {
            easy: 40,
            medium: 35,
            hard: 30,
            expert: 25,
            master: 22,
            insane: 20
        };
        return clues[this.difficulty] || 40;
    }

    // Xóa số để tạo câu đố
    removeNumbers(clues) {
        let removed = 0;
        while (removed < 81 - clues) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (this.grid[row][col] !== 0) {
                this.grid[row][col] = 0;
                removed++;
            }
        }
    }

    // Hiển thị lưới lên giao diện
    renderGrid() {
        const cells = document.querySelectorAll('#grid td');
        if (!cells.length) {
            console.error("Không tìm thấy ô lưới. Kiểm tra '#grid td'.");
            return;
        }
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.textContent = this.grid[row][col] === 0 ? '' : this.grid[row][col];
            cell.classList.toggle('fixed', this.grid[row][col] !== 0 && !cell.classList.contains('locked'));
            cell.classList.remove('error', 'correct-pulse', 'wrong-shake');
        });
    }

    // Update trạng thái nút số
    updateNumberButtons() {
        const numberCounts = Array(10).fill(0);
        const numberCorrect = Array(10).fill(true);
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = this.grid[i][j];
                if (num !== 0) {
                    numberCounts[num]++;
                    if (num !== this.solution[i][j]) {
                        numberCorrect[num] = false;
                    }
                }
            }
        }
        document.querySelectorAll('.number-btn').forEach(btn => {
            const num = parseInt(btn.dataset.number);
            if (num !== 0) {
                const isCompleted = numberCounts[num] === 9 && numberCorrect[num];
                btn.disabled = isCompleted;
                btn.innerHTML = isCompleted ? '✔' : num;
                btn.classList.toggle('completed', isCompleted);
            }
        });
    }

    // Kiểm tra hàng, cột, khối hoàn thành
    checkCompletedSections() {
        for (let row = 0; row < 9; row++) {
            let rowCompleted = true;
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] !== this.solution[row][col]) {
                    rowCompleted = false;
                    break;
                }
            }
            if (rowCompleted) {
                document.querySelectorAll(`#grid td[data-row="${row}"]`).forEach(cell => {
                    cell.classList.add('completed-row');
                });
            }
        }
        for (let col = 0; col < 9; col++) {
            let colCompleted = true;
            for (let row = 0; row < 9; row++) {
                if (this.grid[row][col] !== this.solution[row][col]) {
                    colCompleted = false;
                    break;
                }
            }
            if (colCompleted) {
                document.querySelectorAll(`#grid td[data-col="${col}"]`).forEach(cell => {
                    cell.classList.add('completed-col');
                });
            }
        }
        for (let blockRow = 0; blockRow < 9; blockRow += 3) {
            for (let blockCol = 0; blockCol < 9; blockCol += 3) {
                let blockCompleted = true;
                for (let i = blockRow; i < blockRow + 3; i++) {
                    for (let j = blockCol; j < blockCol + 3; j++) {
                        if (this.grid[i][j] !== this.solution[i][j]) {
                            blockCompleted = false;
                            break;
                        }
                    }
                    if (!blockCompleted) break;
                }
                if (blockCompleted) {
                    for (let i = blockRow; i < blockRow + 3; i++) {
                        for (let j = blockCol; j < blockCol + 3; j++) {
                            document.querySelector(`#grid td[data-row="${i}"][data-col="${j}"]`).classList.add('completed-block');
                        }
                    }
                }
            }
        }
    }

    // Các chức năng các nút
    bindEvents() {
        // Chọn độ khó
        const difficultyTabs = document.querySelectorAll('.difficulty-tab');
        if (!difficultyTabs.length) console.error("Không tìm thấy tab độ khó.");
        difficultyTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelector('.difficulty-tab.active')?.classList.remove('active');
                tab.classList.add('active');
                this.difficulty = tab.dataset.difficulty || 'easy';
                this.newGame();
            });
        });

        // Chọn ô lưới
        const gridElement = document.getElementById('grid');
        if (!gridElement) console.error("Không tìm thấy lưới. Kiểm tra '#grid'.");
        gridElement?.addEventListener('click', (e) => {
            if (e.target.tagName === 'TD') {
                document.querySelectorAll('#grid td').forEach(cell => {
                    cell.classList.remove('selected', 'highlight', 'same-number');
                });
                e.target.classList.add('selected');
                this.selectedCell = e.target;
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                document.querySelectorAll(`#grid td[data-row="${row}"], #grid td[data-col="${col}"]`)
                    .forEach(cell => {
                        if (!cell.classList.contains('selected')) cell.classList.add('highlight');
                    });
                const blockRow = Math.floor(row / 3) * 3;
                const blockCol = Math.floor(col / 3) * 3;
                for (let i = blockRow; i < blockRow + 3; i++) {
                    for (let j = blockCol; j < blockCol + 3; j++) {
                        const cell = document.querySelector(`#grid td[data-row="${i}"][data-col="${j}"]`);
                        if (!cell.classList.contains('selected')) cell.classList.add('highlight');
                    }
                }
                const selectedNumber = e.target.textContent.trim();
                if (selectedNumber) {
                    document.querySelectorAll('#grid td').forEach(cell => {
                        if (cell.textContent.trim() === selectedNumber && !cell.classList.contains('selected')) {
                            cell.classList.add('same-number');
                        }
                    });
                }
            }
        });

        // Điền số 
        const numberButtons = document.querySelectorAll('.number-btn');
        if (!numberButtons.length) console.error("Không tìm thấy nút số.");
        numberButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.selectedCell) return;
                if (this.selectedCell.classList.contains('fixed') || this.selectedCell.classList.contains('locked')) return;
                const number = parseInt(btn.dataset.number);
                const row = parseInt(this.selectedCell.dataset.row);
                const col = parseInt(this.selectedCell.dataset.col);
                if (number === 0) {
                    const oldValue = this.grid[row][col];
                    this.grid[row][col] = 0;
                    this.selectedCell.textContent = '';
                    this.selectedCell.classList.remove('error', 'correct-pulse', 'wrong-shake', 'locked');
                    this.moveHistory.push({ row, col, oldValue, newValue: 0 });
                } else {
                    const oldValue = this.grid[row][col];
                    this.grid[row][col] = number;
                    this.selectedCell.textContent = number;
                    if (number !== this.solution[row][col]) {
                        this.mistakes++;
                        this.selectedCell.classList.add('error', 'wrong-shake');
                        document.getElementById('mistakes').textContent = `${this.mistakes}/3`;
                        if (this.mistakes >= 3) {
                            alert('Game Over! You made too many mistakes.');
                            this.newGame();
                        }
                    } else {
                        this.selectedCell.classList.remove('error');
                        this.selectedCell.classList.add('correct-pulse', 'locked');
                        this.score += 10;
                        document.getElementById('score').textContent = this.score;
                    }
                    this.moveHistory.push({ row, col, oldValue, newValue: number });
                }
                this.updateNumberButtons();
                this.checkCompletedSections();
                this.checkWin();
            });
        });

        // Nút hoàn tác
        const undoBtn = document.getElementById('undo-btn');
        if (!undoBtn) console.error("Không tìm thấy nút hoàn tác.");
        undoBtn?.addEventListener('click', () => {
            const move = this.moveHistory.pop();
            if (!move) return;
            const { row, col, oldValue, newValue } = move;
            this.grid[row][col] = oldValue;
            const cell = document.querySelector(`#grid td[data-row="${row}"][data-col="${col}"]`);
            cell.textContent = oldValue === 0 ? '' : oldValue;
            cell.classList.remove('error', 'correct-pulse', 'wrong-shake', 'locked');
            if (newValue === this.solution[row][col] && newValue !== 0) {
                if (move.isHint) {
                    this.score -= 5; // Hoàn tác gợi ý
                } else {
                    this.score -= 10; // Hoàn tác nước đi đúng
                }
                document.getElementById('score').textContent = this.score;
            }
            document.getElementById('mistakes').textContent = `${this.mistakes}/3`;
            this.updateNumberButtons();
            this.checkCompletedSections();
        });

        // Nút tạm dừng
        const pauseBtn = document.getElementById('pause-btn');
        if (!pauseBtn) console.error("Không tìm thấy nút tạm dừng.");
        pauseBtn?.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            const gridElement = document.getElementById('grid');
            if (!gridElement) return;
            pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
            if (this.isPaused) {
                this.stopTimer();
                gridElement.classList.add('paused');
                const overlay = document.createElement('div');
                overlay.className = 'pause-overlay';
                overlay.textContent = 'Game Paused';
                gridElement.parentNode.appendChild(overlay);
            } else {
                this.startTimer();
                gridElement.classList.remove('paused');
                const overlay = document.querySelector('.pause-overlay');
                if (overlay) overlay.remove();
            }
        });

        // Nút solution  
        const solutionBtn = document.getElementById('solution-btn');
        if (!solutionBtn) console.error("Không tìm thấy nút lời giải.");
        solutionBtn?.addEventListener('click', () => {
            this.stopTimer();
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    this.grid[i][j] = this.solution[i][j];
                }
            }
            this.renderGrid();
            this.updateNumberButtons();
            this.checkCompletedSections();
        });

        // Nút hint 
        const hintBtn = document.getElementById('hint-btn');
        if (!hintBtn) console.error("Không tìm thấy nút gợi ý.");
        hintBtn?.addEventListener('click', () => {
            if (this.hintsUsed >= 1) return;
            const emptyCells = [];
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (this.grid[i][j] === 0) {
                        emptyCells.push({ row: i, col: j });
                    }
                }
            }
            if (emptyCells.length === 0) return;
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const row = randomCell.row;
            const col = randomCell.col;
            const correctNumber = this.solution[row][col];
            this.grid[row][col] = correctNumber;
            const cell = document.querySelector(`#grid td[data-row="${row}"][data-col="${col}"]`);
            cell.textContent = correctNumber;
            cell.classList.remove('error');
            cell.classList.add('correct-pulse', 'locked');
            this.score += 5;
            document.getElementById('score').textContent = this.score;
            this.moveHistory.push({ row, col, oldValue: 0, newValue: correctNumber, isHint: true });
            this.hintsUsed++;
            document.getElementById('hint').textContent = `${this.hintsUsed}/1`;
            document.getElementById('hint-btn').disabled = true;
            this.updateNumberButtons();
            this.checkCompletedSections();
            this.checkWin();
        });

        // Nút new game
        const newGameBtn = document.getElementById('new-game-btn');
        if (!newGameBtn) console.error("Không tìm thấy nút trò chơi mới.");
        newGameBtn?.addEventListener('click', () => this.newGame());
    }

    // Bắt đầu đếm thời gian
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
            const seconds = (this.timer % 60).toString().padStart(2, '0');
            const timerElement = document.getElementById('timer');
            if (timerElement) timerElement.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    // Dừng đếm thời gian
    stopTimer() {
        clearInterval(this.timerInterval);
    }

    // Kiểm tra thắng trò chơi
    checkWin() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.grid[i][j] !== this.solution[i][j]) return;
            }
        }
        this.stopTimer();
        alert(`Chúc mừng! Bạn đã giải câu đố trong ${document.getElementById('timer').textContent}!`);
        this.newGame();
    }

    // Bắt đầu trò chơi mới
    newGame() {
        this.mistakes = 0;
        this.score = 0;
        this.timer = 0;
        this.moveHistory = [];
        this.hintsUsed = 0;
        this.isPaused = false;
        const hintElement = document.getElementById('hint');
        if (hintElement) hintElement.textContent = '0/1';
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) hintBtn.disabled = false;
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        const mistakesElement = document.getElementById('mistakes');
        if (mistakesElement) mistakesElement.textContent = '0/3';
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = '0';
        const timerElement = document.getElementById('timer');
        if (timerElement) timerElement.textContent = '00:00';
        const grid = document.getElementById('grid');
        if (grid) grid.classList.remove('paused');
        const overlay = document.querySelector('.pause-overlay');
        if (overlay) overlay.remove();
        document.querySelectorAll('.number-btn').forEach(btn => {
            const num = parseInt(btn.dataset.number);
            if (num !== 0) {
                btn.disabled = false;
                btn.classList.remove('completed');
                btn.innerHTML = num;
            }
        });
        this.stopTimer();
        this.startTimer();
        this.initGrid();
    }
}

// Khởi động trò chơi
const game = new SudokuGame();