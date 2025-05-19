import numpy as np

class DLXNode:
    def __init__(self, col_idx=None, row=None, col=None, num=None):
        # Node DLX với các liên kết trái/phải/trên/dưới, trỏ về cột
        self.L = self.R = self.U = self.D = self.C = self
        self.S = 0  # Số node trong cột
        self.col_idx = col_idx  # Chỉ số cột
        self.row = row  # Hàng Sudoku
        self.col = col  # Cột Sudoku
        self.num = num  # Giá trị điền

class DLXSolver:
    def __init__(self, cols):
        # Khởi tạo DLX với số cột cho trước
        self.root = DLXNode()  # Node gốc
        self.columns = [DLXNode(i) for i in range(cols)]  # Danh sách cột
        self.solution = []  # Lưu lời giải
        
        # Liên kết các cột với nhau
        prev = self.root
        for col in self.columns:
            col.L = prev
            prev.R = col
            prev = col
        prev.R = self.root
        self.root.L = prev

    def cover(self, col):
        # Che cột col khỏi ma trận
        col.R.L = col.L
        col.L.R = col.R
        i = col.D
        while i != col:
            j = i.R
            while j != i:
                j.D.U = j.U
                j.U.D = j.D
                j.C.S -= 1
                j = j.R
            i = i.D

    def uncover(self, col):
        # Bỏ che cột col
        i = col.U
        while i != col:
            j = i.L
            while j != i:
                j.C.S += 1
                j.D.U = j
                j.U.D = j
                j = j.L
            i = i.U
        col.R.L = col
        col.L.R = col

    def add_row(self, row_indices, row_info):
        # Thêm 1 hàng vào ma trận DLX
        if not row_indices: return
        nodes = []
        r, c, num = row_info
        for col_idx in sorted(row_indices):
            col = self.columns[col_idx]
            node = DLXNode(col_idx, r, c, num)
            node.C = col
            col.S += 1
            node.U = col.U
            node.D = col
            col.U.D = node
            col.U = node
            if nodes:
                node.L = nodes[-1]
                node.R = nodes[-1].R
                nodes[-1].R.L = node
                nodes[-1].R = node
            else:
                node.L = node.R = node
            nodes.append(node)

    def search(self):
        # Tìm kiếm đệ quy lời giải
        if self.root.R == self.root:  # Đã tìm thấy lời giải
            return True
        
        # Chọn cột có ít node nhất
        col = self.root.R
        min_size = col.S
        current = col.R
        while current != self.root:
            if current.S < min_size:
                col = current
                min_size = current.S
            current = current.R
            
        if min_size == 0:  # Không có lời giải
            return False
            
        self.cover(col)
        row_node = col.D
        while row_node != col:
            self.solution.append(row_node)
            right_node = row_node.R
            while right_node != row_node:
                self.cover(right_node.C)
                right_node = right_node.R
                
            if self.search():
                return True
                
            # Quay lui
            self.solution.pop()
            left_node = row_node.L
            while left_node != row_node:
                self.uncover(left_node.C)
                left_node = left_node.L
            row_node = row_node.D
            
        self.uncover(col)
        return False

def sudoku_to_exact_cover(grid):
    # Chuyển Sudoku thành bài toán Exact Cover
    n = 16
    box_size = 4
    cover_matrix = []
    
    for r in range(n):
        for c in range(n):
            if grid[r][c] == 0:  # Ô trống
                for num in range(1, n+1):
                    # Tính các ràng buộc
                    box = (r // box_size) * box_size + (c // box_size)
                    row_col = r * n + c
                    row_num = n * n + r * n + (num-1)
                    col_num = 2 * n * n + c * n + (num-1)
                    box_num = 3 * n * n + box * n + (num-1)
                    cover_matrix.append(([row_col, row_num, col_num, box_num], (r, c, num)))
            else:  # Ô đã điền
                num = grid[r][c]
                box = (r // box_size) * box_size + (c // box_size)
                row_col = r * n + c
                row_num = n * n + r * n + (num-1)
                col_num = 2 * n * n + c * n + (num-1)
                box_num = 3 * n * n + box * n + (num-1)
                cover_matrix.append(([row_col, row_num, col_num, box_num], (r, c, num)))
    return cover_matrix

def solve_sudoku_16x16(grid):
    # Giải Sudoku 16x16
    n = 16
    cover_matrix = sudoku_to_exact_cover(grid)
    solver = DLXSolver(4 * n * n)  # 4 loại ràng buộc
    
    for row, row_info in cover_matrix:
        solver.add_row(row, row_info)
        
    if solver.search():
        solution_grid = np.copy(grid)
        for node in solver.solution:
            r, c, num = node.row, node.col, node.num
            solution_grid[r][c] = num
        return True, solution_grid
    return False, grid

def print_sudoku(grid):
    # In Sudoku đẹp mắt
    h_line = "+" + ("-"*6 + "+")*8
    for i in range(16):
        if i % 4 == 0:
            print(h_line)
        row_str = "| "
        for j in range(16):
            if j % 4 == 0 and j != 0:
                row_str += "| "
            val = grid[i][j]
            row_str += f"{val:2d} " if val != 0 else " . "
        row_str += "|"
        print(row_str)
    print(h_line)

def read_sudoku_from_file(filename="chall.txt"):
    # Đọc Sudoku từ file
    grid = np.zeros((16, 16), dtype=int)
    try:
        with open(filename, 'r') as f:
            for i, line in enumerate(f):
                values = line.strip().split()
                if len(values) != 16:
                    raise ValueError(f"Dòng {i+1} không có đủ 16 giá trị!")
                for j, val in enumerate(values):
                    grid[i][j] = int(val)
                if i >= 15:
                    break
        return grid
    except FileNotFoundError:
        print(f"Không tìm thấy file {filename}")
        return None
    except Exception as e:
        print(f"Lỗi khi đọc file: {e}")
        return None

def write_sudoku_to_file(grid, filename="sol.txt"):
    try:
        with open(filename, 'w') as f:
            for i in range(16):
                row = [str(grid[i][j]) for j in range(16)]
                f.write(" ".join(row) + "\n")
        print(f"Đã ghi đáp án vào {filename}")
    except Exception as e:
        print(f"Lỗi khi ghi file: {e}")

if __name__ == "__main__":
    grid = read_sudoku_from_file()
    if grid is not None:
        print("Input Sudoku:")
        print_sudoku(grid)
        solved, solution = solve_sudoku_16x16(grid)
        if solved:
            print("\nSolution:")
            print_sudoku(solution)
            write_sudoku_to_file(solution)
        else:
            print("\nKhông tìm thấy lời giải!")