/**
 * Dense Matrix Implementation
 * 
 * Row-major storage using Float64Array for numerical precision.
 * This is the MVP implementation - can be swapped for sparse later.
 */

export class Matrix {
  readonly rows: number;
  readonly cols: number;
  readonly data: Float64Array;

  constructor(rows: number, cols: number, data?: Float64Array | number[]) {
    if (rows <= 0 || cols <= 0) {
      throw new Error(`Invalid matrix dimensions: ${rows}x${cols}`);
    }
    
    this.rows = rows;
    this.cols = cols;
    
    if (data) {
      if (data.length !== rows * cols) {
        throw new Error(`Data length ${data.length} doesn't match dimensions ${rows}x${cols}`);
      }
      this.data = data instanceof Float64Array ? data : new Float64Array(data);
    } else {
      this.data = new Float64Array(rows * cols);
    }
  }

  /**
   * Create a matrix filled with zeros
   */
  static zeros(rows: number, cols: number): Matrix {
    return new Matrix(rows, cols);
  }

  /**
   * Create an identity matrix
   */
  static identity(n: number): Matrix {
    const m = new Matrix(n, n);
    for (let i = 0; i < n; i++) {
      m.set(i, i, 1);
    }
    return m;
  }

  /**
   * Create a matrix from a 2D array
   */
  static from2D(arr: number[][]): Matrix {
    const rows = arr.length;
    if (rows === 0) {
      throw new Error('Cannot create matrix from empty array');
    }
    const cols = arr[0]?.length ?? 0;
    if (cols === 0) {
      throw new Error('Cannot create matrix with zero columns');
    }
    
    const m = new Matrix(rows, cols);
    for (let i = 0; i < rows; i++) {
      const row = arr[i];
      if (!row || row.length !== cols) {
        throw new Error(`Row ${i} has inconsistent length`);
      }
      for (let j = 0; j < cols; j++) {
        m.set(i, j, row[j] ?? 0);
      }
    }
    return m;
  }

  /**
   * Get element at (i, j)
   */
  get(i: number, j: number): number {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols) {
      throw new Error(`Index out of bounds: (${i}, ${j}) in ${this.rows}x${this.cols} matrix`);
    }
    return this.data[i * this.cols + j] ?? 0;
  }

  /**
   * Set element at (i, j)
   */
  set(i: number, j: number, value: number): void {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols) {
      throw new Error(`Index out of bounds: (${i}, ${j}) in ${this.rows}x${this.cols} matrix`);
    }
    this.data[i * this.cols + j] = value;
  }

  /**
   * Add value to element at (i, j)
   */
  add(i: number, j: number, value: number): void {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols) {
      throw new Error(`Index out of bounds: (${i}, ${j}) in ${this.rows}x${this.cols} matrix`);
    }
    const idx = i * this.cols + j;
    this.data[idx] = (this.data[idx] ?? 0) + value;
  }

  /**
   * Create a deep copy
   */
  clone(): Matrix {
    return new Matrix(this.rows, this.cols, new Float64Array(this.data));
  }

  /**
   * Get the transpose
   */
  transpose(): Matrix {
    const result = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(j, i, this.get(i, j));
      }
    }
    return result;
  }

  /**
   * Extract diagonal elements
   */
  diagonal(): number[] {
    const n = Math.min(this.rows, this.cols);
    const diag: number[] = [];
    for (let i = 0; i < n; i++) {
      diag.push(this.get(i, i));
    }
    return diag;
  }

  /**
   * Matrix addition
   */
  addMatrix(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error(`Dimension mismatch: ${this.rows}x${this.cols} + ${other.rows}x${other.cols}`);
    }
    
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) {
      result.data[i] = (this.data[i] ?? 0) + (other.data[i] ?? 0);
    }
    return result;
  }

  /**
   * Matrix subtraction
   */
  subtractMatrix(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error(`Dimension mismatch: ${this.rows}x${this.cols} - ${other.rows}x${other.cols}`);
    }
    
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) {
      result.data[i] = (this.data[i] ?? 0) - (other.data[i] ?? 0);
    }
    return result;
  }

  /**
   * Scalar multiplication
   */
  scale(scalar: number): Matrix {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) {
      result.data[i] = (this.data[i] ?? 0) * scalar;
    }
    return result;
  }

  /**
   * Matrix multiplication
   */
  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error(`Dimension mismatch: ${this.rows}x${this.cols} * ${other.rows}x${other.cols}`);
    }
    
    const result = new Matrix(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.get(i, k) * other.get(k, j);
        }
        result.set(i, j, sum);
      }
    }
    return result;
  }

  /**
   * Matrix-vector multiplication
   */
  multiplyVector(v: number[]): number[] {
    if (this.cols !== v.length) {
      throw new Error(`Dimension mismatch: ${this.rows}x${this.cols} * vector[${v.length}]`);
    }
    
    const result: number[] = new Array(this.rows).fill(0);
    for (let i = 0; i < this.rows; i++) {
      let sum = 0;
      for (let j = 0; j < this.cols; j++) {
        sum += this.get(i, j) * (v[j] ?? 0);
      }
      result[i] = sum;
    }
    return result;
  }

  /**
   * Extract a submatrix given row and column indices
   */
  extractSubmatrix(rowIndices: number[], colIndices: number[]): Matrix {
    const result = new Matrix(rowIndices.length, colIndices.length);
    for (let i = 0; i < rowIndices.length; i++) {
      for (let j = 0; j < colIndices.length; j++) {
        const ri = rowIndices[i];
        const cj = colIndices[j];
        if (ri === undefined || cj === undefined) {
          throw new Error('Invalid indices');
        }
        result.set(i, j, this.get(ri, cj));
      }
    }
    return result;
  }

  /**
   * Extract a row as an array
   */
  getRow(i: number): number[] {
    if (i < 0 || i >= this.rows) {
      throw new Error(`Row index out of bounds: ${i}`);
    }
    const row: number[] = [];
    for (let j = 0; j < this.cols; j++) {
      row.push(this.get(i, j));
    }
    return row;
  }

  /**
   * Extract a column as an array
   */
  getColumn(j: number): number[] {
    if (j < 0 || j >= this.cols) {
      throw new Error(`Column index out of bounds: ${j}`);
    }
    const col: number[] = [];
    for (let i = 0; i < this.rows; i++) {
      col.push(this.get(i, j));
    }
    return col;
  }

  /**
   * Set a row from an array
   */
  setRow(i: number, values: number[]): void {
    if (i < 0 || i >= this.rows) {
      throw new Error(`Row index out of bounds: ${i}`);
    }
    if (values.length !== this.cols) {
      throw new Error(`Values length ${values.length} doesn't match columns ${this.cols}`);
    }
    for (let j = 0; j < this.cols; j++) {
      this.set(i, j, values[j] ?? 0);
    }
  }

  /**
   * Set a column from an array
   */
  setColumn(j: number, values: number[]): void {
    if (j < 0 || j >= this.cols) {
      throw new Error(`Column index out of bounds: ${j}`);
    }
    if (values.length !== this.rows) {
      throw new Error(`Values length ${values.length} doesn't match rows ${this.rows}`);
    }
    for (let i = 0; i < this.rows; i++) {
      this.set(i, j, values[i] ?? 0);
    }
  }

  /**
   * Check if matrix is square
   */
  isSquare(): boolean {
    return this.rows === this.cols;
  }

  /**
   * Check if matrix is symmetric (within tolerance)
   */
  isSymmetric(tolerance: number = 1e-10): boolean {
    if (!this.isSquare()) return false;
    
    for (let i = 0; i < this.rows; i++) {
      for (let j = i + 1; j < this.cols; j++) {
        if (Math.abs(this.get(i, j) - this.get(j, i)) > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Frobenius norm
   */
  norm(): number {
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) {
      const val = this.data[i] ?? 0;
      sum += val * val;
    }
    return Math.sqrt(sum);
  }

  /**
   * Max absolute value
   */
  maxAbs(): number {
    let max = 0;
    for (let i = 0; i < this.data.length; i++) {
      max = Math.max(max, Math.abs(this.data[i] ?? 0));
    }
    return max;
  }

  /**
   * Convert to 2D array (for debugging/display)
   */
  to2D(): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result.push(this.getRow(i));
    }
    return result;
  }

  /**
   * Pretty print (for debugging)
   */
  toString(precision: number = 4): string {
    const lines: string[] = [];
    for (let i = 0; i < this.rows; i++) {
      const row = this.getRow(i).map(v => v.toFixed(precision).padStart(precision + 6));
      lines.push(`[ ${row.join('  ')} ]`);
    }
    return lines.join('\n');
  }
}

/**
 * Vector operations (arrays treated as column vectors)
 */
export function vectorAdd(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} + ${b.length}`);
  }
  return a.map((v, i) => v + (b[i] ?? 0));
}

export function vectorSubtract(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} - ${b.length}`);
  }
  return a.map((v, i) => v - (b[i] ?? 0));
}

export function vectorScale(v: number[], scalar: number): number[] {
  return v.map(x => x * scalar);
}

export function vectorDot(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} · ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return sum;
}

export function vectorNorm(v: number[]): number {
  return Math.sqrt(vectorDot(v, v));
}

/**
 * Extract subvector by indices
 */
export function extractSubvector(v: number[], indices: number[]): number[] {
  return indices.map(i => {
    const val = v[i];
    if (val === undefined) {
      throw new Error(`Index ${i} out of bounds for vector of length ${v.length}`);
    }
    return val;
  });
}

/**
 * Expand subvector back to full vector (zeros for missing indices)
 */
export function expandVector(
  subVector: number[],
  subIndices: number[],
  fullLength: number
): number[] {
  const result = new Array(fullLength).fill(0);
  for (let i = 0; i < subIndices.length; i++) {
    const idx = subIndices[i];
    if (idx !== undefined && idx >= 0 && idx < fullLength) {
      result[idx] = subVector[i] ?? 0;
    }
  }
  return result;
}
