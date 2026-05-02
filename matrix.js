/**
 * Classe Matrix para operações de Álgebra Linear
 * Essencial para o processamento de Redes Neurais sem bibliotecas externas.
 */
class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = Array.from({ length: rows }, () => Array(cols).fill(0));
    }

    /**
     * Cria uma matriz com valores aleatórios entre -1 e 1
     */
    randomize() {
        this.data = this.data.map(row => row.map(() => Math.random() * 2 - 1));
        return this;
    }

    /**
     * Converte um array em uma matriz de uma coluna (vetor)
     */
    static fromArray(arr) {
        let m = new Matrix(arr.length, 1);
        for (let i = 0; i < arr.length; i++) {
            m.data[i][0] = arr[i];
        }
        return m;
    }

    /**
     * Converte a matriz de volta para um array plano
     */
    toArray() {
        let arr = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                arr.push(this.data[i][j]);
            }
        }
        return arr;
    }

    /**
     * Adiciona um escalar ou outra matriz
     */
    add(n) {
        if (n instanceof Matrix) {
            if (this.rows !== n.rows || this.cols !== n.cols) {
                console.error('Colunas e Linhas devem ser iguais para adição.');
                return;
            }
            this.map((val, i, j) => val + n.data[i][j]);
        } else {
            this.map(val => val + n);
        }
        return this;
    }

    /**
     * Multiplicação de Matrizes (Dot Product)
     */
    static multiply(a, b) {
        if (a.cols !== b.rows) {
            console.error('Colunas de A devem bater com Linhas de B.');
            return null;
        }
        let result = new Matrix(a.rows, b.cols);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
                let sum = 0;
                for (let k = 0; k < a.cols; k++) {
                    sum += a.data[i][k] * b.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        return result;
    }

    /**
     * Multiplicação Element-wise ou Escalar
     */
    multiply(n) {
        if (n instanceof Matrix) {
            this.map((val, i, j) => val * n.data[i][j]);
        } else {
            this.map(val => val * n);
        }
        return this;
    }

    /**
     * Aplica uma função a cada elemento da matriz
     */
    map(func) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let val = this.data[i][j];
                this.data[i][j] = func(val, i, j);
            }
        }
        return this;
    }

    /**
     * Retorna uma cópia da matriz
     */
    copy() {
        let m = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                m.data[i][j] = this.data[i][j];
            }
        }
        return m;
    }

    /**
     * Transposição de Matriz
     */
    static transpose(matrix) {
        let result = new Matrix(matrix.cols, matrix.rows);
        for (let i = 0; i < matrix.rows; i++) {
            for (let j = 0; j < matrix.cols; j++) {
                result.data[j][i] = matrix.data[i][j];
            }
        }
        return result;
    }
}

if (typeof module !== 'undefined') {
    module.exports = Matrix;
}
