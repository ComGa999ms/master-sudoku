import numpy as np
import random

def is_safe(grid, row, col, num):
    n = 16
    for i in range(n):
        if grid[row][i] == num or grid[i][col] == num:
            return False
    
    box_row = (row // 4) * 4
    box_col = (col // 4) * 4
    for i in range(box_row, box_row + 4):
        for j in range(box_col, box_col + 4):
            if grid[i][j] == num:
                return False
    return True

def find_empty_location(grid):
    for i in range(16):
        for j in range(16):
            if grid[i][j] == 0:
                return i, j
    return None

def solve_sudoku(grid):
    empty = find_empty_location(grid)
    if not empty:
        return True  
    row, col = empty
    
    numbers = list(range(1, 17))
    random.shuffle(numbers)  
    
    for num in numbers:
        if is_safe(grid, row, col, num):
            grid[row][col] = num
            if solve_sudoku(grid):
                return True
            grid[row][col] = 0  
    return False

def generate_sudoku_16x16(difficulty=120):
    grid = np.zeros((16, 16), dtype=int)
    
    if not solve_sudoku(grid):
        raise ValueError("Không thể tạo lưới Sudoku 16x16!")
    
    puzzle = np.copy(grid)
    
    cells = [(r, c) for r in range(16) for c in range(16)]
    random.shuffle(cells)
    for i in range(min(difficulty, 256)):
        r, c = cells[i]
        puzzle[r][c] = 0
    
    return puzzle

def save_sudoku_to_file(grid, filename="chall.txt"):
    with open(filename, 'w') as f:
        for row in grid:
            row_str = ' '.join(str(x) for x in row)
            f.write(row_str + '\n')

puzzle = generate_sudoku_16x16(difficulty=120)
save_sudoku_to_file(puzzle, "chall.txt")
print("Đã tạo và lưu bài toán Sudoku 16x16 vào file 'chall.txt'.")