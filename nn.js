/**
 * Classe NeuralNetwork (MLP - Multi-Layer Perceptron)
 * Implementada do zero usando a classe Matrix.
 */
class NeuralNetwork {
    constructor(input_nodes, hidden_nodes, output_nodes) {
        if (input_nodes instanceof NeuralNetwork) {
            let a = input_nodes;
            this.input_nodes = a.input_nodes;
            this.hidden_nodes = a.hidden_nodes;
            this.output_nodes = a.output_nodes;

            this.weights_ih = a.weights_ih.copy();
            this.weights_ho = a.weights_ho.copy();

            this.bias_h = a.bias_h.copy();
            this.bias_o = a.bias_o.copy();
        } else {
            this.input_nodes = input_nodes;
            this.hidden_nodes = hidden_nodes;
            this.output_nodes = output_nodes;

            this.weights_ih = new Matrix(this.hidden_nodes, this.input_nodes);
            this.weights_ho = new Matrix(this.output_nodes, this.hidden_nodes);
            this.weights_ih.randomize();
            this.weights_ho.randomize();

            this.bias_h = new Matrix(this.hidden_nodes, 1);
            this.bias_o = new Matrix(this.output_nodes, 1);
            this.bias_h.randomize();
            this.bias_o.randomize();
        }
    }

    /**
     * Função de Ativação Sigmóide
     */
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    /**
     * Processa as entradas e retorna as saídas (Feedforward)
     */
    predict(input_array) {
        // Gerando as saídas da camada oculta
        let inputs = Matrix.fromArray(input_array);
        let hidden = Matrix.multiply(this.weights_ih, inputs);
        hidden.add(this.bias_h);
        // Função de ativação
        hidden.map(this.sigmoid);

        // Gerando a saída final
        let output = Matrix.multiply(this.weights_ho, hidden);
        output.add(this.bias_o);
        output.map(this.sigmoid);

        // Retorna o resultado como array
        return output.toArray();
    }

    /**
     * Cria uma cópia exata desta rede neural
     */
    copy() {
        return new NeuralNetwork(this);
    }

    /**
     * Aplica mutação gaussiana nos pesos e bias
     * @param {number} rate - Taxa de mutação (ex: 0.1 para 10%)
     */
    mutate(rate) {
        function mutateFn(val) {
            if (Math.random() < rate) {
                // Mutação Gaussiana Simples: adiciona um pequeno valor aleatório
                return val + Math.random() * 0.2 - 0.1;
                // Para mutação Gaussiana real: val + randomGaussian() * 0.5
            } else {
                return val;
            }
        }

        this.weights_ih.map(mutateFn);
        this.weights_ho.map(mutateFn);
        this.bias_h.map(mutateFn);
        this.bias_o.map(mutateFn);
    }
}

if (typeof module !== 'undefined') {
    module.exports = NeuralNetwork;
}
